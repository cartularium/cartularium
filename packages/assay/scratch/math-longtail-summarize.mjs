import fs from 'fs';
const wl = JSON.parse(fs.readFileSync('scratch/worklist/math-longtail.json','utf8'));
console.log('TOTAL forks:', wl.length);
const bySub = {};
for (const it of wl) (bySub[it.subject] ??= []).push(it);
console.log('SUBJECTS:', Object.keys(bySub).length, Object.keys(bySub).join(' '));
function fmtVal(v){
  // v is grid: [[cell,...],...]
  try{
    const cell = v[0][0];
    if(cell.c==='number') return String(cell.v);
    if(cell.c==='error') return 'ERR:'+cell.v;
    if(cell.c==='blank') return 'BLANK';
    if(cell.c==='string') return 'STR:'+cell.v;
    if(cell.c==='boolean') return 'BOOL:'+cell.v;
    return JSON.stringify(cell);
  }catch(e){return JSON.stringify(v);}
}
for(const it of wl){
  const parts = it.partition.map(p=>{
    const vals = p.values.map(fmtVal);
    // dedupe
    const u=[...new Set(vals)];
    return `{${p.engines.join(',')}}=>${u.join('|')}`;
  });
  console.log(`\n${it.ref}  ${it.formula}`);
  for(const p of parts) console.log('   '+p);
}
