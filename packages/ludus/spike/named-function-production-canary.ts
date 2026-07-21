// Production named-function canary. `smoke` owns the complete create, submit,
// and delete lifecycle. The lower-level commands remain for rollout diagnosis.
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { deleteSpreadsheet, exportSpreadsheetXlsx, shareSpreadsheet, sleep } from "../src/api.js";
import { getJudgeAccessToken } from "../src/auth.js";
import { judge } from "../src/judge.js";
import { inlineSnapshotNamedFunctions } from "../src/named-function-materializer.js";
import { useNodeAuth } from "../src/node-auth.js";
import { loadProblem } from "../src/problem.js";
import { loadSheetIds, readRect, writeRect } from "../src/rect.js";
import { runCleanupSafeSmoke } from "../src/smoke-lifecycle.js";
import { createFromTemplate } from "../src/template.js";

useNodeAuth();

const command = process.argv[2];
const service = process.env.LUDUS_SERVICE_URL ?? "https://ludus-judge.astral-b83.workers.dev";
const acceptedDefinitions = [
  { name: "COUNTDOWN", definition: "LAMBDA(n,IF(n=0,0,1+COUNTDOWN(n-1)))" },
  {
    name: "SOLVE",
    definition:
      'LAMBDA(t,LET(d,FILTER(t,INDEX(t,,1)<>""),QUERY(d,"select Col1, sum(Col2), sum(Col3), sum(Col3)/sum(Col2) group by Col1 label sum(Col2) \'\', sum(Col3) \'\', sum(Col3)/sum(Col2) \'\'",0*COUNTDOWN(5))))',
  },
];
const refusalDefinitions = [
  { name: "MUTUAL_A", definition: "LAMBDA(x,MUTUAL_B(x))" },
  { name: "MUTUAL_B", definition: "LAMBDA(x,MUTUAL_A(x))" },
];

interface CanarySpec {
  name: string;
  definitions: Array<{ name: string; definition: string }>;
  formula: string;
  expected: "accepted" | { feature: "named-functions"; code: string };
}

const acceptedCanary: CanarySpec = {
  name: "accepted",
  definitions: acceptedDefinitions,
  formula: "=SOLVE({Input!A2:D9;Input!E2:H9;Input!I2:L9})",
  expected: "accepted",
};
const refusalCanary: CanarySpec = {
  name: "refusal",
  definitions: refusalDefinitions,
  formula: "=MUTUAL_A(1)",
  expected: { feature: "named-functions", code: "recursive-definition" },
};

if (command === "smoke") {
  await runCleanupSafeSmoke({
    create: () => createCanary(acceptedCanary),
    submit: (spreadsheetId) => submitCanary(spreadsheetId, acceptedCanary),
    remove: removeCanary,
  });
} else if (command === "refusal") {
  await runCleanupSafeSmoke({
    create: () => createCanary(refusalCanary),
    submit: (spreadsheetId) => submitCanary(spreadsheetId, refusalCanary),
    remove: removeCanary,
  });
} else if (command === "create") {
  await createCanary(acceptedCanary);
} else if (command === "submit" && process.argv[3]) {
  await submitCanary(process.argv[3], acceptedCanary);
} else if (command === "delete" && process.argv[3]) {
  const deleted = await deleteSpreadsheet(process.argv[3]);
  console.log(`deleted canary: ${deleted ? "yes" : "NO"}`);
  if (!deleted) process.exitCode = 1;
} else {
  console.error(
    "usage: canary:named-functions smoke | refusal | create | submit <sheet-id> | delete <sheet-id>",
  );
  process.exitCode = 1;
}

async function removeCanary(spreadsheetId: string): Promise<boolean> {
  const deleted = await deleteSpreadsheet(spreadsheetId);
  console.log(`deleted canary: ${deleted ? "yes" : "NO"}`);
  return deleted;
}

