import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { GSheetsDriver } from "@cartularium/drivers";
import { getAccessToken } from "../auth.js";
import { gridsEqual } from "../format/index.js";
import { outcomeGrid, outcomeErrorText, projectScalarGrid, type DriverTask } from "../format/values.js";

// LIVE gsheets seeding-fidelity check — opt-in only (RUN_LIVE_GSHEETS=1), so it
// never runs in CI / normal `vitest run`. Confirms the RAW/USER_ENTERED routing
// (partitionSeeds) is type-faithful against the real API: the named gsheets crack
// (USER_ENTERED coercing "3"→number) and the D6 error path. Uses ASSAY_SPREADSHEET_ID
// if set, else self-provisions a scratch spreadsheet (spreadsheets scope) and logs
// its id to trash. Token comes from `assay login` (~/.assayrc.json, auto-refreshed).

const RUN = !!process.env.RUN_LIVE_GSHEETS;

const cases: Array<{ task: DriverTask; want: boolean; label: string }> = [
  { label: "error-seed ISERROR ", want: true, task: { grid: { A1: { error: "#DIV/0!" } }, formula: "=ISERROR(A1)" } },
  { label: "error-seed ISTEXT  ", want: false, task: { grid: { A1: { error: "#DIV/0!" } }, formula: "=ISTEXT(A1)" } },
  { label: 'str"#DIV/0!" ISERROR', want: false, task: { grid: { A1: "#DIV/0!" }, formula: "=ISERROR(A1)" } },
  { label: 'str"#DIV/0!" ISTEXT ', want: true, task: { grid: { A1: "#DIV/0!" }, formula: "=ISTEXT(A1)" } },
  { label: 'str"3" ISTEXT       ', want: true, task: { grid: { A1: "3" }, formula: "=ISTEXT(A1)" } },
  { label: 'str"3" ISNUMBER     ', want: false, task: { grid: { A1: "3" }, formula: "=ISNUMBER(A1)" } },
  { label: "num 3 ISNUMBER     ", want: true, task: { grid: { A1: 3 }, formula: "=ISNUMBER(A1)" } },
];

let token: string | null = null;
let spreadsheetId: string | undefined;
let created = false;

beforeAll(async () => {
  if (!RUN) return;
  token = await getAccessToken();
  if (!token) return;
  spreadsheetId = process.env.ASSAY_SPREADSHEET_ID;
  if (!spreadsheetId) {
    const res = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ properties: { title: "assay-seeding-verify (scratch — safe to trash)" } }),
    });
    const j = (await res.json()) as { spreadsheetId?: string };
    spreadsheetId = j.spreadsheetId;
    created = true;
    // eslint-disable-next-line no-console
    console.log(`\n  scratch spreadsheet created: ${spreadsheetId} (safe to trash)\n`);
  }
});

afterAll(() => {
  if (created && spreadsheetId) {
    // eslint-disable-next-line no-console
    console.log(`\n  → trash the scratch sheet: https://docs.google.com/spreadsheets/d/${spreadsheetId}\n`);
  }
});

describe.skipIf(!RUN)("gsheets seeding fidelity (LIVE — set RUN_LIVE_GSHEETS=1)", () => {
  it("each seed type ingests faithfully against the real API", async () => {
    expect(token, "no token — run `assay login`").toBeTruthy();
    expect(spreadsheetId, "no spreadsheet id (create failed?)").toBeTruthy();
    const d = new GSheetsDriver({ spreadsheetId: spreadsheetId!, accessToken: token! });
    await d.init();
    try {
      const results = await d.evaluateBatch!(cases.map((c) => c.task));
      results.forEach((r, i) => {
        const g = outcomeGrid(r.outcome);
        const got = g ? projectScalarGrid(g)[0]?.[0] : `<${outcomeErrorText(r.outcome) ?? r.outcome.kind}>`;
        // eslint-disable-next-line no-console
        console.log(`  ${got === cases[i].want ? "OK" : "XX"} ${cases[i].label} got=${JSON.stringify(got)} want=${cases[i].want}`);
        expect(got, cases[i].label).toBe(cases[i].want);
      });
    } finally {
      await d.destroy();
    }
  }, 120_000);
});

// D4 whole-spreadsheet-wedge recovery (the §6.3 mirror acceptance test). A
// crash-class formula wedges the ENTIRE spreadsheet's value-recalc (every read
// 500s, deleteSheet 500s) — grounded live 2026-06-09 with the formula below. The
// recovery must: (a) lose ONLY the culprit, (b) ATTRIBUTE it (crashed{host-wedge},
// not a mislabeled quota-abort), (c) keep its siblings correct, (d) leave the
// spreadsheet REUSABLE (un-wedged), not bricked. NOTE: attribution provisions a
// throwaway spreadsheet it can't delete (no drive.file scope) — this test leaks
// one orphan per run (logged to stderr; sweep manually).
const WEDGE_FORMULA = '=GROUP_BY_AGGREGATE("player0",-1)';

