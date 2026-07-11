import { makeDriver, renderOutcome } from "./calclim-lib.mts";

const d = await makeDriver();
// Formula of total text length `flen`: =LEN("xxxx...") ; the x-run is flen-8 chars,
// value returned is small (flen-8). If gsheets rejects an over-long cell content the
// driver's write throws -> outcome kind "infra" carrying the 400 body.
async function probeLen(flen: number) {
  const k = flen - 8; // '=LEN("' + '")' = 8 chars
  const formula = `=LEN("` + "x".repeat(k) + `")`;
  const t0 = Date.now();
  const [r] = await d.evaluateBatch([{ formula }]);
  const ms = Date.now() - t0;
  const cell = (r.outcome as any).grid?.[0]?.[0];
  let shown = renderOutcome(r.outcome).split("\n")[0];
  if (cell?.primitive?.kind === "number") shown = `OK num=${cell.primitive.value}`;
  console.log(`flen=${flen}\t(actual=${formula.length})\t-> ${shown}\t(${ms}ms)`);
}
for (const flen of [49990, 50000, 50001, 50002, 50100, 51000]) {
  await probeLen(flen);
}
