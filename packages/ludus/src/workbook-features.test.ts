import assert from "node:assert/strict";
import test from "node:test";
import { strToU8, zipSync } from "fflate";
import { namedFunctionsFromWorkbookXml, namedFunctionsFromXlsx } from "./workbook-features.js";

test("extracts Google and Excel LAMBDA defined names", () => {
  const xml = `
    <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <definedNames>
        <definedName name="INPUT">Sheet1!$A$1:$A$3</definedName>
        <definedName name="CONTAINS" comment="cell &amp; range">LAMBDA(cell, range, NOT(ISERROR(MATCH(cell,range,0))))</definedName>
        <definedName name="DOUBLE">_xlfn.LAMBDA(x, x * 2)</definedName>
        <definedName name="LOCAL" localSheetId="0">=LAMBDA(x, IF(x&lt;2, 1, x))</definedName>
      </definedNames>
    </workbook>`;

  assert.deepEqual(namedFunctionsFromWorkbookXml(xml), [
    {
      name: "CONTAINS",
      definition: "LAMBDA(cell, range, NOT(ISERROR(MATCH(cell,range,0))))",
      comment: "cell & range",
    },
    { name: "DOUBLE", definition: "_xlfn.LAMBDA(x, x * 2)" },
    { name: "LOCAL", definition: "=LAMBDA(x, IF(x<2, 1, x))" },
  ]);
});

test("accepts namespace-prefixed workbook XML", () => {
  const xml = `
    <x:workbook>
      <x:definedNames>
        <x:definedName name="ESCAPED">LAMBDA(x, x&amp;&quot; ok&quot;)</x:definedName>
      </x:definedNames>
    </x:workbook>`;

  assert.deepEqual(namedFunctionsFromWorkbookXml(xml), [
    { name: "ESCAPED", definition: 'LAMBDA(x, x&" ok")' },
  ]);
});

test("reads only workbook metadata from the XLSX archive", () => {
  const xlsx = zipSync({
    "xl/workbook.xml": strToU8(
      '<workbook><definedNames><definedName name="F">LAMBDA(x,x)</definedName></definedNames></workbook>',
    ),
    "xl/media/large.bin": new Uint8Array(256_000),
  });

  assert.deepEqual(namedFunctionsFromXlsx(xlsx), [{ name: "F", definition: "LAMBDA(x,x)" }]);
});

test("fails closed when workbook metadata is absent", () => {
  const xlsx = zipSync({ "xl/worksheets/sheet1.xml": strToU8("<worksheet/>") });
  assert.throws(() => namedFunctionsFromXlsx(xlsx), /no xl\/workbook\.xml/);
});

test("rejects workbook metadata above its decompressed-size limit", () => {
  const xlsx = zipSync({ "xl/workbook.xml": strToU8(" ".repeat(2 * 1024 * 1024 + 1)) });
  assert.throws(() => namedFunctionsFromXlsx(xlsx), /workbook metadata exceeds/);
});
