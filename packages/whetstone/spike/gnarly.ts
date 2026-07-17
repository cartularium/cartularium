// Creates a fixture spreadsheet of known-nasty cases for the round-trip spike.
// Caveat: this fixture is API-authored, which biases toward round-trip success —
// UI-authored and wild sheets are the stronger evidence. This is the floor, not
// the test.
import { rehydrate } from "../src/rehydrate.js";
import type { CellSnap, SheetSnap, Snapshot } from "../src/snapshot.js";

const n = (v: number): CellSnap => ({ ue: { numberValue: v } });
const s = (v: string): CellSnap => ({ ue: { stringValue: v } });
const b = (v: boolean): CellSnap => ({ ue: { boolValue: v } });
const f = (formula: string): CellSnap => ({ ue: { formulaValue: formula } });
const dated = (serial: number, type: string, pattern?: string): CellSnap => ({
  ue: { numberValue: serial },
  fmt: { type, ...(pattern ? { pattern } : {}) },
});

function sheet(sheetId: number, title: string, rows: Array<Array<CellSnap | null>>): SheetSnap {
  return {
    sheetId,
    title,
    rowCount: Math.max(rows.length + 10, 50),
    columnCount: 26,
    cells: rows,
  };
}

const fixture: Snapshot = {
  spreadsheetId: "",
  title: `whetstone-gnarly-${new Date().toISOString().slice(0, 10)}`,
  locale: "en_US",
  timeZone: "America/Los_Angeles",
  namedRanges: [
    {
      name: "WHET_DATA",
      range: { sheetId: 0, startRowIndex: 0, endRowIndex: 5, startColumnIndex: 0, endColumnIndex: 1 },
    },
  ],
  sheets: [
    sheet(0, "Basics", [
      [n(1), s("plain string"), b(true)],
      [n(2.5), s("01234"), b(false)], // leading-zero string must stay a string
      [n(1e15), s("3.14"), f('=""')], // number-looking string; empty-string formula
      [n(-0.000001), s(" leading space"), f("=IF(,,)")],
      [n(0.1 + 0.2), s("trailing space "), null],
      [dated(46000, "DATE", "yyyy-mm-dd"), dated(0.75, "TIME", "h:mm am/pm"), dated(0.156, "PERCENT", "0.00%")],
      [dated(46000.5, "DATE_TIME", "yyyy-mm-dd h:mm"), dated(1234.56, "CURRENCY", '"$"#,##0.00'), dated(30.5, "NUMBER", "[h]:mm:ss")],
    ]),
    sheet(1, "Spills", [
      [f("=SEQUENCE(5,3)")],
      [],
      [],
      [],
      [],
      [f("=TRANSPOSE(SEQUENCE(3))")],
      [f('=UNIQUE({1;1;2;"a";"a"})')],
      [],
      [],
      [],
      [],
      [f("=ARRAYFORMULA(ROW(A1:A4)*10)")],
      [],
      [],
      [],
      [f("=FILTER(Basics!A1:A5, Basics!A1:A5 > 1)")],
    ]),
    sheet(2, "Errors", [
      [f("=1/0"), f("=NA()"), f('=INDIRECT("nope!A1")')],
      [f('=VLOOKUP("zzz",Basics!A1:B2,2,FALSE)'), f("=SQRT(-1)"), f('=1+"a"')],
      [f("=NOSUCHFUNCTION(1)"), f("=LOG(0)"), null],
    ]),
    sheet(3, "CrossTab", [
      [f("=SUM(Basics!A1:A5)"), f("=Basics!B1&Basics!B2")],
      [f("=SUM(WHET_DATA)"), f("=COUNTA(Spills!A1:C5)")],
    ]),
    sheet(4, "Text", [
      [s("héllo wörld"), s("日本語テキスト"), s("🎲🎯🎨")],
      [s("line\nbreak"), s("tab\there"), s("=looks like a formula")],
      [s("a".repeat(2000)), f('=CONCATENATE("x", CHAR(10), "y")'), f('=TEXT(46000, "ddd, mmm d yyyy")')],
    ]),
    sheet(5, "Volatile", [
      [f("=NOW()"), f("=TODAY()"), f("=RAND()")],
    ]),
  ],
};

console.log("creating gnarly fixture spreadsheet ...");
const id = await rehydrate(fixture, fixture.title);
console.log(`  id:  ${id}`);
console.log(`  url: https://docs.google.com/spreadsheets/d/${id}`);
console.log("\nnext: pnpm --filter @cartularium/whetstone roundtrip " + id);
