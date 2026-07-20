// Snapshot: everything the spike extracts from a spreadsheet, trimmed to the
// occupied region per sheet. `ue`/`fmt` are what rehydration writes back;
// `ev`/`fv` (computed value + rendered string) are what the diff compares.

export interface ExtendedValue {
  numberValue?: number;
  stringValue?: string;
  boolValue?: boolean;
  formulaValue?: string;
  errorValue?: { type?: string; message?: string };
}

export interface NumberFormat {
  type?: string;
  pattern?: string;
}

export interface CellSnap {
  ue?: ExtendedValue;
  fmt?: NumberFormat;
  ev?: ExtendedValue;
  fv?: string;
}

export interface SheetSnap {
  sheetId: number;
  title: string;
  rowCount: number;
  columnCount: number;
  /** trimmed dense matrix; null = untouched cell inside the trimmed region */
  cells: Array<Array<CellSnap | null>>;
}

export interface NamedRangeSnap {
  name: string;
  range: {
    sheetId?: number;
    startRowIndex?: number;
    endRowIndex?: number;
    startColumnIndex?: number;
    endColumnIndex?: number;
  };
}

export interface NamedFunctionSnap {
  name: string;
  definition: string;
  comment?: string;
}

export interface Snapshot {
  spreadsheetId: string;
  title: string;
  locale?: string;
  timeZone?: string;
  namedRanges: NamedRangeSnap[];
  namedFunctions: NamedFunctionSnap[];
  sheets: SheetSnap[];
}
