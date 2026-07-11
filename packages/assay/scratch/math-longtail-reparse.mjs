import fs from "fs";
// re-run parse from the raw tsv we saved (it stored fmt output already, but broken).
// Instead re-read persisted? We saved liveresults.tsv with broken fmt. Re-derive from raw JSON by re-running is costly.
// The tsv columns 3-6 hold JSON strings. Parse them.
const lines = fs.readFileSync("scratch/math-longtail-liveresults.tsv","utf8").split("\n");
function cell(js){
  try{
    const o = JSON.parse(js);
    const g = o.grid ?? o.result;
    const c = g[0][0];
    const p = c.primitive ?? c;
    if(p.kind==="number") return String(p.value);
    if(p.kind==="error") return "ERR:"+p.sentinel;
    if(p.kind==="string"||p.kind==="text") return "STR:"+p.value;
    if(p.kind==="boolean") return "BOOL:"+p.value;
    if(p.kind==="blank"||c===null) return "BLANK";
    return JSON.stringify(p);
  }catch(e){ return js.length>40? js.slice(0,40):js; }
}
const out=[];
for(let i=1;i<lines.length;i++){
  const parts=lines[i].split("\t");
  if(parts.length<6) continue;
  const [ref,formula,py,hf,ic,fo]=parts;
  out.push(`${ref}\t${formula}\tpy=${cell(py)}\thf=${cell(hf)}\tic=${cell(ic)}\tfo=${cell(fo)}`);
}
fs.writeFileSync("scratch/math-longtail-clean.tsv",out.join("\n"));
console.log(out.join("\n"));
