import { createDriver } from "@cartularium/drivers";

const formulas = [
  // regex — do the pure engines implement them?
  '=REGEXEXTRACT("abc 123 def", "\\d+")',
  '=REGEXEXTRACT("2025-03-01", "(\\d{4})-(\\d{2})-(\\d{2})")',
  '=REGEXEXTRACT("Price: $100", "\\$(\\d+)")',
  '=REGEXEXTRACT("hello", "\\d+")',
  '=REGEXREPLACE("a1b2c3", "\\d", "x")',
  '=REGEXREPLACE("2025-03-01", "(\\d+)-(\\d+)-(\\d+)", "$3/$2/$1")',
  '=REGEXREPLACE("John Smith", "(\\w+) (\\w+)", "$2, $1")',
  '=REGEXREPLACE("hello world", "(\\w+)", "[$1]")',
  '=REGEXREPLACE("", "\\d+", "x")',
  // text edges
  '=MID("Romain", 1, -1)',
  '=REPT("ha", 0)',
  '=LEN("")',
  '=LEFT("Sweden")',
  // longtail
  '=ARABIC("hello")',
  '=ROMAN(0)',
  '=CHAR(0)',
  '=DOLLAR(-1234.5, 2)',
  '=FIXED(1234.567, -1)',
  '=UNICODE("")',
  '=VALUE("3.14")',
  '=ASC("")',
  '=LENB("あ")',
  '=LEFTB("あいう", 2)',
  '=FINDB("い", "あいう")',
  '=MIDB("あいう", 3, 2)',
  '=REPLACEB("あいう", 3, 2, "X")',
];

const engines = ["hyperformula", "ironcalc", "formulas", "pycel"] as const;

for (const eng of engines) {
  let d;
  try {
    d = createDriver(eng);
    await d.init();
  } catch (e) {
    console.log(`\n### ${eng}: INIT FAILED ${(e as Error).message}`);
    continue;
  }
  const results = await d.evaluateBatch(formulas.map((formula) => ({ formula })));
  console.log(`\n### ${eng}`);
  results.forEach((r, i) => {
    console.log(`${formulas[i]}  =>  ${JSON.stringify(r)}`);
  });
}
