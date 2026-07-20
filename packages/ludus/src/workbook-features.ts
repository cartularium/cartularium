import { strFromU8, unzipSync } from "fflate";
import { exportSpreadsheetXlsx, UnsupportedWorkbookError } from "./api.js";
import type { NamedFunctionSnap } from "./snapshot.js";

const WORKBOOK_XML = "xl/workbook.xml";
const MAX_WORKBOOK_XML_BYTES = 2 * 1024 * 1024;

export async function extractNamedFunctions(spreadsheetId: string): Promise<NamedFunctionSnap[]> {
  return namedFunctionsFromXlsx(await exportSpreadsheetXlsx(spreadsheetId));
}

export function namedFunctionsFromXlsx(xlsx: Uint8Array): NamedFunctionSnap[] {
  const files = unzipSync(xlsx, {
    filter(file) {
      if (file.name !== WORKBOOK_XML) return false;
      if (file.originalSize > MAX_WORKBOOK_XML_BYTES) {
        throw new UnsupportedWorkbookError(`workbook metadata exceeds ${MAX_WORKBOOK_XML_BYTES} bytes`);
      }
      return true;
    },
  });
  const workbook = files[WORKBOOK_XML];
  if (!workbook) throw new Error("XLSX has no xl/workbook.xml");
  return namedFunctionsFromWorkbookXml(strFromU8(workbook));
}

export function namedFunctionsFromWorkbookXml(xml: string): NamedFunctionSnap[] {
  const block = xml.match(/<(?:\w+:)?definedNames>([\s\S]*?)<\/(?:\w+:)?definedNames>/)?.[1];
  if (!block) return [];

  const functions: NamedFunctionSnap[] = [];
  const nameRe = /<(?:\w+:)?definedName\s+([^>]*)>([\s\S]*?)<\/(?:\w+:)?definedName>/g;
  for (const match of block.matchAll(nameRe)) {
    const name = attribute(match[1], "name");
    if (!name) continue;
    const definition = xmlUnescape(match[2]).trim();
    if (!isLambdaDefinition(definition)) continue;
    const comment = attribute(match[1], "comment");
    functions.push({
      name: xmlUnescape(name),
      definition,
      ...(comment === undefined ? {} : { comment: xmlUnescape(comment) }),
    });
  }
  return functions;
}

function isLambdaDefinition(definition: string): boolean {
  return /^=?\s*(?:_xlfn\.)?LAMBDA\s*\(/i.test(definition);
}

function attribute(attrs: string, name: string): string | undefined {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return attrs.match(new RegExp(`(?:^|\\s)${escaped}="([^"]*)"`))?.[1];
}

function xmlUnescape(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, digits: string) => String.fromCodePoint(Number.parseInt(digits, 16)))
    .replace(/&#([0-9]+);/g, (_, digits: string) => String.fromCodePoint(Number.parseInt(digits, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}
