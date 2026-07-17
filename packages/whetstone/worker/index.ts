// The whetstone judge service: a queue-less v0 Worker.
// POST /api/submit  {problemId, sheetUrl} → 202 {submissionId}; judging runs
// in ctx.waitUntil (IO-bound, well under CPU limits). GET /api/submission/:id
// polls the verdict. Scratch sheets are deleted after clean verdicts
// (drive.file scope); failures keep theirs for debugging — natural quarantine.
// Upgrade path when volume demands it: CF Queues consumer + scratch pool.
import { deleteSpreadsheet, parseSpreadsheetId, setTokenProvider } from "../src/api.js";
import { judge } from "../src/judge.js";
import type { Problem } from "../src/problem-types.js";
import problemsJson from "./problems.gen.json";

export interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
  ALLOWED_ORIGIN?: string;
}

const PROBLEMS = problemsJson as unknown as Record<string, Problem>;
const RATE_LIMIT = { max: 10, windowMs: 10 * 60_000 };

let cachedToken: { value: string; expiresAt: number } | null = null;
function tokenProviderFor(env: Env): () => Promise<string> {
  return async () => {
    if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.value;
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: env.GOOGLE_REFRESH_TOKEN,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) throw new Error(`judge token refresh failed: ${res.status}`);
    const t = (await res.json()) as { access_token: string; expires_in: number };
    cachedToken = { value: t.access_token, expiresAt: Date.now() + t.expires_in * 1000 };
    return cachedToken.value;
  };
}

function corsHeaders(env: Env): Record<string, string> {
  return {
    "access-control-allow-origin": env.ALLOWED_ORIGIN ?? "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}

function json(env: Env, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders(env) },
  });
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(env) });
    if (req.method === "POST" && url.pathname === "/api/submit") return submit(req, env, ctx);
    const poll = url.pathname.match(/^\/api\/submission\/([0-9a-f-]{36})$/);
    if (req.method === "GET" && poll) return getSubmission(poll[1], env);
    if (req.method === "GET" && url.pathname === "/api/problems") {
      return json(
        env,
        Object.values(PROBLEMS).map((p) => ({ id: p.id, title: p.title, difficulty: p.difficulty })),
      );
    }
    return json(env, { error: "not found" }, 404);
  },
};

async function submit(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { problemId?: string; sheetUrl?: string } | null;
  const problem = body?.problemId ? PROBLEMS[body.problemId] : undefined;
  if (!problem) return json(env, { error: "unknown problemId" }, 400);
  const sheetId = body?.sheetUrl ? parseSpreadsheetId(body.sheetUrl) : "";
  if (!/^[\w-]{20,}$/.test(sheetId)) return json(env, { error: "that doesn't look like a sheet link" }, 400);

  const ipHash = await sha256(req.headers.get("cf-connecting-ip") ?? "unknown");
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM submissions WHERE ip_hash = ?1 AND created_at > ?2",
  )
    .bind(ipHash, Date.now() - RATE_LIMIT.windowMs)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= RATE_LIMIT.max) {
    return json(env, { error: "rate limited — try again in a few minutes" }, 429);
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare(
    "INSERT INTO submissions (id, problem_id, sheet_id, ip_hash, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, 'running', ?5, ?5)",
  )
    .bind(id, problem.id, sheetId, ipHash, now)
    .run();

  ctx.waitUntil(process(id, problem, sheetId, env));
  return json(env, { submissionId: id }, 202);
}

async function process(id: string, problem: Problem, sheetId: string, env: Env): Promise<void> {
  setTokenProvider(tokenProviderFor(env));
  try {
    const result = await judge(problem, sheetId);

    // disclosure rule enforced at the API boundary: hidden cases expose only
    // pass + coarse category; the sample case may carry its mismatch detail
    const cases = result.cases.map((c) => ({
      kind: c.kind,
      pass: c.comparison.pass,
      category: c.comparison.category,
      mismatches: c.kind === "sample" ? c.comparison.mismatches.slice(0, 10) : undefined,
    }));

    // clean verdicts don't need their scratch kept; failures keep theirs
    let scratch = result.scratchId ?? null;
    if (scratch && (result.verdict === "accepted" || result.verdict === "wrong-answer")) {
      const deleted = await deleteSpreadsheet(scratch).catch(() => false);
      if (deleted) scratch = null;
    }

    await env.DB.prepare(
      "UPDATE submissions SET status = 'done', verdict = ?1, detail = ?2, scratch_id = ?3, updated_at = ?4 WHERE id = ?5",
    )
      .bind(result.verdict, JSON.stringify({ lintErrors: result.lintErrors, cases }), scratch, Date.now(), id)
      .run();
  } catch (err) {
    await env.DB.prepare(
      "UPDATE submissions SET status = 'done', verdict = 'judge-error', detail = ?1, updated_at = ?2 WHERE id = ?3",
    )
      .bind(JSON.stringify({ message: String(err instanceof Error ? err.message : err) }), Date.now(), id)
      .run();
  }
}

async function getSubmission(id: string, env: Env): Promise<Response> {
  const row = await env.DB.prepare(
    "SELECT problem_id, status, verdict, detail, created_at FROM submissions WHERE id = ?1",
  )
    .bind(id)
    .first<{ problem_id: string; status: string; verdict: string | null; detail: string | null; created_at: number }>();
  if (!row) return json(env, { error: "not found" }, 404);
  return json(env, {
    problemId: row.problem_id,
    status: row.status,
    verdict: row.verdict,
    detail: row.detail ? JSON.parse(row.detail) : null,
  });
}

async function sha256(s: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
