import {
  isCellError,
  outcomeErrorText,
  outcomeGrid,
  valueOutcome,
  type CellError,
  type CellValue,
  type DriverTask,
  type DriverTaskResult,
  type Outcome,
  type PrimitiveValue,
  type RichCellValue,
  type RichGridValue,
} from "../format/values.js";
import type { Driver, CapabilityDescriptor } from "./driver.js";
import { capabilityDescriptorFor } from "../format/capability-data.js";
import { classifySeed, type SeedValue } from "./contract/seed.js";
import { planPacking, type PlacedTask, type Region } from "./contract/packing.js";
import { DEFAULT_LAYOUT, coordToA1 } from "./contract/layout.js";

// google sheets driver — bulk sheet-per-test
// each test gets a temp sheet `assay-t<i>`; chunks of CHUNK_SIZE provisioned,
// written, read, torn down in 5 api calls per chunk:
//   1. batchUpdate            — addSheet × N
//   2. values.batchUpdate RAW — literal seeds (number/text/bool; "3" stays text)
//   3. values.batchUpdate UE  — error seeds + formulas at AA1 (USER_ENTERED)
//   4. spreadsheets.get       — AA1:AT20 × N with includeGridData + field mask
//   5. batchUpdate            — deleteSheet × N
// The RAW/USER_ENTERED split (D1/D6) is the type-faithful-seeding fix: USER_ENTERED
// coerces "3"→number, so literals go RAW; errors need USER_ENTERED to parse the
// sentinel into a real errorValue, and formulas need it to parse as formulas.
//
// Read-path note: switched from the legacy `values.batchGet` × 2 (one call
// per render mode) to a single `spreadsheets.get?includeGridData=true` with
// an explicit field mask. The audit ([../docs/gsheets-driver-fidelity.md])
// found values.batchGet collapses several wire-format "blank-ish" shapes
// into a single `null` output — destroying structural distinctions the API
// actually carries. spreadsheets.get exposes userEnteredValue,
// effectiveValue, formattedValue, effectiveFormat.numberFormat,
// errorValue.message, hyperlink, and textFormatRuns — all of which feed the
// internal RichCell representation and then the public RichCellValue contract.
// One important caveat: CellData alone still cannot semantically distinguish
// every empty-string formula from a formula-returned Null; that needs a
// side-channel probe such as ISBLANK/ISTEXT if the canonical schema needs the
// distinction.
//
// rate-limit policy: adaptive backoff. spreadsheets.get is heavier than
// values.batchGet, so the retry envelope is wider (4 attempts, exponential
// 1/2/4/8s + jitter). 401/403 still throws immediately (fail-fast on auth).

const API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

const TARGET_CELL = "AA1";
const READ_RANGE = "AA1:AT20"; // 20×20 spill window (legacy single-task default)
const GRID_ROWS = 30;
const GRID_COLS = 60;
const SHEET_PREFIX = "assay-t";
// Max distinct host SHEETS per chunk (was: tasks per chunk). With dense tiling a
// chunk packs far more TASKS than sheets, so the bound is sheet count — fewer chunks
// ⇒ fewer round-trip sequences (each chunk pays addSheet + 2 writes + CALC_WAIT + read
// + deleteSheet). The amortization for gsheets is chunk-count, not write-volume.
const CHUNK_SHEETS = 50;
// `spreadsheets.get` carries each read range as a `ranges=` URL query param, so a
// single read is bounded by URL length, NOT request body. At full-corpus chunk
// scale a chunk holds up to CHUNK_SHEETS × TILE_FACTOR² tiles (~1250 ranges); packing
// them all into one GET overflows Google's URL limit → a 400 HTML frontend rejection.
// Cap ranges per GET and loop (the read splits across sub-requests, results reassembled
// by title→index). ~100 ranges keeps the URL well under any limit.
const MAX_RANGES_PER_GET = 100;
const CALC_WAIT_MS = 400;
const WRITE_REQUEST_INTERVAL_MS = 1100;

// Dense-tiling factor: lump tasks tile into a host of TILE_FACTOR × TILE_FACTOR
// staging windows (TILE_FACTOR² lumps/host). Env-overridable (ASSAY_TILE_FACTOR; =1 ⇒
// no tiling, one task per sheet) for tuning + the tiled-vs-untiled cross-check.
function tileFactor(): number {
  return Math.max(1, Number(process.env.ASSAY_TILE_FACTOR) || 5);
}

/** A region's top-left cell as A1 (the formula cell), e.g. {top:1,left:27} → "AA1". */
function regionCellA1(r: Region): string {
  return coordToA1({ row: r.top, col: r.left });
}

/** A region as an A1 range, e.g. {top:1,left:1,rows:20,cols:20} → "A1:T20". */
function regionRangeA1(r: Region): string {
  const tl = coordToA1({ row: r.top, col: r.left });
  const br = coordToA1({ row: r.top + r.rows - 1, col: r.left + r.cols - 1 });
  return `${tl}:${br}`;
}

/** Slice `placements` into contiguous [lo, hi) chunks each spanning ≤ maxHosts distinct
 * host sheets (the per-chunk bound). Co-tiled lumps share a host and are contiguous, so
 * a chunk packs many more tasks than sheets; a host straddling a boundary is harmless. */
function chunkByHosts(placements: PlacedTask[], maxHosts: number): Array<[number, number]> {
  const chunks: Array<[number, number]> = [];
  let lo = 0;
  let hosts = new Set<number>();
  for (let i = 0; i < placements.length; i++) {
    const h = placements[i].host;
    if (!hosts.has(h) && hosts.size >= maxHosts) {
      chunks.push([lo, i]);
      lo = i;
      hosts = new Set();
    }
    hosts.add(h);
  }
  if (lo < placements.length) chunks.push([lo, placements.length]);
  return chunks;
}

/** True iff a result's top-left is gsheets' spill-block error (#REF! — "array result
 * was not expanded because it would overwrite data"). For a CO-TILED lump that's an
 * artifact of a neighbour tile, not the real answer (alone it spills freely). */
function isSpillBlocked(o: Outcome): boolean {
  const g = outcomeGrid(o);
  const p = g?.[0]?.[0]?.primitive;
  return !!p && (p.kind === "error" || p.kind === "extended-error") && p.sentinel === "#REF!";
}
// Per-request hang guard (D4 hang variant). A wedged host can hang a value read
// indefinitely; the grounded wedge 500s fast, but a hang needs a ceiling so the
// run doesn't block forever. Generous so it never false-trips a slow-but-legit read.
const READ_TIMEOUT_MS = 60_000;

