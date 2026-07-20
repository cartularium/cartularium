const SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets";
const MAX_XLSX_BYTES = 12 * 1024 * 1024;

export class UnsupportedWorkbookError extends Error {
  override name = "UnsupportedWorkbookError";
}

interface XlsxExportDependencies {
  fetch: typeof fetch;
  sleep: typeof sleep;
}

// Runtime-agnostic auth seam: node CLIs install a provider via useNodeAuth()
// (node-auth.ts); the Worker installs a refresh-token provider from its env.
// Providers own their caching/refresh.
let tokenProvider: (() => Promise<string>) | null = null;

export function setTokenProvider(provider: () => Promise<string>): void {
  tokenProvider = provider;
}

async function token(): Promise<string> {
  if (!tokenProvider) {
    throw new Error(
      "No token provider configured — CLIs call useNodeAuth(); the Worker calls setTokenProvider().",
    );
  }
  return tokenProvider();
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

// Sheets exposes named functions only through its XLSX export. Testing found
// the docs export route accepts the Sheets API OAuth identity for link-shared
// workbooks that drive.file cannot address.
export async function exportSpreadsheetXlsx(
  spreadsheetId: string,
  dependencies: Partial<XlsxExportDependencies> = {},
): Promise<Uint8Array> {
  const request = dependencies.fetch ?? fetch;
  const wait = dependencies.sleep ?? sleep;
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx`;
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await request(url, { headers: { Authorization: `Bearer ${await token()}` } });
    } catch (err) {
      if (attempt >= 4) throw err;
      await wait(1500 * 2 ** attempt);
      continue;
    }

    if (res.ok) return readBoundedResponse(res, MAX_XLSX_BYTES);
    if (res.status === 403) {
      throw new UnsupportedWorkbookError(
        "workbook export is disabled — allow viewers to download, print, and copy",
      );
    }

    const retryable = res.status === 429 || res.status >= 500;
    if (retryable && attempt < 4) {
      await res.body?.cancel();
      const retryAfter = Number(res.headers.get("retry-after")) || 0;
      await wait(Math.max(retryAfter * 1000, 1500 * 2 ** attempt));
      continue;
    }
    throw new Error(`XLSX export: ${res.status} ${(await res.text()).slice(0, 500)}`);
  }
}

export async function readBoundedResponse(res: Response, maxBytes: number): Promise<Uint8Array> {
  const declared = Number(res.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new UnsupportedWorkbookError(`XLSX export exceeds ${maxBytes} bytes`);
  }
  if (!res.body) {
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.length > maxBytes) throw new UnsupportedWorkbookError(`XLSX export exceeds ${maxBytes} bytes`);
    return bytes;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > maxBytes) {
      await reader.cancel();
      throw new UnsupportedWorkbookError(`XLSX export exceeds ${maxBytes} bytes`);
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

// Drive delete — works only for files this app created, and only when the
// token carries the drive.file scope; false on 403/404 (caller decides).
export async function deleteSpreadsheet(spreadsheetId: string): Promise<boolean> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${await token()}` },
  });
  return res.ok;
}

// Make an app-created sheet readable by anyone with its link. Used when
// publishing templates and by the production smoke test.
export async function shareSpreadsheet(spreadsheetId: string): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${spreadsheetId}/permissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${await token()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type: "anyone", role: "reader" }),
    },
  );
  if (!res.ok) {
    throw new Error(`Drive permissions.create: ${res.status} ${await res.text()}`);
  }
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
