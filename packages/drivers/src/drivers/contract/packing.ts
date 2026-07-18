// packing.ts — the packing planner (arch-review M1: the previously-unowned
// load-bearing component). Turns a batch of formulas into a placement plan: each
// task is screened by cohost.coHostPlacement and assigned a HOST (the co-hosting
// unit — a driver maps it to its isolation boundary; for gsheets a spreadsheet for
// `isolate`, a sheet for the rest), plus a reserved REGION within that host.
//
// Policy B (conservative, ratified 2026-06-15 — "probe on tripwire, never probe
// first"): no upfront extent probe. Each co-hosted task reserves a full STAGING
// WINDOW (read-model staging size), so a result WITHIN staging cannot reach a
// co-tenant (spill-reach non-overlap, arch-review m4); a result that OVERFLOWS
// staging trips the read-model tripwire → the extent probe fires → that task is
// re-planned (isolated / sized), never a silent collision.
//
//   - isolate  (opaque INDIRECT/OFFSET): own host, no co-tenant — the safety floor
//     (charter §8 / cohost.requiresIsolation).
//   - in-place (reference-bearing / position-sensitive): own host at the canonical
//     layout — its references resolve against the standard input region, so it can't
//     be tiled without rewriting them.
//   - lump     (reference-free ∧ position-insensitive): tiled DENSELY into shared
//     hosts, each reserving a staging-window cell — the amortization win.
//
// Engine-agnostic: emits hosts (0-based ids) + regions (1-indexed rectangles). The
// driver maps a host to its sheet/spreadsheet structure and the regions to seed/
// formula/read placement. WIRED into BOTH tier-1 drivers — Excel (excel.ts → the
// excel_driver.py executor, #SPILL!-artifact → isolate) and gsheets (gsheets.ts,
// per-tile reads + #REF!-artifact → isolate, chunked by host sheet count). Both
// dense-tile lumps onto shared sheets, verified live tiled-vs-untiled. The planner
// OWNS the placement decision + the spill-reach guarantee.

import { coHostPlacement, type CoHostPlacement } from "./cohost.js";
import { DEFAULT_LAYOUT, type BatchLayout } from "./layout.js";

/** A 1-indexed rectangle within a host grid (top-left + size). */
export interface Region {
  top: number;
  left: number;
  rows: number;
  cols: number;
}

export interface PlacedTask {
  taskIndex: number;
  placement: CoHostPlacement;
  /** 0-based host id (the co-hosting unit). `isolate`/`in-place` get a host each. */
  host: number;
  /** The reserved region within the host — the conservative spill-reach reservation. */
  region: Region;
}

export interface PackingPlan {
  /** One entry per input formula, in input order. */
  tasks: PlacedTask[];
  /** Number of distinct hosts the plan uses. */
  hostCount: number;
}

export interface PackingOptions {
  /** Staging window + input region (default DEFAULT_LAYOUT). */
  layout?: BatchLayout;
  /**
   * The host grid available for tiling LUMP tasks (rows × cols). Lump tasks tile
   * into staging-window cells within this; when a host fills, the next host opens.
   * Defaults to a single staging window (no dense tiling) so the conservative,
   * one-region-per-host default holds until a caller opts into a larger host.
   */
  hostRows?: number;
  hostCols?: number;
  /**
   * Per-task (parallel to `formulas`): does the task carry grid seeds? A task with
   * seeded input can't be co-tiled even when its formula is reference-free — its
   * seeds collide with co-tenants on a shared host — so it's forced to its own host
   * (cohost.coHostPlacement). Absent ⇒ all false (formula-only classification).
   */
  hasInput?: boolean[];
}

/** True iff two regions overlap. Touching edges do NOT overlap. */
export function regionsOverlap(a: Region, b: Region): boolean {
  const aBottom = a.top + a.rows - 1;
  const aRight = a.left + a.cols - 1;
  const bBottom = b.top + b.rows - 1;
  const bRight = b.left + b.cols - 1;
  return a.top <= bBottom && b.top <= aBottom && a.left <= bRight && b.left <= aRight;
}