/**
 * A whole-spreadsheet wedge or a hung request — distinct from quota (429) / auth
 * (401/403). Grounded live (§6.1): one crash-class formula (e.g.
 * `=GROUP_BY_AGGREGATE(…,-1)`) 500s EVERY value read in the spreadsheet regardless
 * of range AND blocks `deleteSheet`, so a read-bisect can't dodge it and teardown
 * orphans the sheet. The recovery (§6.2 D4) un-wedges by clearing the formula cell,
 * then attributes the crash by re-running suspects one-at-a-time in a fresh
 * throwaway spreadsheet (the spreadsheet, not the sheet, is the isolation boundary).
 * Carries the §6.6 CrashChannel so the outcome records the right cause.
 */
class GSheetsWedgeError extends Error {
  constructor(
    readonly channel: "host-wedge" | "timeout",
    message: string,
  ) {
    super(message);
    this.name = "GSheetsWedgeError";
  }
}

// D8.β side-channel probe. One scratch sheet per chunk holds `=ISBLANK(...)`
// cross-sheet references to every ambiguous blank/null cell read back this
// chunk, so the wire-format-ambiguous `=""` vs `=IF(,,)` can be separated. Each
// ambiguous cell's absolute coord is derived from its task's tile origin (the read
// window is no longer fixed at AA1 — collectProbeCandidates takes per-task origins).
const PROBE_SHEET_ROWS = 2000;

// Field mask for spreadsheets.get. Captures all surfaces the audit
// identified as load-bearing for the schema-aware lift:
// - userEnteredValue: formula text, distinguishes truly-untouched from
//   formula-emits-Null (= IF(,,)) by presence/absence
// - effectiveValue: typed cached value with errorValue.{type,message}
// - formattedValue: display string (UI-visible representation)
// - hyperlink: cell-level convenience (single-link case)
// - textFormatRuns: per-substring formatting + the canonical link encoding
// - effectiveFormat.numberFormat: inferred type (DATE/NUMBER/CURRENCY/...)
const GET_FIELD_MASK = [
  "sheets(properties(title),data.rowData.values(",
  "userEnteredValue,effectiveValue,formattedValue,",
  "hyperlink,textFormatRuns,",
  "effectiveFormat(numberFormat,textFormat,hyperlinkDisplayType)",
  "))",
].join("");

export interface GSheetsDriverConfig {
  /** Existing spreadsheet to reuse. Omit to create a throwaway one per run. */
  spreadsheetId?: string;
  accessToken: string;
}

// === Internal rich-cell types (parallel to Python's RichCell/RawCellData) ===
// Captured by the driver from spreadsheets.get?includeGridData, then promoted
// to the shared RichCellValue contract.

/** Raw API CellData wire format — see https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/cells */
interface ApiCellData {
  userEnteredValue?: ApiExtendedValue;
  effectiveValue?: ApiExtendedValue;
  formattedValue?: string;
  hyperlink?: string;
  textFormatRuns?: Array<{ startIndex?: number; format?: ApiTextFormat }>;
  effectiveFormat?: {
    numberFormat?: { type?: string; pattern?: string };
    textFormat?: ApiTextFormat;
    hyperlinkDisplayType?: string;
  };
}

interface ApiExtendedValue {
  numberValue?: number;
  stringValue?: string;
  boolValue?: boolean;
  formulaValue?: string;
  errorValue?: { type?: string; message?: string };
}

interface ApiTextFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  foregroundColor?: unknown;
  fontFamily?: string;
  fontSize?: number;
  link?: { uri?: string };
}

/** Driver-internal rich-cell representation. */
export interface RichCell {
  // Legacy scalar projection for matcher/display compatibility.
  scalar: CellValue;
  // Structural wire/provenance signal. This separates some observable API
  // shapes (typed value, formula-without-effectiveValue, spill recipient,
  // untouched/empty CellData), but it is not a complete semantic value type:
  // Sheets CellData can encode `=""` and `=IF(,,)` identically, so a
  // side-channel probe is needed to separate empty-string-returning formulas
  // from formula-returned Null in the general case.
  // - "number" / "string" / "boolean": typed value from effectiveValue
  // - "error": effectiveValue.errorValue
  // - "null": cell has formulaValue but no effectiveValue (`=IF(,,)`,
  //   `=""`, VLOOKUP-returning-blank, etc.; semantic split needs side-channel)
  // - "spill-null": rowData entry exists but no userEnteredValue and no
  //   effectiveValue (spill recipient producing Null)
  // - "blank": untouched cell or spill-recipient-of-empty-string
  kind: "number" | "string" | "boolean" | "error" | "null" | "spill-null" | "blank";
  // Formula text from userEnteredValue.formulaValue (with leading "=" added).
  formula?: string;
  // Display string from formattedValue.
  formatted?: string;
  // Inferred-type signal from effectiveFormat.numberFormat. Auto-applied by
  // gsheets for DATE/TIME/DATE_TIME/PERCENT/CURRENCY etc.
  numberFormat?: { type: string; pattern?: string };
  // Cell-level hyperlink convenience (only set when one link covers the whole cell).
  hyperlink?: string;
  // Per-substring formatting + the canonical link encoding for multi-link cells.
  textRuns?: Array<{ startIndex: number; format?: Record<string, unknown> }>;
  // Full raw CellData for downstream consumers needing fields outside the
  // collapse logic (e.g. textFormat.foregroundColor, hyperlinkDisplayType).
  raw?: ApiCellData;
  // D8.β: ISBLANK side-channel verdict for an ambiguous blank/null wire shape.
  // Set by applyBlankVerdicts; surfaced as GSheetsExtras.semantic_null. true ->
  // promoted to a null primitive; false -> scalar rewritten to "" (empty-string
  // formula result). Left unset when the probe was inconclusive.
  semantic_null?: boolean;
}

/** Per-sheet rich grid: SPILL_ROWS × SPILL_COLS, untouched cells are null. */
export type RichGrid = Array<Array<RichCell | null>>;

export class GSheetsDriver implements Driver {
  readonly platform = "gsheets" as const;
  private config: GSheetsDriverConfig;
  private createdSpreadsheet = false;
  private lastWriteRequestAt = 0;

  constructor(config: GSheetsDriverConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    if (!this.config.spreadsheetId) {
      await this.createSpreadsheet();
    } else {
      const res = await this.apiFetch("", { method: "GET" });
      if (!res.ok) {
        throw new Error(`Failed to access spreadsheet: ${res.status} ${await res.text()}`);
      }
    }
    // best-effort: clean orphans from a prior crashed run
    await this.cleanupOrphans().catch(() => {});
  }

  private async createSpreadsheet(): Promise<void> {
    const title = `assay-run-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties: { title } }),
    });
    if (!res.ok) {
      throw new Error(`Failed to create spreadsheet: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as { spreadsheetId?: string };
    if (!data.spreadsheetId) throw new Error("Failed to create spreadsheet: missing spreadsheetId");
    this.config.spreadsheetId = data.spreadsheetId;
    this.createdSpreadsheet = true;
  }

