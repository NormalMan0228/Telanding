import {STAGES,createProgress,evaluateStage} from "./config.js";
const KEY="telemera.stages.v1";
export function saveProgress(progress,storage){
 try{storage??=globalThis.sessionStorage;storage.setItem(KEY,JSON.stringify(progress));}catch{}
}
export function restoreProgress(storage){
 const progress=createProgress();
 try{
  storage??=globalThis.sessionStorage;
  const saved=JSON.parse(storage.getItem(KEY));
  if(!saved)return progress;
  for(const stage of STAGES){
   const found=saved.clues?.[stage.id];
   if(Array.isArray(found))progress.clues[stage.id]=[...new Set(found.filter(id=>stage.clues.some(c=>c.object===id)))];
   const inputs=saved.inputs?.[stage.id],count=stage.panel==="switches"?5:stage.panel==="sequence"?6:3,max=stage.panel==="switches"?1:stage.panel==="sequence"?2:3;
   if(Array.isArray(inputs)&&inputs.length<=(count)&&inputs.every(v=>Number.isInteger(v)&&v>=0&&v<=max)&&(stage.panel==="sequence"||inputs.length===count))progress.inputs[stage.id]=[...inputs];
   progress.active=stage.id;
   evaluateStage(progress,{});
   // A previously solved panel remains cleared after its switches are moved.
   if(Array.isArray(saved.completed)&&saved.completed.includes(stage.id)&&progress.clues[stage.id].length===stage.clues.length&&!progress.completed.includes(stage.id))progress.completed.push(stage.id);
  }
  progress.watched=STAGES.filter(s=>progress.completed.includes(s.id)&&Array.isArray(saved.watched)&&saved.watched.includes(s.id)).map(s=>s.id);
  const requested=STAGES.findIndex(s=>s.id===saved.active);
  let allowed=0;
  while(allowed<STAGES.length-1&&progress.watched.includes(STAGES[allowed].id))allowed++;
  progress.active=STAGES[Math.max(0,Math.min(requested,allowed))].id;
 }catch{}
 return progress;
}
