/** Stage clues and panel solutions; video sources are intentionally empty. */
export const STAGES = [
  { id:"01", room:0, panel:"dials", solution:[2,1,3], video:null,
    clues:[{object:"wall-crt",mark:"I + II",value:"3"},{object:"observer",mark:"II + III",value:"4"},{object:"sleep-terminal",mark:"III − I",value:"1"}] },
  { id:"02", room:1, panel:"switches", solution:[1,0,1,0,1], video:null,
    clues:[{object:"wall-lenses",mark:"Σ",value:"12"},{object:"organ",mark:"B ≠ C",value:"A = E"},{object:"chair",mark:"A B C D E",value:"1 2 3 5 8"}] },
  { id:"03", room:2, panel:"sequence", solution:[0,2,1,1,0,2], video:null,
    clues:[{object:"wall-reels",mark:"○ │ △",value:"0 1 2"},{object:"dream-spool",mark:"DATA",value:"2 0 1 · 1 2 0"},{object:"computer",mark:"READ",value:"←"}] },
];
export const SYMBOLS = ["○","│","△"];
export function createProgress() {
  return {active:"01", completed:[], watched:[], clues:{"01":[],"02":[],"03":[]}, inputs:{"01":[0,0,0],"02":[0,0,0,0,0],"03":[]}};
}
export function changeInput(progress,index) {
  const stage=STAGES.find(s=>s.id===progress.active),values=progress.inputs[stage.id];
  if(!Number.isInteger(index)||index<0||index>=(stage.panel==="switches"?5:3))return;
  if(stage.panel==="dials") { values[index]=(values[index]+1)%4;values[(index+1)%3]=(values[(index+1)%3]+1)%4; }
  if(stage.panel==="switches")values[index]=1-values[index];
  if(stage.panel==="sequence") { if(values.length>=stage.solution.length)values.length=0;values.push(index); }
}
export function collectClue(progress, object) {
  const stage=STAGES.find(s=>s.id===progress.active);
  const clue=stage.clues.find(c=>c.object===object);
  if(!clue)return null;
  if(!progress.clues[stage.id].includes(object))progress.clues[stage.id].push(object);
  return clue;
}
export function evaluateStage(progress, gameState, stages=STAGES) {
  const stage=stages.find(s=>s.id===progress.active);
  if(!stage||progress.completed.includes(stage.id))return false;
  const found=progress.clues?.[stage.id]??[];
  const input=progress.inputs?.[stage.id]??[];
  if(!stage.clues.every(c=>found.includes(c.object)))return false;
  if(input.length!==stage.solution.length||input.some((v,i)=>v!==stage.solution[i]))return false;
  progress.completed.push(stage.id);
  return true;
}
export function playableVideo(progress,id,stages=STAGES) {
  const stage=stages.find(s=>s.id===id);
  if(!progress.completed.includes(id)||!stage?.video)return null;
  return typeof stage.video==="string"&&(/^\/(?!\/)/.test(stage.video)||/^https:\/\//.test(stage.video))?stage.video:null;
}
export function finishVideo(progress,id) {
  if(id!==progress.active||!progress.completed.includes(id))return false;
  if(!progress.watched.includes(id))progress.watched.push(id);
  return true;
}
export function advanceStage(progress, devicePosition) {
  if(!progress.watched.includes(progress.active)||devicePosition<98)return false;
  const index=STAGES.findIndex(s=>s.id===progress.active);
  if(index<0||index===STAGES.length-1)return false;
  progress.active=STAGES[index+1].id;
  return true;
}