  private get spreadsheetId(): string {
    if (!this.config.spreadsheetId) throw new Error("Driver not initialized");
    return this.config.spreadsheetId;
  }

  async evaluate(formula: string, grid?: Record<string, CellValue>): Promise<RichGridValue> {
    const [r] = await this.evaluateBatch([{ formula, grid }]);
    const g = outcomeGrid(r.outcome);
    if (g) return g;
    throw new Error(outcomeErrorText(r.outcome) ?? `gsheets: ${r.outcome.kind}`);
  }

  async evaluateBatch(tasks: DriverTask[]): Promise<DriverTaskResult[]> {
    const results: Array<DriverTaskResult | null> = new Array(tasks.length).fill(null);

    const liveIdx: number[] = [];
    const liveTasks: DriverTask[] = [];
    const liveHasInput: boolean[] = [];
    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];
      if (t.skip) {
        results[i] = { outcome: { kind: "skipped", cause: "policy", reason: t.skip } };
      } else {
        liveIdx.push(i);
        liveTasks.push(t);
        // A grid-bearing task can't co-tile — its seeds would collide with co-tenants;
        // force its own host (charter §8 / cohost.coHostPlacement hasInput).
        liveHasInput.push(!!t.grid && Object.keys(t.grid).length > 0);
      }
    }

    // Placement plan: lump tasks tile onto shared hosts; in-place/isolate get a host
    // each. plan.tasks is in input order (taskIndex === index into liveTasks).
    const factor = tileFactor();
    const plan = planPacking(
      liveTasks.map((t) => t.formula),
      {
        hostRows: DEFAULT_LAYOUT.stagingRows * factor,
        hostCols: DEFAULT_LAYOUT.stagingCols * factor,
        hasInput: liveHasInput,
      },
    );
    const placements = plan.tasks;
    const chunks = chunkByHosts(placements, CHUNK_SHEETS);

    let aborted = false;
    for (const [lo, hi] of chunks) {
      if (aborted) {
        // Not engine-attributable: these tasks never ran (upstream fatal).
        for (let j = lo; j < hi; j++) {
          results[liveIdx[j]] = {
            outcome: {
              kind: "infra",
              detail: "not run: earlier chunk failed fatally",
              retryable: true,
            },
          };
        }
        continue;
      }

      try {
        const chunkResults = await this.runChunk(liveTasks.slice(lo, hi), placements.slice(lo, hi));
        for (let j = 0; j < chunkResults.length; j++) {
          results[liveIdx[lo + j]] = chunkResults[j];
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        // A host wedge is handled inside runChunk (D4 un-wedge + attribution), so
        // anything thrown to here is transport/quota/auth — not engine-attributable,
        // retryable; genuine auth/quota aborts the remaining run (isFatal).
        for (let j = lo; j < hi; j++) {
          results[liveIdx[j]] = { outcome: { kind: "infra", detail: msg, retryable: true } };
        }
        if (isFatal(msg)) aborted = true;
      }
    }

    return results.map(
      (r) => r ?? { outcome: { kind: "unclassified", raw: null, note: "no result produced" } },
    );
  }

  capabilities(): CapabilityDescriptor {
    return capabilityDescriptorFor(this.platform);
  }

  async versionString(): Promise<string | null> {
    // gsheets has no version string — fingerprint via sentinels (deferred)
    return null;
  }

  async destroy(): Promise<void> {
    // chunk teardown deletes its own sheets; orphan sweep runs on next init()
    if (!this.createdSpreadsheet || !this.config.spreadsheetId) return;
    const spreadsheetId = this.config.spreadsheetId;
    this.createdSpreadsheet = false;
    this.config.spreadsheetId = undefined;
    try {
      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(spreadsheetId)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${this.config.accessToken}` },
        },
      );
      if (res.status === 403) {
        process.stderr.write(
          "  [gsheets] token lacks drive.file; re-run `assay login` to delete run workbooks\n",
        );
      }
    } catch {
      // best-effort teardown
    }
  }

  private async runChunk(
    tasks: DriverTask[],
    placements: PlacedTask[],
  ): Promise<DriverTaskResult[]> {
    const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    // One sheet per distinct HOST; co-tiled lumps share a host. Size each host to
    // cover its tiles + the input region (GRID_ROWS/COLS floor).
    const hostOrder: number[] = [];
    const hostToTitle = new Map<number, string>();
    const hostExtent = new Map<number, { rows: number; cols: number }>();
    for (const p of placements) {
      if (!hostToTitle.has(p.host)) {
        hostToTitle.set(p.host, `${SHEET_PREFIX}h${hostOrder.length}-${stamp}`);
        hostOrder.push(p.host);
        hostExtent.set(p.host, { rows: GRID_ROWS, cols: GRID_COLS });
      }
      const ext = hostExtent.get(p.host)!;
      ext.rows = Math.max(ext.rows, p.region.top + p.region.rows - 1);
      ext.cols = Math.max(ext.cols, p.region.left + p.region.cols - 1);
    }
    // Per-task: its host sheet title + formula cell + read range (its own tile).
    const taskTitle = placements.map((p) => hostToTitle.get(p.host)!);
    const formulaCells = placements.map((p) => regionCellA1(p.region));
    // Dedicated D8.β probe sheet, created alongside the host sheets.
    const probeTitle = `${SHEET_PREFIX}probe-${stamp}`;
    this.sheetsCreated += hostOrder.length; // amortization signal (host sheets, not tasks)

    const addRes = await this.batchUpdate([
      ...hostOrder.map((h) => ({
        addSheet: {
          properties: {
            title: hostToTitle.get(h),
            gridProperties: {
              rowCount: hostExtent.get(h)!.rows,
              columnCount: hostExtent.get(h)!.cols,
            },
          },
        },
      })),
      {
        addSheet: {
          properties: {
            title: probeTitle,
            gridProperties: { rowCount: PROBE_SHEET_ROWS, columnCount: 2 },
          },
        },
      },
    ]);

    const replies = addRes.replies as Array<{ addSheet?: { properties?: { sheetId?: number } } }>;
    const hostSheetIds: number[] = replies
      .slice(0, hostOrder.length)
      .map((r) => r.addSheet?.properties?.sheetId ?? -1);
    const probeSheetId: number = replies[hostOrder.length]?.addSheet?.properties?.sheetId ?? -1;

    try {
      // Type-route seeds: literals via RAW (so "3" stays text), error seeds +
      // formulas via USER_ENTERED. Each task's formula goes at its tile cell on its
      // host sheet; in-place grids go at their refs (those tasks own their host).
      const raw: Array<{ range: string; values: unknown[][] }> = [];
      const userEntered: Array<{ range: string; values: unknown[][] }> = [];
      for (let i = 0; i < tasks.length; i++) {
        const part = partitionSeeds(taskTitle[i], tasks[i].grid || {}, tasks[i].formula, formulaCells[i]);
        raw.push(...part.raw);
        userEntered.push(...part.userEntered);
      }
      await this.valuesBatchUpdate(raw, "RAW");
      await this.valuesBatchUpdate(userEntered, "USER_ENTERED");

      await sleep(CALC_WAIT_MS);

      // One range per TASK = its own tile region (spreadsheetsGetRich resolves
      // multiple ranges per sheet). Captures the full RichCell payload per cell.
      const ranges = placements.map((p, i) => `'${taskTitle[i]}'!${regionRangeA1(p.region)}`);
      let richGrids: RichGrid[];
      try {
        richGrids = await this.spreadsheetsGetRich(ranges);
      } catch (e: unknown) {
        if (!(e instanceof GSheetsWedgeError)) throw e;
        // The whole spreadsheet wedged (§6.1): one poison formula 500s every read.
        // Heal it by clearing every task's formula cell (we don't yet know which is
        // poison) so it stays reusable + teardown's deleteSheet works, then attribute
        // the crash by re-running each suspect in isolation.
        await this.clearFormulaCells(taskTitle.map((t, i) => ({ title: t, cell: formulaCells[i] })));
        return await this.attributeWedge(tasks, e.channel);
      }

      // D8.β: disambiguate empty-string-vs-Null on each tile's grid BEFORE
      // promotion/trim, mapping each ambiguous cell back to its absolute coord via the
      // task's tile origin. Lazy: skips the extra API calls when nothing is ambiguous.
      const origins = placements.map((p, i) => ({
        title: taskTitle[i],
        top: p.region.top,
        left: p.region.left,
      }));
      await this.disambiguateBlanks(richGrids, origins, probeTitle);

      const results: DriverTaskResult[] = tasks.map((_t, i) => ({
        outcome: valueOutcome(trimRichGrid(promoteRichGrid(richGrids[i] ?? []))),
      }));

      // #REF!-artifact recovery: a co-tiled lump blocked by a neighbour tile comes
      // back #REF! — re-run it ALONE (canonical sheet) so it spills freely, override.
      await this.recoverSpillBlocked(tasks, placements, results);

      return results;
    } finally {
      // clear-then-delete, never deleteSheet-first (§6.2 D4): on the wedge path the
      // poison cells are already cleared above (un-wedged), so deleteSheet succeeds.
      await this.batchUpdate(
        [...hostSheetIds, probeSheetId]
          .filter((id) => id >= 0)
          .map((sheetId) => ({ deleteSheet: { sheetId } })),
      ).catch(() => {});
    }
  }

  /**
   * Un-wedge primitive (§6.1, grounded live): overwriting a poison formula cell
   * with a RAW empty value heals the spreadsheet's recalc graph — the ONLY thing
   * that lets structural ops (deleteSheet) run again. We clear every formula cell
   * (per-task tile cell) since we don't yet know which one is the poison. Best-effort.
   */
  private async clearFormulaCells(
    cells: Array<{ title: string; cell: string }>,
    spreadsheetId: string = this.spreadsheetId,
  ): Promise<void> {
    const data = cells.map(({ title, cell }) => ({ range: `'${title}'!${cell}`, values: [[""]] }));
    await this.valuesBatchUpdate(data, "RAW", spreadsheetId).catch(() => {});
  }

  /**
   * #REF!-artifact recovery (the co-tiling safety net, mirror of Excel's #SPILL!):
   * a co-tiled lump (its host shared by >1 task) that came back #REF! was blocked by a
   * neighbour tile, not a real error. Re-run those ALONE on the main spreadsheet
   * (runOneIsolated → canonical AA1, own sheet) so they spill freely, and override.
   * Rare, so the extra round trips are acceptable; a solo task's #REF! is left as-is
   * (it's real). Mutates `results` in place.
   */
  private async recoverSpillBlocked(
    tasks: DriverTask[],
    placements: PlacedTask[],
    results: DriverTaskResult[],
  ): Promise<void> {
    const hostCount = new Map<number, number>();
    for (const p of placements) hostCount.set(p.host, (hostCount.get(p.host) ?? 0) + 1);
    const suspects: number[] = [];
    for (let i = 0; i < results.length; i++) {
      if ((hostCount.get(placements[i].host) ?? 0) > 1 && isSpillBlocked(results[i].outcome)) {
        suspects.push(i);
      }
    }
    for (const i of suspects) {
      results[i] = await this.runOneIsolated(tasks[i], this.spreadsheetId);
    }
  }

  /**
   * Attribute a whole-spreadsheet wedge to its one culprit (§6.2 D4). The wedge is
   * spreadsheet-global, so a read-bisect can't dodge it; the only isolation boundary
   * is the spreadsheet itself. We provision ONE fresh throwaway spreadsheet and
   * re-run each suspect alone in it (un-wedging between, so a poison suspect doesn't
   * block the next) — the suspect that re-wedges is the culprit (crashed{channel});
   * its clean siblings yield real values. The throwaway can't be deleted without
   * `drive.file` scope, so it orphans (accepted cruft, §6 backlog). If provisioning
   * fails, fall back to the honest coarse outcome: the whole chunk crashed.
   */
  private async attributeWedge(
    chunk: DriverTask[],
    fallbackChannel: "host-wedge" | "timeout",
  ): Promise<DriverTaskResult[]> {
    let throwawayId: string;
    try {
      throwawayId = await this.createThrowawaySpreadsheet();
    } catch {
      // Couldn't provision an isolation boundary — don't lie about which task
      // wedged; mark the whole chunk crashed (the host did wedge, attribution
      // just wasn't possible).
      return chunk.map(() => ({ outcome: { kind: "crashed", channel: fallbackChannel } }));
    }
    const out: DriverTaskResult[] = [];
    for (const task of chunk) {
      out.push(await this.runOneIsolated(task, throwawayId));
    }
    process.stderr.write(
      `  [gsheets] wedge recovery: orphaned throwaway spreadsheet ${throwawayId} ` +
        `(no drive.file scope to delete — sweep manually)\n`,
    );
    return out;
  }

  /** Create a fresh empty spreadsheet (spreadsheets scope) for wedge isolation. */
  private async createThrowawaySpreadsheet(): Promise<string> {
    // spreadsheets.create has no spreadsheetId in the path, so it bypasses apiFetch.
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: { title: "assay-wedge-recovery (scratch — safe to trash)" },
      }),
    });
    if (!res.ok) throw new Error(`create throwaway: ${res.status} ${await res.text()}`);
    const j = (await res.json()) as { spreadsheetId?: string };
    if (!j.spreadsheetId) throw new Error("create throwaway: no spreadsheetId in response");
    return j.spreadsheetId;
  }

  /**
   * Re-run ONE task alone in the given (throwaway) spreadsheet to test whether it
   * is the wedge culprit. Returns crashed{channel} if it re-wedges, else its value.
   * Un-wedges (clears its cell) before returning so the next suspect runs cleanly,
   * then deletes its sheet. Skips the D8.β blank probe — the rare recovery path
   * doesn't need the empty-string/Null refinement.
   */
  private async runOneIsolated(task: DriverTask, spreadsheetId: string): Promise<DriverTaskResult> {
    const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const title = `${SHEET_PREFIX}iso-${stamp}`;
    const addRes = await this.batchUpdate(
      [
        {
          addSheet: {
            properties: { title, gridProperties: { rowCount: GRID_ROWS, columnCount: GRID_COLS } },
          },
        },
      ],
      spreadsheetId,
    );
    const reply = (addRes.replies as Array<{ addSheet?: { properties?: { sheetId?: number } } }>)[0];
    const sheetId = reply?.addSheet?.properties?.sheetId ?? -1;
    try {
      const part = partitionSeeds(title, task.grid || {}, task.formula, TARGET_CELL);
      await this.valuesBatchUpdate(part.raw, "RAW", spreadsheetId);
      await this.valuesBatchUpdate(part.userEntered, "USER_ENTERED", spreadsheetId);
      await sleep(CALC_WAIT_MS);
      try {
        const [richGrid] = await this.spreadsheetsGetRich([`'${title}'!${READ_RANGE}`], spreadsheetId);
        return { outcome: valueOutcome(trimRichGrid(promoteRichGrid(richGrid ?? []))) };
      } catch (e: unknown) {
        if (!(e instanceof GSheetsWedgeError)) throw e;
        // This suspect re-wedged the fresh spreadsheet alone ⇒ it IS the culprit.
        await this.clearFormulaCells([{ title, cell: TARGET_CELL }], spreadsheetId); // un-wedge next
        return { outcome: { kind: "crashed", channel: e.channel } };
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { outcome: { kind: "infra", detail: `isolated re-run failed: ${msg}`, retryable: true } };
    } finally {
      if (sheetId >= 0) {
        await this.batchUpdate([{ deleteSheet: { sheetId } }], spreadsheetId).catch(() => {});
      }
    }
  }

  // D8.β side-channel: for every ambiguous blank/null cell read this chunk,
  // write `=ISBLANK('<sheet>'!<coord>)` into the probe sheet, read the
  // booleans back, and tighten the RichCell grid in place. ISBLANK evaluates
  // the cell's RESULT, so TRUE = genuine runtime Null, FALSE = empty-string
  // formula result (gsheets-celldata-gap.md Probe 6). One throttled write +
  // one read; no-op when there are no candidates.
  private async disambiguateBlanks(
    richGrids: RichGrid[],
    origins: Array<{ title: string; top: number; left: number }>,
    probeTitle: string,
  ): Promise<void> {
    const candidates = collectProbeCandidates(richGrids, origins);
    if (candidates.length === 0) return;

    const probeFormulas = candidates.map((c) => [`=ISBLANK('${c.sheetTitle}'!${c.coord})`]);
    await this.valuesBatchUpdate([{ range: `'${probeTitle}'!A1`, values: probeFormulas }]);
    await sleep(CALC_WAIT_MS);

    const [probeGrid] = await this.spreadsheetsGetRich([
      `'${probeTitle}'!A1:A${candidates.length}`,
    ]);
    // Only a genuine boolean ISBLANK result is a verdict. A missing or
    // non-boolean probe read (timing miss, malformed response) yields
    // `undefined` — the cell is left unprobed rather than silently classified,
    // so a read failure can't masquerade as a real ISBLANK=true.
    const verdicts: Array<boolean | undefined> = candidates.map((_, i) => {
      const s = probeGrid?.[i]?.[0]?.scalar;
      return typeof s === "boolean" ? s : undefined;
    });
    applyBlankVerdicts(richGrids, candidates, verdicts);
  }

  // Adaptive-backoff fetch: 401/403 throw immediately (fail-fast on auth);
  // 429/5xx retry up to MAX_BACKOFF_ATTEMPTS with exponential backoff +
  // jitter. spreadsheets.get is heavier than values.batchGet, so the
  // retry envelope is wider than the previous one-retry-then-abort policy.
  //
  // Tracking: counts requests + 429 hits to stderr for quota-profiling
  // observability. Per gsheets walk recommendation, we need real-world
  // numbers (per-chunk request rate, payload size, 429 frequency) before
  // raising the quota envelope productively. This is the minimum hook for
  // collecting them.
  private static readonly MAX_BACKOFF_ATTEMPTS = 4;
  private requestCount = 0;
  private throttleHits = 0;
  private sheetsCreated = 0;
  private async apiFetch(
    path: string,
    init: RequestInit,
    spreadsheetId: string = this.spreadsheetId,
  ): Promise<Response> {
    const url = `${API_BASE}/${spreadsheetId}${path}`;
    const headers = {
      Authorization: `Bearer ${this.config.accessToken}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    };

    for (let attempt = 0; attempt < GSheetsDriver.MAX_BACKOFF_ATTEMPTS; attempt++) {
      this.requestCount++;
      // Per-request hang guard (D4): a wedged host can hang a read forever.
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), READ_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch(url, { ...init, headers, signal: ctrl.signal });
      } catch (e: unknown) {
        if (ctrl.signal.aborted) {
          throw new GSheetsWedgeError("timeout", `request timed out after ${READ_TIMEOUT_MS}ms: ${path}`);
        }
        throw e;
      } finally {
        clearTimeout(timer);
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error(`auth error: ${res.status} ${await res.text()}`);
      }
      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        if (res.status === 429) this.throttleHits++;
        const isLast = attempt === GSheetsDriver.MAX_BACKOFF_ATTEMPTS - 1;
        if (isLast) {
          const body = await res.text();
          // 429 = genuine quota (retryable; may abort the run). 5xx after retries
          // = a host WEDGE (poison-formula-global, §6.1) — NOT quota: recoverable
          // via un-wedge + fresh-spreadsheet attribution, and must NOT trip the
          // run-abort. (A transient non-wedge 5xx is safe here too: the recovery
          // re-runs the suspect and it simply succeeds, attributing nothing.)
          if (res.status === 429) throw new Error(`quota error: ${res.status} ${body}`);
          throw new GSheetsWedgeError("host-wedge", `host wedge: ${res.status} ${body}`);
        }
        // Exponential backoff with jitter: 1s, 2s, 4s, 8s (capped) + 0–1s.
        const base = 1000 * 2 ** attempt;
        const wait = base + Math.random() * 1000;
        process.stderr.write(
          `  [gsheets ${res.status}] attempt ${attempt + 1}/${GSheetsDriver.MAX_BACKOFF_ATTEMPTS}, retrying in ${(wait / 1000).toFixed(1)}s (total throttle hits this driver: ${this.throttleHits})\n`,
        );
        await sleep(wait);
        continue;
      }
      return res;
    }
    throw new Error("unreachable");
  }

  /** Quota observability — request count, 429 hit count, and the number of host
   * SHEETS this driver created (the tiling amortization signal) for its lifetime. */
  getQuotaStats(): { requests: number; throttleHits: number; sheetsCreated: number } {
    return {
      requests: this.requestCount,
      throttleHits: this.throttleHits,
      sheetsCreated: this.sheetsCreated,
    };
  }

  private async batchUpdate(
    requests: unknown[],
    spreadsheetId: string = this.spreadsheetId,
  ): Promise<Record<string, unknown>> {
    if (requests.length === 0) return { replies: [] };
    await this.throttleWriteRequest();
    const res = await this.apiFetch(
      ":batchUpdate",
      { method: "POST", body: JSON.stringify({ requests }) },
      spreadsheetId,
    );
    if (!res.ok) throw new Error(`batchUpdate: ${res.status} ${await res.text()}`);
    return res.json() as Promise<Record<string, unknown>>;
  }

  private async valuesBatchUpdate(
    data: Array<{ range: string; values: unknown[][] }>,
    valueInputOption: "RAW" | "USER_ENTERED" = "USER_ENTERED",
    spreadsheetId: string = this.spreadsheetId,
  ): Promise<void> {
    if (data.length === 0) return;
    await this.throttleWriteRequest();
    const res = await this.apiFetch(
      "/values:batchUpdate",
      { method: "POST", body: JSON.stringify({ valueInputOption, data }) },
      spreadsheetId,
    );
    if (!res.ok) throw new Error(`values.batchUpdate: ${res.status} ${await res.text()}`);
  }

  /**
   * The read path: a single `spreadsheets.get?includeGridData=true` call with a field
   * mask, producing one RichGrid PER REQUESTED RANGE (in request order). The API groups
   * returned GridData by sheet, one `data[]` entry per range requested for that sheet,
   * in request order — so the k-th range under a title maps to that sheet's `data[k]`.
   * This resolves MULTIPLE ranges per sheet (dense tiling reads each tile separately),
   * not just one-range-per-sheet. Each RichGrid is sized by what the API returns
   * (sparse); padding/trimming is the caller's concern.
   */
  private async spreadsheetsGetRich(
    ranges: string[],
    spreadsheetId: string = this.spreadsheetId,
  ): Promise<RichGrid[]> {
    const out: RichGrid[] = ranges.map(() => []);
    // Bound ranges per GET (URL-length limit — see MAX_RANGES_PER_GET). Each sub-request
    // is independent; its results map back to GLOBAL indices via `base + local`.
    for (let base = 0; base < ranges.length; base += MAX_RANGES_PER_GET) {
      const sub = ranges.slice(base, base + MAX_RANGES_PER_GET);
      const qs = [
        ...sub.map((r) => `ranges=${encodeURIComponent(r)}`),
        "includeGridData=true",
        `fields=${encodeURIComponent(GET_FIELD_MASK)}`,
      ].join("&");
      const res = await this.apiFetch(`?${qs}`, { method: "GET" }, spreadsheetId);
      if (!res.ok) {
        throw new Error(`spreadsheets.get: ${res.status} ${await res.text()}`);
      }
      const body = (await res.json()) as {
        sheets?: Array<{
          properties?: { title?: string };
          data?: Array<{ rowData?: Array<{ values?: ApiCellData[] }> }>;
        }>;
      };
      // Request indices grouped by title, in this sub-request's order (so data[k] ↔ the
      // k-th range of that title in THIS GET). Assumes each title appears ONCE in the
      // response — load-bearing: host sheet titles are stamp-unique
      // (`${SHEET_PREFIX}h${k}-${stamp}`), so a title never repeats across `body.sheets`;
      // if it did, the later sheet would re-read this title's request list from index 0
      // and clobber earlier grids. (A title's tiles may split across sub-requests; each
      // GET independently maps only its own ranges, so the split is safe.)
      const reqByTitle = new Map<string, number[]>();
      sub.forEach((r, i) => {
        const title = r.match(/^'([^']+)'!/)?.[1];
        if (title === undefined) return;
        const arr = reqByTitle.get(title);
        if (arr) arr.push(base + i);
        else reqByTitle.set(title, [base + i]);
      });
      for (const sheet of body.sheets ?? []) {
        const title = sheet.properties?.title;
        if (!title) continue;
        const reqIdx = reqByTitle.get(title) ?? [];
        const data = sheet.data ?? [];
        for (let k = 0; k < data.length && k < reqIdx.length; k++) {
          out[reqIdx[k]] = rowDataToRichGrid(data[k]?.rowData ?? []);
        }
      }
    }
    return out;
  }

  private async cleanupOrphans(): Promise<void> {
    const res = await this.apiFetch("?fields=sheets.properties", { method: "GET" });
    if (!res.ok) return;
    const body = (await res.json()) as {
      sheets?: Array<{ properties: { sheetId: number; title: string } }>;
    };
    const orphans = (body.sheets || []).filter((s) => s.properties.title.startsWith(SHEET_PREFIX));
    if (orphans.length === 0) return;
    await this.batchUpdate(
      orphans.map((s) => ({ deleteSheet: { sheetId: s.properties.sheetId } })),
    ).catch(() => {});
  }

  private async throttleWriteRequest(): Promise<void> {
    const now = Date.now();
    const wait = this.lastWriteRequestAt + WRITE_REQUEST_INTERVAL_MS - now;
    if (wait > 0) await sleep(wait);
    this.lastWriteRequestAt = Date.now();
  }
}