async function createCanary(spec: CanarySpec): Promise<string> {
  const problem = loadProblem("problems/ld-0001-combine-skus.yaml");
  const sourceId = await createFromTemplate(problem, "ludus-named-function-production-source", {
    sampleInput: true,
  });
  let canaryId = "";
  try {
    const xlsx = injectNamedFunctions(await exportSpreadsheetXlsx(sourceId), spec.definitions);
    canaryId = await importSpreadsheet(xlsx, `ludus-named-function-production-${spec.name}`);
    const ids = await loadSheetIds(canaryId);
    await writeRect(canaryId, ids, problem.template.output, [[spec.formula]]);
    const result = await judge(problem, canaryId, {
      prepareNamedFunctions: inlineSnapshotNamedFunctions,
    });
    const scratchOutput = result.scratchId ? await readRect(result.scratchId, problem.template.output) : [];
    if (result.scratchId) await deleteSpreadsheet(result.scratchId);
    if (spec.expected === "accepted" && result.verdict !== "accepted") {
      const importedFormula = result.program?.sheets
        .flatMap((sheet) => sheet.cells.flat())
        .find((cell) => cell?.ue?.formulaValue?.includes("SOLVE"))?.ue?.formulaValue;
      const expandedFormula = result.program
        ? inlineSnapshotNamedFunctions(result.program).sheets
            .flatMap((sheet) => sheet.cells.flat())
            .find((cell) => cell?.ue?.formulaValue?.includes("LAMBDA"))?.ue?.formulaValue
        : undefined;
      const failures = result.cases
        .filter((testCase) => !testCase.comparison.pass)
        .map((testCase) => ({ kind: testCase.kind, comparison: testCase.comparison }));
      throw new Error(
        `local canary preflight returned ${result.verdict}: ` +
          JSON.stringify({ lintErrors: result.lintErrors, importedFormula, expandedFormula, scratchOutput, failures }),
      );
    }
    if (
      spec.expected !== "accepted" &&
      (result.verdict !== "unsupported-feature" ||
        result.unsupportedFeature?.feature !== spec.expected.feature ||
        result.unsupportedFeature.code !== spec.expected.code)
    ) {
      throw new Error(
        `local refusal preflight mismatch: ${JSON.stringify({
          verdict: result.verdict,
          unsupportedFeature: result.unsupportedFeature,
          lintErrors: result.lintErrors,
        })}`,
      );
    }
    await shareSpreadsheet(canaryId);
    console.log(`canary spreadsheet: ${canaryId}`);
    console.log(`canary url: https://docs.google.com/spreadsheets/d/${canaryId}`);
    return canaryId;
  } catch (error) {
    if (canaryId) await deleteSpreadsheet(canaryId);
    throw error;
  } finally {
    await deleteSpreadsheet(sourceId);
  }
}

async function submitCanary(spreadsheetId: string, spec: CanarySpec): Promise<void> {
  const response = await fetch(`${service}/api/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      problemId: "ld-0001",
      sheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    }),
  });
  const submitted = (await response.json()) as { submissionId?: string; error?: string };
  if (!response.ok || !submitted.submissionId) {
    throw new Error(`production submit failed: ${response.status} ${submitted.error ?? "missing submission id"}`);
  }
  console.log(`submission: ${submitted.submissionId}`);

  for (let attempt = 0; attempt < 40; attempt++) {
    const poll = await fetch(`${service}/api/submission/${submitted.submissionId}`);
    if (!poll.ok) throw new Error(`production poll failed: ${poll.status}`);
    const status = (await poll.json()) as { status?: string; verdict?: string; detail?: unknown };
    if (status.status !== "done") {
      await sleep(2_500);
      continue;
    }
    console.log(`verdict: ${status.verdict ?? "missing"}`);
    if (spec.expected === "accepted" && status.verdict !== "accepted") {
      console.error(JSON.stringify(status.detail ?? null, null, 2));
      throw new Error(`production canary returned ${status.verdict ?? "missing verdict"}`);
    }
    if (spec.expected !== "accepted") {
      const unsupportedFeature = readUnsupportedFeature(status.detail);
      console.log(`refusal: ${unsupportedFeature?.feature ?? "missing"}/${unsupportedFeature?.code ?? "missing"}`);
      if (
        status.verdict !== "unsupported-feature" ||
        unsupportedFeature?.feature !== spec.expected.feature ||
        unsupportedFeature.code !== spec.expected.code
      ) {
        throw new Error(
          `production refusal mismatch: ${JSON.stringify({
            verdict: status.verdict,
            detail: status.detail,
          })}`,
        );
      }
    }
    return;
  }
  throw new Error("production canary timed out");
}

function readUnsupportedFeature(
  detail: unknown,
): { feature?: string; code?: string } | undefined {
  if (!detail || typeof detail !== "object") return undefined;
  const unsupportedFeature = (detail as { unsupportedFeature?: unknown }).unsupportedFeature;
  if (!unsupportedFeature || typeof unsupportedFeature !== "object") return undefined;
  return unsupportedFeature as { feature?: string; code?: string };
}

function injectNamedFunctions(
  xlsx: Uint8Array,
  definitions: Array<{ name: string; definition: string }>,
): Uint8Array {
  const files = unzipSync(xlsx);
  const path = "xl/workbook.xml";
  const source = strFromU8(files[path]);
  const entries = definitions
    .map(
      ({ name, definition }) =>
        `<definedName name="${escapeXml(name)}">_xlfn.${escapeXml(definition)}</definedName>`,
    )
    .join("");
  files[path] = strToU8(
    source.includes("<definedNames>")
      ? source.replace("</definedNames>", `${entries}</definedNames>`)
      : source.replace("</workbook>", `<definedNames>${entries}</definedNames></workbook>`),
  );
  return zipSync(files);
}

async function importSpreadsheet(xlsx: Uint8Array, name: string): Promise<string> {
  const accessToken = await getJudgeAccessToken();
  if (!accessToken) throw new Error("judge OAuth is unavailable");
  const form = new FormData();
  form.append(
    "metadata",
    new Blob([JSON.stringify({ name, mimeType: "application/vnd.google-apps.spreadsheet" })], {
      type: "application/json",
    }),
  );
  form.append(
    "file",
    new Blob([xlsx], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    "named-function-canary.xlsx",
  );
  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    },
  );
  if (!response.ok) throw new Error(`Drive import failed: ${response.status} ${await response.text()}`);
  return ((await response.json()) as { id: string }).id;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
