// A1-notation range refs, 0-based and inclusive on both ends

export interface RangeRef {
  sheet: string;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export function parseRange(ref: string): RangeRef {
  const m = ref.match(/^(?:'([^']+)'|([^'!]+))!([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
  if (!m) throw new Error(`Cannot parse range ref "${ref}" (expected Sheet!A1:D40)`);
  return {
    sheet: m[1] ?? m[2],
    startCol: colToIndex(m[3]),
    startRow: Number(m[4]) - 1,
    endCol: colToIndex(m[5]),
    endRow: Number(m[6]) - 1,
  };
}

export function colToIndex(letters: string): number {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function rangeRows(r: RangeRef): number {
  return r.endRow - r.startRow + 1;
}

export function rangeCols(r: RangeRef): number {
  return r.endCol - r.startCol + 1;
}