// sheets api can't write a cell error — stringify so it's treated as text.
// formulas under test typically don't read these back, so the round-trip
// is best-effort not lossless.
function cellToSheets(v: CellValue): unknown {
  if (isCellError(v)) return v.error;
  return v;
}

interface ValueRange {
  range: string;
  values: unknown[][];
}

/**
 * Partition one task's grid seeds + its formula into RAW and USER_ENTERED writes
 * (the type-faithful-seeding fix, D1/D6). `classifySeed` decides each seed's type
 * ONCE: number/text/bool → RAW (USER_ENTERED would coerce "3"→number); error →
 * USER_ENTERED carrying the sentinel (parsed into a real errorValue); formula →
 * USER_ENTERED; blank → not written. The target formula always goes USER_ENTERED.
 * Pure (no network), so the routing is unit-testable without a live spreadsheet.
 */
export function partitionSeeds(
  title: string,
  grid: Record<string, CellValue>,
  formula: string,
  targetCell: string,
): { raw: ValueRange[]; userEntered: ValueRange[] } {
  const raw: ValueRange[] = [];
  const userEntered: ValueRange[] = [];
  for (const [cell, value] of Object.entries(grid)) {
    const range = `'${title}'!${cell}`;
    const intent = classifySeed(value as SeedValue);
    switch (intent.kind) {
      case "blank":
        break;
      case "number":
      case "text":
      case "boolean":
        raw.push({ range, values: [[cellToSheets(value)]] });
        break;
      case "error":
        userEntered.push({ range, values: [[intent.sentinel]] });
        break;
      case "formula":
        userEntered.push({ range, values: [[intent.formula]] });
        break;
    }
  }
  userEntered.push({ range: `'${title}'!${targetCell}`, values: [[formula]] });
  return { raw, userEntered };
}

