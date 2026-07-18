// per-engine numeric tolerance for cross-engine value comparison.
// ironcalc's python bindings return display-clipped values (~9 sig figs)
// instead of raw doubles, so it routinely lands ~3e-10 off excel/gsheets
// on the same identity. relax tolerance to 1e-9 when ironcalc is in the pair.

export const DEFAULT_NUM_TOL = 1e-10;

const PLATFORM_NUM_TOL: Record<string, number> = {
  ironcalc: 1e-9,
};

export function toleranceFor(...platforms: (string | undefined)[]): number {
  let tol = DEFAULT_NUM_TOL;
  for (const p of platforms) {
    if (p && PLATFORM_NUM_TOL[p] > tol) tol = PLATFORM_NUM_TOL[p];
  }
  return tol;
}
