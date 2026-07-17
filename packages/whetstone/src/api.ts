import { getAccessToken } from "assay";
import { getJudgeAccessToken } from "./auth.js";

const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

let cachedToken: string | null = null;

// prefer the judge service identity (~/.whetstonerc.json); fall back to the
// developer's personal assay token for local hacking
async function token(): Promise<string> {
  if (cachedToken) return cachedToken;
  cachedToken = await getJudgeAccessToken();
  if (cachedToken) return cachedToken;
  cachedToken = await getAccessToken();
  if (!cachedToken) {
    throw new Error(
      "No Google identity available. Run `pnpm --filter @cartularium/whetstone login` " +
        "(judge identity) or `assay login` (personal fallback).",
    );
  }
  console.error("[whetstone] no judge identity — falling back to personal assay token");
  return cachedToken;
}

// fetch with auth + backoff on 429/5xx; resolves to parsed JSON
export async function sheetsApi(
  path: string,
  init: RequestInit = {},
): Promise<Record<string, unknown>> {
  const url = `${SHEETS_BASE}${path}`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${await token()}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (res.ok) return (await res.json()) as Record<string, unknown>;
    const body = await res.text();
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt >= 4) {
      throw new Error(`Sheets API ${init.method ?? "GET"} ${path}: ${res.status} ${body}`);
    }
    const retryAfter = Number(res.headers.get("retry-after")) || 0;
    const delay = Math.max(retryAfter * 1000, 1500 * 2 ** attempt);
    await sleep(delay);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// accepts a bare id or a full docs.google.com URL
export function parseSpreadsheetId(input: string): string {
  const m = input.match(/\/d\/([\w-]+)/);
  return m ? m[1] : input;
}

export function colLetter(n: number): string {
  let s = "";
  for (let i = n; i >= 0; i = Math.floor(i / 26) - 1) {
    s = String.fromCharCode(65 + (i % 26)) + s;
  }
  return s;
}