// Map gsheets ErrorType enum to the #-prefixed sentinel used by CellValue.
// gsheets's ErrorType is closed-set; this is a 1:1 LOSSLESS mapping per the
// published schema — Sheets-native types without a #-spelling take the
// default `#<TYPE>` rule. LOADING previously merged into the Excel-shaped
// #GETTING_DATA; that was measurably lossy (Sheets ERROR.TYPE=10 vs Excel's
// documented 8 — loading-error-identity pickup, 2026-07-13) and is
// preserved raw since the re-founding: cross-engine analogy is an opt-in
// lens at read time, never the capture. ERROR / LOADING are
// runtime-observed additions; NULL_VALUE is Excel-compat (never emitted by
// gsheets natively per the gsheets walk).
function errorTypeToSentinel(type: string | undefined): string {
  switch (type) {
    case "DIVIDE_BY_ZERO":
      return "#DIV/0!";
    case "N_A":
      return "#N/A";
    case "NAME":
      return "#NAME?";
    case "NULL_VALUE":
      return "#NULL!";
    case "NUM":
      return "#NUM!";
    case "REF":
      return "#REF!";
    case "VALUE":
      return "#VALUE!";
    case "ERROR":
      return "#ERROR!";
    case "LOADING":
      return "#LOADING";
    default:
      return type ? `#${type}` : "#ERROR!";
  }
}

