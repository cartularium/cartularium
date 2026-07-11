import { makeDriver, renderOutcome } from "./calclim-lib.mts";

// Section C: the stack limit (claim 10,000). Self-applying LAMBDA recurses `depth`
// deep with a cheap per-level body, so the CALL limit (2M) stays far away and the
// STACK limit binds first. Returns 0 on success, #ERROR! on stack overflow.
// Per-level call cost is small (~<15), so depth 10^4 ~ 1.5e5 calls << 2e6.
const rec = (depth: number) =>
  `=LAMBDA(f,n,IF(n<=0,0,f(f,n-1)))(LAMBDA(f,n,IF(n<=0,0,f(f,n-1))),${depth})`;

const d = await makeDriver();
const depths = [5000, 9000, 9998, 9999, 10000, 10001, 10002, 12000, 20000];
for (const depth of depths) {
  const f = rec(depth);
  const t0 = Date.now();
  const [r] = await d.evaluateBatch([{ formula: f }]);
  const ms = Date.now() - t0;
  const cell = (r.outcome as any).grid?.[0]?.[0];
  console.log(
    `depth ${depth}\t-> ${renderOutcome(r.outcome)}\tprim=${JSON.stringify(cell?.primitive)}\t(${ms}ms)`,
  );
}
