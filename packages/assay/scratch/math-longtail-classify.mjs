import fs from "fs";
const wl = JSON.parse(fs.readFileSync("scratch/worklist/math-longtail.json","utf8"));

// missing in pycel entirely (single-call, no-operator #NAME?) — function absent
const pycelMissingFns = new Set(["ACOT","ACOTH","COT","COTH","CSC","CSCH","SEC","SECH","SQRTPI","GAMMALN","GAMMALN.PRECISE","IMLN","IMPOWER","IMSQRT","MUNIT","RAND","RANDBETWEEN","ERFC.PRECISE"]);

const clusters = {
  "libre-only": [],
  "pycel-operator-artifact": [],
  "pycel-missing-function": [],
  "pycel-domain-error": [],
  "acot-branch-cut": [],
  "erfc-precise-missing": [],
  "complex-rendering": [],
  "munit-error-codes": [],
  "rand-nondeterminism": [],
};

function hasOperatorArg(formula){
  // strip =FN( ... ) outer, look for + - * / inside arg (unary minus or binop) or nested call with operator
  const m = formula.match(/^=[A-Z0-9.]+\((.*)\)$/);
  const inner = m ? m[1] : formula.slice(1);
  return /[-+*/]/.test(inner.replace(/^[A-Z]/,"")); // any operator incl unary minus in args
}

for(const it of wl){
  const sub = it.subject, ref = it.ref, f = it.formula;
  // find pycel class
  let pycel=null, engMap={};
  for(const p of it.partition){ for(const e of p.engines){ engMap[e]=p; } }
  const pyClass = engMap["pycel"];
  const pyVal = pyClass ? pyClass.values : null;
  // Special named subjects first
  if(sub==="RAND"||sub==="RANDBETWEEN"){ clusters["rand-nondeterminism"].push(ref); continue; }
  if(sub==="MUNIT"){ clusters["munit-error-codes"].push(ref); continue; }
  if(sub==="IMLN"||sub==="IMPOWER"||sub==="IMSQRT"){ clusters["complex-rendering"].push(ref); continue; }
  if(sub==="ERFC.PRECISE"){ clusters["erfc-precise-missing"].push(ref); continue; }
  if(ref==="ACOT/acot-negative"){ clusters["acot-branch-cut"].push(ref); continue; }
  if(ref==="ACOS/acos-out-of-domain"||ref==="ASIN/asin-out-of-domain"){ clusters["pycel-domain-error"].push(ref); continue; }
  // pycel present in main agreeing group? check if pycel is grouped with excel
  const excelClass = engMap["excel"];
  const pycelWithExcel = pyClass && excelClass && pyClass===excelClass;
  if(pycelWithExcel){
    // only libreoffice diverges
    clusters["libre-only"].push(ref); continue;
  }
  // pycel diverges (#NAME?). missing-fn or operator-artifact?
  if(pycelMissingFns.has(sub)){ clusters["pycel-missing-function"].push(ref); continue; }
  // else operator artifact (function implemented, operator in arg)
  clusters["pycel-operator-artifact"].push(ref);
}

let total=0;
for(const [k,v] of Object.entries(clusters)){ console.log(`\n### ${k} (${v.length})`); console.log(v.join("\n")); total+=v.length; }
console.log("\n\nTOTAL:",total,"of",wl.length);
fs.writeFileSync("scratch/math-longtail-clusters.json", JSON.stringify(clusters,null,1));
