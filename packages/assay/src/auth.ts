import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const TOKEN_PATH = join(homedir(), ".assayrc.json");
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  // Lets the gsheets driver delete its own run workbooks. Tokens minted before
  // this scope was added cannot delete; re-run `assay login`.
  "https://www.googleapis.com/auth/drive.file",
];
const REDIRECT_PORT = 8090;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;

export interface ClientCredentials {
  clientId: string;
  clientSecret: string;
}

interface TokenData {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

// load OAuth client creds — env first, then cwd, then project root
export function loadCredentials(): ClientCredentials {
  const envJson = process.env.ASSAY_GOOGLE_CREDENTIALS_JSON;
  if (envJson) {
    return parseCredentialsJson(envJson, "ASSAY_GOOGLE_CREDENTIALS_JSON");
  }

  const envPath = process.env.ASSAY_GOOGLE_CREDENTIALS_PATH;
  if (envPath) {
    return loadCredentialsFile(envPath);
  }

  const candidates = [
    join(process.cwd(), "credentials.json"),
    join(dirname(fileURLToPath(import.meta.url)), "..", "credentials.json"),
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      return loadCredentialsFile(path);
    }
  }

  throw new Error(
    "credentials.json not found. Download OAuth client credentials from Google Cloud Console\n" +
      "and place the file in the assay project root.",
  );
}

function loadCredentialsFile(path: string): ClientCredentials {
  return parseCredentialsJson(readFileSync(path, "utf8"), path);
}

function parseCredentialsJson(json: string, source: string): ClientCredentials {
  const raw = JSON.parse(json);
  const creds = raw.installed || raw.web;
  if (!creds) {
    throw new Error(`Invalid Google credentials at ${source}: missing "installed" or "web" key`);
  }
  return {
    clientId: creds.client_id,
    clientSecret: creds.client_secret,
  };
}

// returns null if not logged in
export async function getAccessToken(): Promise<string | null> {
  const envToken = process.env.ASSAY_GOOGLE_TOKEN_JSON;
  if (envToken) {
    const data: TokenData = JSON.parse(envToken);
    if (Date.now() > data.expiry_date - 60_000) {
      const refreshed = await refreshToken(data.refresh_token);
      if (!refreshed) return null;
      return refreshed.access_token;
    }
    return data.access_token;
  }

  if (!existsSync(TOKEN_PATH)) return null;

  const data: TokenData = JSON.parse(readFileSync(TOKEN_PATH, "utf8"));

  // 60s buffer so a token in flight doesn't expire mid-request
  if (Date.now() > data.expiry_date - 60_000) {
    const refreshed = await refreshToken(data.refresh_token);
    if (!refreshed) return null;
    return refreshed.access_token;
  }

  return data.access_token;
}

// interactive OAuth login — opens a browser
export async function login(): Promise<void> {
  const creds = loadCredentials();

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${creds.clientId}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(SCOPES.join(" "))}` +
    `&access_type=offline` +
    `&prompt=consent`;

  console.log("Opening browser for Google authentication...\n");
  console.log("If the browser doesn't open, visit:\n");
  console.log(authUrl + "\n");

  const { exec } = await import("node:child_process");
  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";
  exec(`${cmd} "${authUrl}"`);

  const code = await waitForAuthCode();

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  }

  const tokens = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const tokenData: TokenData = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: Date.now() + tokens.expires_in * 1000,
  };

  writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
  console.log("Authenticated. Token saved to ~/.assayrc.json");
}

async function refreshToken(
  refreshTokenStr: string,
): Promise<TokenData | null> {
  const creds = loadCredentials();

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshTokenStr,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;

  const tokens = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  const tokenData: TokenData = {
    access_token: tokens.access_token,
    refresh_token: refreshTokenStr,
    expiry_date: Date.now() + tokens.expires_in * 1000,
  };

  writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
  return tokenData;
}

function waitForAuthCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url || "/", `http://localhost:${REDIRECT_PORT}`);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(
          `<h2>Authentication failed: ${error}</h2><p>You can close this tab.</p>`,
        );
        server.close();
        reject(new Error(`Auth failed: ${error}`));
        return;
      }

      if (code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          `<h2>Authenticated!</h2><p>You can close this tab and return to the terminal.</p>`,
        );
        server.close();
        resolve(code);
        return;
      }

      res.writeHead(400);
      res.end("Missing code parameter");
    });

    server.listen(REDIRECT_PORT, () => {
      const timeout = setTimeout(() => {
        server.close();
        reject(new Error("Authentication timed out"));
      }, 120_000);
      timeout.unref();
    });
  });
}
