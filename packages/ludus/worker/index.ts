// The ludus judge service: a queue-less v0 Worker.
// POST /api/submit  {problemId, sheetUrl} → 202 {submissionId}; judging runs
// in ctx.waitUntil (IO-bound, well under CPU limits). GET /api/submission/:id
// polls the verdict. Scratch sheets are deleted after clean verdicts
// (drive.file scope); failures keep theirs for debugging — natural quarantine.
// Upgrade path when volume demands it: CF Queues consumer + scratch pool.
import { deleteSpreadsheet, parseSpreadsheetId, setTokenProvider, sheetsApi } from "../src/api.js";
import { judge } from "../src/judge.js";
import { inlineSnapshotNamedFunctions } from "../src/named-function-materializer.js";
import type { Problem } from "../src/problem-types.js";
import {
  buildPostSolveStats,
  isSolutionMetrics,
  measureSolution,
  type PostSolveStats,
  type SolutionMetrics,
} from "../src/solution-stats.js";
import type { Snapshot } from "../src/snapshot.js";
import problemsJson from "./problems.gen.json";

export interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
  ALLOWED_ORIGIN?: string;
  NAMED_FUNCTION_MATERIALIZER?: string;
}

const PROBLEMS = problemsJson as unknown as Record<string, Problem>;
const RATE_LIMIT = { max: 10, windowMs: 10 * 60_000 };
// free-tier CPU guard: bound the extraction payload by refusing huge grids
// (capacity counts empty cells too — a fresh tab is 1000×26 = 26k)
const MAX_GRID_CELLS = 250_000;
// submissions running longer than this are considered stalled (waitUntil died)
const STALL_MS = 3 * 60_000;
const MAX_STORED_PROGRAM_BYTES = 900_000; // stay under D1 value limits
const STATS_COHORT_LIMIT = 500;

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

// ALLOWED_ORIGIN: "*", or a comma-separated allowlist — the request's Origin
// is echoed back when it matches (a single CORS header can't carry a list)
function corsHeaders(env: Env, req: Request): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGIN ?? "*").split(",").map((s) => s.trim());
  const origin = req.headers.get("origin");
  const allow = allowed.includes("*") ? "*" : origin && allowed.includes(origin) ? origin : allowed[0];
  return {
    "access-control-allow-origin": allow,
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "origin",
  };
}

function json(env: Env, req: Request, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders(env, req) },
  });
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(env, req) });
    if (req.method === "POST" && url.pathname === "/api/submit") return submit(req, env, ctx);
    const poll = url.pathname.match(/^\/api\/submission\/([0-9a-f-]{36})$/);
    if (req.method === "GET" && poll) return getSubmission(poll[1], env, req);
    if (req.method === "GET" && url.pathname === "/api/problems") {
      return json(
        env,
        req,
        Object.values(PROBLEMS).map((p) => ({ id: p.id, title: p.title, difficulty: p.difficulty })),
      );
    }
    return json(env, req, { error: "not found" }, 404);
  },
};

async function submit(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const body = (await req.json().catch(() => null)) as { problemId?: string; sheetUrl?: string } | null;
  const problem = body?.problemId ? PROBLEMS[body.problemId] : undefined;
  if (!problem) return json(env, req, { error: "unknown problemId" }, 400);
  const sheetId = body?.sheetUrl ? parseSpreadsheetId(body.sheetUrl) : "";
  if (!/^[\w-]{20,}$/.test(sheetId)) return json(env, req, { error: "that doesn't look like a sheet link" }, 400);

  const ipHash = await sha256(req.headers.get("cf-connecting-ip") ?? "unknown");
  const recent = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM submissions WHERE ip_hash = ?1 AND created_at > ?2",
  )
    .bind(ipHash, Date.now() - RATE_LIMIT.windowMs)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= RATE_LIMIT.max) {
    return json(env, req, { error: "rate limited — try again in a few minutes" }, 429);
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare(
    "INSERT INTO submissions (id, problem_id, sheet_id, ip_hash, status, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, 'running', ?5, ?5)",
  )
    .bind(id, problem.id, sheetId, ipHash, now)
    .run();

  ctx.waitUntil(process(id, problem, sheetId, env));
  return json(env, req, { submissionId: id }, 202);
}

