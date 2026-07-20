// Production smoke test: build a solved sheet, share it, submit through the
// public Worker, require an accepted verdict, then delete the source sheet.
import { useNodeAuth } from "./node-auth.js";
useNodeAuth();
import { deleteSpreadsheet, shareSpreadsheet, sleep } from "./api.js";
import { loadProblem } from "./problem.js";
import { createFromTemplate } from "./template.js";

const problemPath = process.argv[2] ?? "problems/ld-0001-combine-skus.yaml";
const service = process.env.LUDUS_SERVICE_URL ?? "https://ludus-judge.astral-b83.workers.dev";
const problem = loadProblem(problemPath);
if (!problem.selftest?.alt) throw new Error(`${problem.id}: no selftest.alt`);

interface SubmissionStatus {
  status?: string;
  verdict?: string;
  detail?: unknown;
}

const sheetId = await createFromTemplate(problem, `ludus-live-smoke-${problem.id}`, {
  sampleInput: true,
  referenceFormula: problem.selftest.alt.trim(),
});

let failed = false;
try {
  await shareSpreadsheet(sheetId);
  console.log(`shared solved sheet: ${sheetId}`);

  const submit = await fetch(`${service}/api/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problemId: problem.id,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`,
    }),
  });
  const submitted = (await submit.json()) as { submissionId?: string; error?: string };
  if (!submit.ok || !submitted.submissionId) {
    throw new Error(`live submit failed: ${submit.status} ${submitted.error ?? "missing submission id"}`);
  }
  console.log(`submission accepted: ${submitted.submissionId}`);

  let done: SubmissionStatus | null = null;
  for (let attempt = 0; attempt < 40; attempt++) {
    const poll = await fetch(`${service}/api/submission/${submitted.submissionId}`);
    if (!poll.ok) throw new Error(`live poll failed: ${poll.status}`);
    done = (await poll.json()) as SubmissionStatus;
    if (done?.status === "done") break;
    await sleep(2_500);
  }
  console.log(`live verdict: ${done?.verdict ?? "TIMEOUT"}`);
  if (done?.status !== "done" || done.verdict !== "accepted") {
    console.error(JSON.stringify(done?.detail ?? null, null, 2));
    failed = true;
  }
} finally {
  const deleted = await deleteSpreadsheet(sheetId);
  console.log(`deleted solved sheet: ${deleted ? "yes" : "NO"}`);
  failed ||= !deleted;
}

if (failed) process.exit(1);
