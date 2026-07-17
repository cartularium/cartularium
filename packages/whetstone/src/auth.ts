// Whetstone's own token store (~/.whetstonerc.json) so the judge service
// identity stays separate from the developer's personal assay token.
// Interim coupling: reuses assay's published OAuth client (same client id/secret,
// same registered localhost redirect) until whetstone owns a client of its own.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const TOKEN_PATH = join(homedir(), ".whetstonerc.json");
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive.file"];
const REDIRECT_PORT = 8090; // must match the redirect URI registered on assay's client
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;

interface ClientCredentials {
  clientId: string;
  clientSecret: string;
}

interface TokenData {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}

function loadClientCredentials(): ClientCredentials {
  const pkg = join(dirname(fileURLToPath(import.meta.url)), "..");
  // whetstone's own OAuth client first; assay's published client as fallback
  const candidates = [
    process.env.WHETSTONE_GOOGLE_CREDENTIALS_PATH,
    join(pkg, "credentials.json"),
    join(pkg, "..", "assay", "credentials.json"),
  ].filter((p): p is string => Boolean(p));
  const path = candidates.find((p) => existsSync(p));
  if (!path) {
    throw new Error(
      `OAuth client credentials not found (tried ${candidates.join(", ")}); ` +
        "set WHETSTONE_GOOGLE_CREDENTIALS_PATH or place credentials.json in packages/whetstone/",
    );
  }
  const raw = JSON.parse(readFileSync(path, "utf8"));
  const creds = raw.installed || raw.web;
  if (!creds) throw new Error(`Invalid credentials file at ${path}`);
  return { clientId: creds.client_id, clientSecret: creds.client_secret };
}

/** null when no judge-identity token exists (callers fall back to assay's token) */
export async function getJudgeAccessToken(): Promise<string | null> {
  const envToken = process.env.WHETSTONE_GOOGLE_TOKEN_JSON;
  const data: TokenData | null = envToken
    ? (JSON.parse(envToken) as TokenData)
    : existsSync(TOKEN_PATH)
      ? (JSON.parse(readFileSync(TOKEN_PATH, "utf8")) as TokenData)
      : null;
  if (!data) return null;
  if (Date.now() > data.expiry_date - 60_000) {
    const refreshed = await refresh(data.refresh_token);
    return refreshed?.access_token ?? null;
  }
  return data.access_token;
}

async function refresh(refreshToken: string): Promise<TokenData | null> {
  const creds = loadClientCredentials();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const tokens = (await res.json()) as { access_token: string; expires_in: number };
  const data: TokenData = {
    access_token: tokens.access_token,
    refresh_token: refreshToken,
    expiry_date: Date.now() + tokens.expires_in * 1000,
  };
  writeFileSync(TOKEN_PATH, JSON.stringify(data, null, 2));
  return data;
}

// interactive login — sign in as the JUDGE account in the browser window
export async function loginAsJudge(): Promise<void> {
  const creds = loadClientCredentials();
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${creds.clientId}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent(SCOPES.join(" "))}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&select_account=true`;

  console.log("Opening browser. SIGN IN AS THE JUDGE ACCOUNT (not your personal account).\n");
  console.log("If the browser doesn't open, or opens the wrong profile, paste this URL");
  console.log("into a window signed into the judge account:\n");
  console.log(authUrl + "\n");

  const { exec } = await import("node:child_process");
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
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
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  const tokens = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  writeFileSync(
    TOKEN_PATH,
    JSON.stringify(
      {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: Date.now() + tokens.expires_in * 1000,
      },
      null,
      2,
    ),
  );
  console.log(`Judge identity token saved to ${TOKEN_PATH}`);
  console.log("Whetstone tools now act as the judge account. Your assay token is untouched.");
}

function waitForAuthCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url || "/", REDIRECT_URI);
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      if (error) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(`<h2>Authentication failed: ${error}</h2>`);
        server.close();
        reject(new Error(`Auth failed: ${error}`));
        return;
      }
      if (code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h2>Judge identity authenticated.</h2><p>You can close this tab.</p>");
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
      }, 180_000);
      timeout.unref();
    });
  });
}