/**
 * Build a RichCell from one CellData wire-format entry.
 *
 * Returns null only when the entry is observably-empty (no userEnteredValue,
 * no effectiveValue, no formattedValue, no textFormatRuns). Spill recipients
 * with empty-string results or Null results still produce a RichCell — the
 * structural distinction (empty cell-data object vs missing rowData entry)
 * carries semantic meaning per the audit (gsheets-driver-fidelity.md G5).
 */
/** Build a sparse RichGrid from one range's `rowData` (API shape). */
function rowDataToRichGrid(rowData: Array<{ values?: ApiCellData[] }>): RichGrid {
  const grid: RichGrid = [];
  for (let r = 0; r < rowData.length; r++) {
    const apiRow = rowData[r]?.values ?? [];
    const row: Array<RichCell | null> = [];
    for (let c = 0; c < apiRow.length; c++) row.push(buildRichCell(apiRow[c]));
    grid.push(row);
  }
  return grid;
}

function buildRichCell(api: ApiCellData | undefined | null): RichCell | null {
  if (!api) return null;
  const hasUserEntered = api.userEnteredValue !== undefined;
  const hasEffective = api.effectiveValue !== undefined;
  const hasFormatted = api.formattedValue !== undefined;
  const hasRuns = (api.textFormatRuns?.length ?? 0) > 0;
  const hasHyperlink = api.hyperlink !== undefined;
  if (!hasUserEntered && !hasEffective && !hasFormatted && !hasRuns && !hasHyperlink) {
    // Empty CellData object — observable as "untouched within populated
    // region" per the gsheets-driver-fidelity G5 finding. Treat as blank.
    return {
      scalar: null,
      kind: "blank",
      raw: api,
    };
  }

  // Build the scalar collapse and kind classification.
  let scalar: CellValue = null;
  let kind: RichCell["kind"] = "blank";

  if (api.effectiveValue?.numberValue !== undefined) {
    scalar = api.effectiveValue.numberValue;
    kind = "number";
  } else if (api.effectiveValue?.stringValue !== undefined) {
    scalar = api.effectiveValue.stringValue;
    kind = "string";
  } else if (api.effectiveValue?.boolValue !== undefined) {
    scalar = api.effectiveValue.boolValue;
    kind = "boolean";
  } else if (api.effectiveValue?.errorValue !== undefined) {
    const sentinel = errorTypeToSentinel(api.effectiveValue.errorValue.type);
    scalar = { error: sentinel } as CellError;
    kind = "error";
  } else if (hasUserEntered && !hasEffective) {
    // Cell has a formula but no effective value. This is a wire shape, not a
    // complete semantic classification: it covers formula-returned Null
    // (e.g. =IF(,,), VLOOKUP returning a blank cell) and formula-returned
    // empty string (`=""`) unless a side-channel probe disambiguates them.
    // Distinct from spill recipients, which have no userEnteredValue.
    scalar = null;
    kind = "null";
  } else if (!hasUserEntered && !hasEffective && hasFormatted) {
    // Spill recipient with empty-string result: has formattedValue (""),
    // no userEnteredValue (only the anchor has it), no effectiveValue.
    scalar = "";
    kind = "blank";
  } else if (!hasUserEntered && !hasEffective) {
    // Spill recipient with Null result: nothing in any value field.
    scalar = null;
    kind = "spill-null";
  }

  const rich: RichCell = { scalar, kind, raw: api };
  if (api.userEnteredValue?.formulaValue !== undefined) {
    rich.formula = api.userEnteredValue.formulaValue;
  }
  if (api.formattedValue !== undefined) {
    rich.formatted = api.formattedValue;
  }
  if (api.effectiveFormat?.numberFormat?.type !== undefined) {
    rich.numberFormat = {
      type: api.effectiveFormat.numberFormat.type,
      pattern: api.effectiveFormat.numberFormat.pattern,
    };
  }
  if (api.hyperlink !== undefined) {
    rich.hyperlink = api.hyperlink;
  }
  if (api.textFormatRuns && api.textFormatRuns.length > 0) {
    rich.textRuns = api.textFormatRuns.map((run) => ({
      startIndex: run.startIndex ?? 0,
      format: run.format as Record<string, unknown> | undefined,
    }));
  }
  return rich;
}