async function process(id: string, problem: Problem, sheetId: string, env: Env): Promise<void> {
  setTokenProvider(tokenProviderFor(env));
  try {
    const oversize = await gridCellCount(sheetId).catch(() => null); // access errors fall through to judge()
    if (oversize !== null && oversize > MAX_GRID_CELLS) {
      await env.DB.prepare(
        "UPDATE submissions SET status = 'done', verdict = 'lint-reject', detail = ?1, updated_at = ?2 WHERE id = ?3",
      )
        .bind(
          JSON.stringify({
            lintErrors: [
              `sheet too large to judge (${oversize.toLocaleString()} grid cells; limit ${MAX_GRID_CELLS.toLocaleString()}). ` +
                "Empty rows and columns count — trim unused rows/columns/tabs (a fresh tab alone is 26,000 cells).",
            ],
            cases: [],
          }),
          Date.now(),
          id,
        )
        .run();
      return;
    }

    const result = await judge(problem, sheetId, {
      ...(env.NAMED_FUNCTION_MATERIALIZER === "inline"
        ? { prepareNamedFunctions: inlineSnapshotNamedFunctions }
        : {}),
    });

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

    const program = storableProgram(result.program);
    const metrics =
      result.verdict === "accepted" && result.program && program
        ? JSON.stringify(measureSolution(result.program))
        : null;
    await env.DB.prepare(
      "UPDATE submissions SET status = 'done', verdict = ?1, detail = ?2, scratch_id = ?3, program = ?4, metrics = ?5, updated_at = ?6 WHERE id = ?7",
    )
      .bind(
        result.verdict,
        JSON.stringify({ lintErrors: result.lintErrors, cases }),
        scratch,
        program,
        metrics,
        Date.now(),
        id,
      )
      .run();
  } catch (err) {
    await env.DB.prepare(
      "UPDATE submissions SET status = 'done', verdict = 'judge-error', detail = ?1, updated_at = ?2 WHERE id = ?3",
    )
      .bind(JSON.stringify({ message: String(err instanceof Error ? err.message : err) }), Date.now(), id)
      .run();
  }
}

async function getSubmission(id: string, env: Env, req: Request): Promise<Response> {
  const row = await env.DB.prepare(
    "SELECT problem_id, status, verdict, detail, metrics, updated_at FROM submissions WHERE id = ?1",
  )
    .bind(id)
    .first<{
      problem_id: string;
      status: string;
      verdict: string | null;
      detail: string | null;
      metrics: string | null;
      updated_at: number;
    }>();
  if (!row) return json(env, req, { error: "not found" }, 404);

  // stale recovery: a submission stuck in 'running' means the judging
  // waitUntil died (CPU cap, crash) — convert to a clear, retryable failure.
  // A late-finishing judge overwriting this afterwards is harmless.
  if (row.status === "running" && Date.now() - row.updated_at > STALL_MS) {
    const detail = JSON.stringify({ message: "judging stalled — please resubmit" });
    await env.DB.prepare(
      "UPDATE submissions SET status = 'done', verdict = 'judge-error', detail = ?1, updated_at = ?2 WHERE id = ?3 AND status = 'running'",
    )
      .bind(detail, Date.now(), id)
      .run();
    return json(env, req, {
      problemId: row.problem_id,
      status: "done",
      verdict: "judge-error",
      detail: JSON.parse(detail),
    });
  }

  const stats = row.verdict === "accepted" ? await postSolveStats(row.problem_id, row.metrics, env) : null;
  return json(env, req, {
    problemId: row.problem_id,
    status: row.status,
    verdict: row.verdict,
    detail: row.detail ? JSON.parse(row.detail) : null,
    stats,
  });
}

async function postSolveStats(
  problemId: string,
  currentJson: string | null,
  env: Env,
): Promise<PostSolveStats | null> {
  const current = parseMetrics(currentJson);
  if (!current) return null;
  const rows = await env.DB.prepare(
    "SELECT metrics FROM submissions WHERE problem_id = ?1 AND verdict = 'accepted' AND metrics IS NOT NULL ORDER BY created_at DESC LIMIT ?2",
  )
    .bind(problemId, STATS_COHORT_LIMIT)
    .all<{ metrics: string }>();
  const accepted = rows.results.flatMap((row) => {
    const metrics = parseMetrics(row.metrics);
    return metrics ? [metrics] : [];
  });
  return buildPostSolveStats(current, accepted);
}

function parseMetrics(json: string | null): SolutionMetrics | null {
  if (!json) return null;
  try {
    const value: unknown = JSON.parse(json);
    return isSolutionMetrics(value) ? value : null;
  } catch {
    return null;
  }
}

async function gridCellCount(sheetId: string): Promise<number> {
  const meta = (await sheetsApi(
    `/${sheetId}?fields=${encodeURIComponent("sheets(properties(gridProperties(rowCount,columnCount)))")}`,
  )) as { sheets?: Array<{ properties: { gridProperties?: { rowCount?: number; columnCount?: number } } }> };
  return (meta.sheets ?? []).reduce(
    (n, s) => n + (s.properties.gridProperties?.rowCount ?? 0) * (s.properties.gridProperties?.columnCount ?? 0),
    0,
  );
}

// store what powers future stats: entered values + number formats, computed
// values stripped; null when oversized
function storableProgram(program: Snapshot | undefined): string | null {
  if (!program) return null;
  const stripped = {
    title: program.title,
    namedRanges: program.namedRanges,
    namedFunctions: program.namedFunctions,
    sheets: program.sheets.map((s) => ({
      title: s.title,
      cells: s.cells.map((row) => row.map((c) => (c ? { ue: c.ue, fmt: c.fmt } : null))),
    })),
  };
  const jsonStr = JSON.stringify(stripped);
  return jsonStr.length > MAX_STORED_PROGRAM_BYTES ? null : jsonStr;
}

async function sha256(s: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