describe.skipIf(!RUN)("gsheets D4 wedge recovery (LIVE — set RUN_LIVE_GSHEETS=1)", () => {
  it("a crash-class formula loses only itself; siblings survive; spreadsheet stays reusable", async () => {
    expect(token, "no token — run `assay login`").toBeTruthy();
    expect(spreadsheetId, "no spreadsheet id (create failed?)").toBeTruthy();
    const d = new GSheetsDriver({ spreadsheetId: spreadsheetId!, accessToken: token! });
    await d.init();
    try {
      const tasks: DriverTask[] = [
        { formula: "=1+1" },
        { formula: WEDGE_FORMULA },
        { formula: "=2+3" },
      ];
      const results = await d.evaluateBatch(tasks);
      const scalar = (i: number) => {
        const g = outcomeGrid(results[i].outcome);
        return g ? projectScalarGrid(g)[0]?.[0] : undefined;
      };
      // eslint-disable-next-line no-console
      console.log(`  D4 outcomes: ${results.map((r) => r.outcome.kind).join(", ")}`);

      // Siblings survive, recovered in the throwaway spreadsheet.
      expect(results[0].outcome.kind, "clean sibling 1").toBe("value");
      expect(scalar(0)).toBe(2);
      expect(results[2].outcome.kind, "clean sibling 2").toBe("value");
      expect(scalar(2)).toBe(5);

      // The wedge formula is the lone attributed crasher — NOT mislabeled infra/quota.
      expect(results[1].outcome.kind, "the wedge culprit").toBe("crashed");
      if (results[1].outcome.kind === "crashed") {
        expect(results[1].outcome.channel).toBe("host-wedge");
      }

      // The shared spreadsheet is REUSABLE (un-wedged): a fresh batch reads fine.
      const reuse = await d.evaluateBatch([{ formula: "=3+4" }]);
      expect(reuse[0].outcome.kind, "spreadsheet reusable after recovery").toBe("value");
      const rg = outcomeGrid(reuse[0].outcome);
      expect(rg ? projectScalarGrid(rg)[0]?.[0] : undefined).toBe(7);
    } finally {
      await d.destroy();
    }
  }, 240_000);
});

// gsheets dense-tiling validation (LIVE) — runs a diverse batch TWICE on the same
// spreadsheet, tiled (ASSAY_TILE_FACTOR=5) vs untiled (=1), and asserts identical
// results on FAR fewer sheets. Mirrors the Excel tiled-vs-untiled check: same code,
// only the packing differs, so any diff is a tiling bug. Covers lumps (scalars +
// spill-within-tile), in-place (grid+reference), and a grid-bearing reference-free
// task (hasInput ⇒ own host, can't co-tile).
describe.skipIf(!RUN)("gsheets dense tiling == untiled (LIVE — set RUN_LIVE_GSHEETS=1)", () => {
  it("tiles lumps onto far fewer sheets, identical results to one-per-sheet", async () => {
    expect(token, "no token — run `assay login`").toBeTruthy();
    expect(spreadsheetId, "no spreadsheet id (create failed?)").toBeTruthy();

    const tasks: DriverTask[] = [
      ...Array.from({ length: 30 }, (_, k) => ({ formula: `=${k}+1` })), // lump scalars
      { formula: '=UPPER("hi")' }, // lump
      { formula: "=SEQUENCE(1,3)" }, // lump, horizontal spill within tile
      { formula: "=SUM(A1:A3)", grid: { A1: 1, A2: 2, A3: 3 } }, // in-place
      { formula: "=2*2", grid: { A1: 99 } }, // grid-bearing reference-free → own host
    ];

    const runAt = async (factor: number) => {
      process.env.ASSAY_TILE_FACTOR = String(factor);
      const d = new GSheetsDriver({ spreadsheetId: spreadsheetId!, accessToken: token! });
      await d.init();
      try {
        const results = await d.evaluateBatch(tasks);
        return { results, sheets: d.getQuotaStats().sheetsCreated };
      } finally {
        delete process.env.ASSAY_TILE_FACTOR;
        await d.destroy();
      }
    };

    const tiled = await runAt(5);
    const untiled = await runAt(1);

    const diffs: string[] = [];
    for (let i = 0; i < tasks.length; i++) {
      const a = outcomeGrid(tiled.results[i].outcome);
      const b = outcomeGrid(untiled.results[i].outcome);
      const same =
        a && b
          ? gridsEqual(a, b)
          : tiled.results[i].outcome.kind === untiled.results[i].outcome.kind;
      if (!same) diffs.push(`[${i}] ${tasks[i].formula}`);
    }
    // eslint-disable-next-line no-console
    console.log(
      `\n  gsheets tiled==untiled: ${tasks.length - diffs.length}/${tasks.length} identical; ` +
        `sheets tiled=${tiled.sheets} vs untiled=${untiled.sheets}`,
    );

    expect(diffs, `tiling diffs: ${diffs.join(", ")}`).toEqual([]);
    expect(tiled.sheets, "tiling should use fewer sheets").toBeLessThan(untiled.sheets);
    // Spot-check a few known values came through tiled.
    const scalar = (i: number) => {
      const g = outcomeGrid(tiled.results[i].outcome);
      return g ? projectScalarGrid(g)[0]?.[0] : undefined;
    };
    expect(scalar(0)).toBe(1); // =0+1
    expect(scalar(32)).toBe(6); // =SUM(A1:A3)
    expect(scalar(33)).toBe(4); // =2*2 (grid-bearing, own host)
  }, 240_000);
});
