// End-to-end verification of the rich Excel driver.
//
// Runs a focused set of formulas through ExcelDriver.evaluateBatch and
// verifies its scalar projection matches audit-established expectations.
// Catches:
//   - Backward compat: scalar projection identical to pre-rework
//   - Modern-function support (validates xlwings.formula2 entry path)
//   - Error sentinel mapping
//   - Date formula → serial coercion
//
// Limitations:
//   - 1904-epoch fix (A1) is verified at the Python unit-test level; this
//     script doesn't construct 1904-mode workbooks.
//   - It checks scalar projection, not every engine-extra field.
//
// Run from packages/assay/:
//   pnpm build && node scripts/verify-excel-driver-e2e.mjs

import { ExcelDriver, projectScalarGrid } from "../build/index.js";

const CASES = [
  // Basic value types — sanity checks for the read path
  { formula: "=1+1", expected: 2, desc: "basic arithmetic" },
  { formula: '="hello"', expected: "hello", desc: "string literal" },
  { formula: "=TRUE", expected: true, desc: "boolean TRUE" },
  { formula: "=FALSE", expected: false, desc: "boolean FALSE" },
  { formula: "=1=1", expected: true, desc: "comparison → boolean" },

  // Error sentinels — should round-trip as { error: ... }
  { formula: "=1/0", expected: { error: "#DIV/0!" }, desc: "#DIV/0!" },
  { formula: "=NA()", expected: { error: "#N/A" }, desc: "#N/A" },
  { formula: "=SQRT(-1)", expected: { error: "#NUM!" }, desc: "#NUM!" },
  { formula: "=NotARealFunction()", expected: { error: "#NAME?" }, desc: "#NAME?" },
  { formula: '="a"+1', expected: { error: "#VALUE!" }, desc: "#VALUE!" },

  // Modern functions — validate xlwings.formula2 entry path (no _xludf. rewrites)
  { formula: "=SEQUENCE(5)", expected: 1, desc: "SEQUENCE spill anchor returns 1" },
  { formula: "=LAMBDA(x, x+1)(5)", expected: 6, desc: "called LAMBDA → 6" },
  { formula: "=LET(x, 5, x*2)", expected: 10, desc: "LET binding → 10" },
  { formula: '=XLOOKUP("beta", {"alpha";"beta";"gamma"}, {1;2;3})', expected: 2, desc: "XLOOKUP" },

  // Date formula — validates date-to-serial conversion (A1 path, 1900 epoch default)
  { formula: "=DATE(2023,3,19)", expected: 45004, desc: "DATE(2023,3,19) → serial 45004" },

  // String concatenation
  { formula: '="x" & "y"', expected: "xy", desc: "string concat" },

  // Blank/null behavior — IF(,,) should collapse to 0 in Excel
  { formula: "=IF(,,)", expected: 0, desc: "IF(,,) collapses to 0" },
];

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a === "object" && a !== null && typeof b === "object" && b !== null) {
    const ak = Object.keys(a).sort();
    const bk = Object.keys(b).sort();
    if (ak.length !== bk.length) return false;
    if (ak.some((k, i) => k !== bk[i])) return false;
    return ak.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

async function main() {
  console.log(`Running ${CASES.length} verification cases through ExcelDriver...\n`);

  const driver = new ExcelDriver();
  await driver.init();

  let passed = 0;
  let failed = 0;
  const failures = [];

  try {
    const tasks = CASES.map((c) => ({ formula: c.formula }));
    const results = await driver.evaluateBatch(tasks);

    for (let i = 0; i < CASES.length; i++) {
      const c = CASES[i];
      const r = results[i];

      if (r.error) {
        console.log(`✗ ${c.desc}: driver error — ${r.error}`);
        failures.push({ case: c, actual: null, error: r.error });
        failed++;
        continue;
      }

      const actual = r.result ? projectScalarGrid(r.result)[0]?.[0] : undefined;
      const ok = deepEqual(actual, c.expected);
      if (ok) {
        console.log(`✓ ${c.desc}: ${c.formula} → ${JSON.stringify(actual)}`);
        passed++;
      } else {
        console.log(
          `✗ ${c.desc}: ${c.formula} → ${JSON.stringify(actual)} (expected ${JSON.stringify(c.expected)})`,
        );
        failures.push({ case: c, actual });
        failed++;
      }
    }
  } finally {
    await driver.destroy();
  }

  console.log(`\n${passed}/${CASES.length} passed${failed > 0 ? `, ${failed} failed` : ""}`);

  if (failed > 0) {
    console.log("\nFailure details:");
    for (const f of failures) {
      console.log(`  - ${f.case.desc} (${f.case.formula})`);
      console.log(`      expected: ${JSON.stringify(f.case.expected)}`);
      console.log(`      actual:   ${JSON.stringify(f.actual)}`);
      if (f.error) console.log(`      error:    ${f.error}`);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(`Verification crashed: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