// Classic Excel 7-error set. Non-classic gsheets errors (#ERROR!,
// #LOADING, and anything from the errorTypeToSentinel default branch)
// project to PrimitiveValue kind "extended-error" per D1.A.3 / coalescing doc.
const CLASSIC_ERROR_SENTINELS = new Set([
  "#DIV/0!",
  "#N/A",
  "#NAME?",
  "#NULL!",
  "#NUM!",
  "#REF!",
  "#VALUE!",
]);

/**
 * Map an internal RichCell to the canonical RichCellValue contract. Scalar
 * value drives the primitive variant; the RichCell.kind is preserved as
 * GSheetsExtras.wire_kind (wire provenance), and reasons for null/spill-null
 * derive from the kind (D1.A.2 β model — gsheets emits kind:"null" for the
 * propagatable runtime Null wire shape; semantic null-vs-empty-string split
 * deferred to D8.β).
 */
export function richCellToRichValue(rich: RichCell): RichCellValue {
  const primitive: PrimitiveValue = (() => {
    const s = rich.scalar;
    if (typeof s === "number") return { kind: "number", value: s };
    if (typeof s === "string") return { kind: "string", value: s };
    if (typeof s === "boolean") return { kind: "boolean", value: s };
    if (s !== null && isCellError(s)) {
      const sentinel = s.error;
      return CLASSIC_ERROR_SENTINELS.has(sentinel)
        ? { kind: "error", sentinel }
        : { kind: "extended-error", sentinel };
    }
    // Scalar is null — disambiguate via wire kind, refined by the D8.β probe.
    if (rich.kind === "spill-null") return { kind: "null", reason: "spill-null" };
    if (rich.kind === "null") return { kind: "null", reason: "formula-returned-null" };
    // A wire "blank" cell is untouched UNLESS the ISBLANK probe confirmed it
    // evaluates to a (non-empty-string) gsheets runtime Null — then it's null.
    if (rich.semantic_null === true) return { kind: "null" };
    return { kind: "blank", reason: "untouched" };
  })();

  const out: RichCellValue = {
    primitive,
    engine: {
      platform: "gsheets",
      wire_kind: rich.kind,
      // D8.β verdict, when the cell was probed. wire_kind stays the raw
      // provenance even when the primitive was tightened (true -> null,
      // false -> {string,""}).
      ...(rich.semantic_null !== undefined ? { semantic_null: rich.semantic_null } : {}),
      raw_api: rich.raw as Record<string, unknown> | undefined,
    },
  };
  if (rich.formula !== undefined) {
    out.formula = rich.formula.startsWith("=") ? rich.formula.slice(1) : rich.formula;
  }
  if (rich.formatted !== undefined) out.formatted = rich.formatted;
  if (rich.numberFormat !== undefined) out.number_format = rich.numberFormat;
  if (rich.hyperlink !== undefined) out.hyperlink = rich.hyperlink;
  return out;
}

