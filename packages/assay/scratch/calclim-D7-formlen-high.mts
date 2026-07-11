import { makeDriver, renderOutcome } from "./calclim-lib.mts";

const d = await makeDriver();
async function probeLen(flen: number) {
  const k = flen - 8;
  const formula = `=LEN("` + "x".repeat(k) + `")`;
  const t0 = Date.now();
  let shown: string;
  try {
    const [r] = await d.evaluateBatch([{ formula }]);
    const cell = (r.outcome as any).grid?.[0]?.[0];
    shown = cell?.primitive?.kind === "number" ? `OK num=${cell.primitive.value}` : renderOutcome(r.outcome).split("\n")[0];
  } catch (e) {
    shown = "THROW " + (e instanceof Error ? e.message.slice(0, 120) : String(e));
  }
  console.log(`flen=${flen}\t-> ${shown}\t(${Date.now() - t0}ms)`);
}
for (const flen of [100000, 200000, 300000, 400000, 500000]) {
  await probeLen(flen);
}
