import { createDriver } from "@cartularium/drivers";

const disputed = [
  '=IFNA(#N/A, "caught")',
  '=IFNA(42, "caught")',
  '=IFERROR(#N/A, "fallback")',
  '=IFERROR(42, "err")',
  '=IFERROR(#N/A, "fb")',
  '=IFNA("x", "caught")',
];

const d = createDriver("pycel" as any);
await d.init();

console.log("=== isolated (one formula per batch) ===");
for (const f of disputed) {
  const [r]: any = await d.evaluateBatch([{ formula: f }]);
  const o = r.outcome ?? r;
  console.log(`  ${f.padEnd(30)} | ${JSON.stringify(o.grid ?? o)}`);
}

console.log("=== all together in one batch ===");
const res: any = await d.evaluateBatch(disputed.map((f) => ({ formula: f })));
res.forEach((r: any, i: number) => {
  const o = r.outcome ?? r;
  console.log(`  ${disputed[i].padEnd(30)} | ${JSON.stringify(o.grid ?? o)}`);
});

if (d.dispose) await d.dispose();