// === D8.β empty-string-vs-Null disambiguation (pure, network-free) ===

/** A blank/null cell flagged for ISBLANK probing, with its A1 coordinate. */
export interface ProbeCandidate {
  gridIndex: number; // which sheet's grid in richGrids[]
  row: number; // 0-based within the read window
  col: number; // 0-based within the read window
  sheetTitle: string;
  coord: string; // absolute A1 coord on the sheet (e.g. "AA1")
}

// Kinds whose scalar collapses to null but whose wire shape can't tell an
// empty-string formula result from a genuine runtime Null.
const AMBIGUOUS_BLANK_KINDS = new Set<RichCell["kind"]>(["blank", "null", "spill-null"]);

/** 0-based column index to A1 letters. 0 -> "A", 26 -> "AA". */
export function colLetter(n: number): string {
  let s = "";
  let x = n + 1;
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

/**
 * Collect every ambiguous blank/null cell present in the chunk's rich grids. Each
 * grid `g` was read from task `g`'s tile, whose absolute origin is `origins[g]`
 * (1-indexed top/left); a read-window cell (r, c) maps to absolute coord
 * (left-1+c, top+r). Cells absent from the grid (genuinely untouched) are already
 * null and excluded.
 */
export function collectProbeCandidates(
  richGrids: RichGrid[],
  origins: Array<{ title: string; top: number; left: number }>,
): ProbeCandidate[] {
  const out: ProbeCandidate[] = [];
  for (let g = 0; g < richGrids.length; g++) {
    const grid = richGrids[g] ?? [];
    const origin = origins[g];
    if (origin === undefined) continue;
    for (let r = 0; r < grid.length; r++) {
      const row = grid[r] ?? [];
      for (let c = 0; c < row.length; c++) {
        const cell = row[c];
        if (!cell || !AMBIGUOUS_BLANK_KINDS.has(cell.kind)) continue;
        const coord = `${colLetter(origin.left - 1 + c)}${origin.top + r}`;
        out.push({ gridIndex: g, row: r, col: c, sheetTitle: origin.title, coord });
      }
    }
  }
  return out;
}

/**
 * Apply ISBLANK verdicts (parallel to `candidates`) to the rich grids in
 * place. true -> genuine gsheets runtime Null: record semantic_null; the
 * cell projects to a `null` primitive (see richCellToRichValue, which promotes
 * a probed-true wire "blank" to kind:"null"). false -> empty-string formula
 * result: rewrite scalar to "" so promotion yields {string,""}; `kind` stays
 * the raw wire provenance. undefined -> inconclusive probe: leave the cell
 * untouched (no semantic_null), so it falls back to its wire classification.
 */
export function applyBlankVerdicts(
  richGrids: RichGrid[],
  candidates: ProbeCandidate[],
  verdicts: Array<boolean | undefined>,
): void {
  for (let i = 0; i < candidates.length; i++) {
    const { gridIndex, row, col } = candidates[i];
    const cell = richGrids[gridIndex]?.[row]?.[col];
    if (!cell) continue;
    const isBlank = verdicts[i];
    if (isBlank === undefined) continue;
    cell.semantic_null = isBlank;
    if (!isBlank) cell.scalar = "";
  }
}

function promoteRichGrid(richGrid: RichGrid): RichGridValue {
  if (richGrid.length === 0) return [[null]];
  return richGrid.map((row) => row.map((rc) => (rc ? richCellToRichValue(rc) : null)));
}

// Trim trailing all-null columns and rows. Mirrors the legacy scalar
// trimGrid but operates on RichGridValue (null at a grid position still
// signals "no cell here" in the rich shape too).
function trimRichGrid(grid: RichGridValue): RichGridValue {
  while (grid.length > 1) {
    const lastRow = grid[grid.length - 1];
    if (lastRow.every((c) => c === null)) {
      grid.pop();
    } else {
      break;
    }
  }
  let maxCol = 0;
  for (const row of grid) {
    for (let c = row.length - 1; c >= 0; c--) {
      if (row[c] !== null) {
        if (c + 1 > maxCol) maxCol = c + 1;
        break;
      }
    }
  }
  maxCol = Math.max(maxCol, 1);
  return grid.map((row) => {
    const trimmed = row.slice(0, maxCol);
    while (trimmed.length < maxCol) trimmed.push(null);
    return trimmed;
  });
}

// Only genuine auth (401/403) or quota (429-exhausted) aborts the remaining run.
// A host WEDGE (5xx) no longer reaches here — runChunk recovers it in place (D4) —
// so it can't trip the abort. (Was: `quota/server error` lumped 5xx with quota,
// which is exactly how one poison formula voided + mislabeled the whole run, §6.1.)
function isFatal(msg: string): boolean {
  return msg.startsWith("auth error") || msg.startsWith("quota error");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