/**
 * Plan the placement of a batch of formulas (arch-review M1). Each task is
 * classified by `coHostPlacement`; `isolate` and `in-place` get a host to
 * themselves; `lump` tasks tile densely into shared hosts, each reserving a
 * staging-window region (the conservative spill-reach reservation, policy B).
 */
export function planPacking(formulas: string[], opts: PackingOptions = {}): PackingPlan {
  const layout = opts.layout ?? DEFAULT_LAYOUT;
  const winRows = layout.stagingRows;
  const winCols = layout.stagingCols;
  const hostRows = Math.max(opts.hostRows ?? winRows, winRows);
  const hostCols = Math.max(opts.hostCols ?? winCols, winCols);
  // How many staging-window cells tile into one host grid (row-major).
  const perRow = Math.floor(hostCols / winCols);
  const cellsPerHost = Math.max(1, perRow * Math.floor(hostRows / winRows));

  // The canonical staging window (anchored at the layout's formula cell) — used by
  // isolate/in-place, which own their host so the exact anchor is immaterial.
  const canonical = (): Region => ({
    top: layout.formula.row,
    left: layout.formula.col,
    rows: winRows,
    cols: winCols,
  });

  const tasks: PlacedTask[] = [];
  let nextHost = 0;
  let lumpHost = -1; // current open lump host (shared)
  let lumpSlot = 0; // next free tile slot in the open lump host

  formulas.forEach((formula, taskIndex) => {
    const placement = coHostPlacement(formula, opts.hasInput?.[taskIndex] ?? false);
    if (placement !== "lump") {
      // isolate / in-place → own host.
      tasks.push({ taskIndex, placement, host: nextHost++, region: canonical() });
      return;
    }
    // lump → tile into the open shared lump host; open a new one when full.
    // LOAD-BEARING INVARIANT: lump tiles anchor at column 1 (region.left = 1 + …), which
    // OVERLAPS the input-seed region (cols inputFirst..inputLast). This is safe ONLY
    // because a `lump` task is seed-free — `coHostPlacement(formula, hasInput=true)`
    // forces any grid-bearing task to `in-place` (its own host), so a co-tenant lump's
    // tile never reads another task's seeds. `findRegionCollisions` guards lump-vs-lump
    // overlap; the seed-free guarantee (cohost.ts) is what makes the col-1 anchor safe.
    if (lumpHost < 0 || lumpSlot >= cellsPerHost) {
      lumpHost = nextHost++;
      lumpSlot = 0;
    }
    const slotRow = Math.floor(lumpSlot / perRow);
    const slotCol = lumpSlot % perRow;
    tasks.push({
      taskIndex,
      placement,
      host: lumpHost,
      region: {
        top: 1 + slotRow * winRows,
        left: 1 + slotCol * winCols,
        rows: winRows,
        cols: winCols,
      },
    });
    lumpSlot++;
  });

  return { tasks, hostCount: nextHost };
}

/**
 * Verify the spill-reach non-overlap invariant (arch-review m4): within any single
 * host, no two reserved regions overlap. Returns colliding pairs (empty == safe) —
 * the guarantee dense lumping must preserve; a driver/test asserts it stays empty.
 */
export function findRegionCollisions(
  plan: PackingPlan,
): Array<{ a: number; b: number; host: number }> {
  const collisions: Array<{ a: number; b: number; host: number }> = [];
  const byHost = new Map<number, PlacedTask[]>();
  for (const t of plan.tasks) {
    const arr = byHost.get(t.host) ?? [];
    arr.push(t);
    byHost.set(t.host, arr);
  }
  for (const [host, group] of byHost) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (regionsOverlap(group[i].region, group[j].region)) {
          collisions.push({ a: group[i].taskIndex, b: group[j].taskIndex, host });
        }
      }
    }
  }
  return collisions;
}
