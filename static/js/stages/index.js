import { roomObjects } from "../game/config.js";
import { state, activate } from "../game/index.js";
import { STAGES, SYMBOLS, collectClue, evaluateStage, playableVideo, finishVideo, advanceStage, canTransfer, changeInput } from "./config.js";
import {restoreProgress,saveProgress} from "./checkpoint.js";

const progress=restoreProgress();
const panel=document.getElementById("stage-panel");
const videoButton=document.getElementById("stage-video-open");
const videoDialog=document.getElementById("stage-video-dialog");
const video=document.getElementById("stage-video");
const transfer=document.getElementById("stage-transition");
const lever=document.getElementById("transfer-lever");
let playingStage=null;
state.stageMode=true;
state.introActive=false;
const current=()=>STAGES.find(s=>s.id===progress.active);
function pauseGame(paused) {
  state.videoActive=paused;state.keys.clear();
  state.waypoints=[];state.walkTarget=state.pendingAction=null;
}
function renderPanel() {
  const stage=current(),values=progress.inputs[stage.id];
  state.panelFeedback={room:stage.room,kind:stage.panel,values:[...values]};
  if(stage.panel==="switches")state.pressure=Math.min(3,values.filter(Boolean).length);
  panel.className="stage-panel panel-"+stage.panel;
  panel.replaceChildren();
  const header=document.createElement("div");
  header.className="panel-plate";header.textContent=stage.panel==="dials"?"I → II → III → I · +1 / 4":stage.panel==="switches"?"A / B / C / D / E":"6";
  panel.append(header);
  const controls=document.createElement("div");controls.className="panel-controls";
  const count=stage.panel==="switches"?5:3;
  for(let i=0;i<count;i++) {
    const button=document.createElement("button");
    button.type="button";button.className="puzzle-control";
    const mark=stage.panel==="dials"?["I","II","III"][i]:stage.panel==="switches"?["A","B","C","D","E"][i]:SYMBOLS[i];
    button.setAttribute("aria-label",stage.panel==="sequence"?mark+" 입력":mark+" 조절");
    if(stage.panel==="switches")button.setAttribute("aria-pressed",String(Boolean(values[i])));
    button.dataset.index=String(i);
    const label=document.createElement("span");label.className="control-mark";label.textContent=mark;
    const indicator=document.createElement("span");indicator.className="control-indicator";
    indicator.textContent=stage.panel==="dials"?String(values[i]):stage.panel==="switches"?(values[i]?"ON":"OFF"):SYMBOLS[i];
    button.style.setProperty("--rotation",(values[i]??0)*90+"deg");
    button.append(label,indicator);controls.append(button);
  }
  panel.append(controls);
  if(stage.panel==="sequence") {
    const display=document.createElement("output");display.className="sequence-output";
    display.textContent=values.map(v=>SYMBOLS[v]).join("  ")||"— — — — — —";panel.append(display);
    const reset=document.createElement("button");reset.type="button";reset.dataset.reset="true";reset.className="panel-reset";reset.textContent="↺";reset.setAttribute("aria-label","입력 초기화");panel.append(reset);
  }
  const strip=document.createElement("div");strip.className="clue-strip";strip.setAttribute("aria-label","수집한 단서");
  for(const clue of stage.clues) {
    const entry=document.createElement("span");
    entry.textContent=clue.mark+" : "+(progress.clues[stage.id].includes(clue.object)?clue.value:"—");
    strip.append(entry);
  }
  panel.append(strip);
  const status=document.createElement("output");status.id="panel-status";status.setAttribute("aria-live","polite");
  status.textContent=progress.completed.includes(stage.id)?(stage.video?"퍼즐 완료 · 영상 해금":"퍼즐 완료 · 이동 가능"):progress.clues[stage.id].length+" / 3";
  panel.append(status);
  if(stage.panel==="switches"){
    const meter=document.createElement("output");meter.className="panel-meter";
    meter.textContent="Σ "+values.reduce((sum,v,i)=>sum+v*[1,2,3,5,8][i],0);panel.append(meter);
  }
  updateVideoButton();
  saveProgress(progress);
}
function updateVideoButton() {
  const stage=current(),complete=progress.completed.includes(stage.id);
  videoButton.disabled=!complete;
  videoButton.textContent=canTransfer(progress)?(stage.id==="03"?"탐험 완료":"다음 스테이지"):complete?"영상 재생":"영상 잠김";
}
panel.addEventListener("click",event=>{
  const button=event.target.closest("button");
  if(!button||!panel.contains(button)||state.introActive)return;
  const stage=current(),values=progress.inputs[stage.id];
  if(button.dataset.reset)values.length=0;
  else {
    const i=Number(button.dataset.index);
    changeInput(progress,i);
  }
  const solved=evaluateStage(progress,state);
  const focusIndex=button.dataset.index, reset=button.dataset.reset;
  renderPanel();
  panel.querySelector(reset?"[data-reset]":'[data-index="'+focusIndex+'"]')?.focus({preventScroll:true});
  if(solved&&playableVideo(progress,stage.id))playVideo();
});
state.onInspect=id=>{
  if(id==="sign"){state.showHint?.("장치를 직접 클릭해 단서를 읽습니다. 아래 시야 슬라이더로 방을 둘러보고, 장치 선택 버튼으로 바로 조작할 수도 있습니다. 단서를 모아 제어 패널을 맞추세요.");return true;}
  if(id==="attendant"){
    const hints={
      "01":"세 식으로 다이얼의 값을 구합니다.\n다이얼을 누르면 자신과 바로 다음 다이얼이 함께 한 칸 움직입니다.",
      "02":"각 스위치의 값은 켜졌을 때 더해지는 전력입니다.\n합계와 두 회로 조건을 모두 맞춥니다.",
      "03":"기호표로 DATA를 바꿉니다.\nREAD 방향으로 여섯 자리를 읽어 입력합니다.",
    };
    state.showHint?.(hints[progress.active]);return true;
  }
  const clue=collectClue(progress,id);
  if(!clue)return id==="computer"||id==="sign"||id==="postmaster";
  renderPanel();
  document.getElementById("scene-caption").textContent=clue.mark+" : "+clue.value;
  state.captionUntil=performance.now()+4500;
  // Inspection is observable in the corresponding machine as well.
  if(id==="observer")state.eyeAwake=true;
  if(id==="sleep-terminal")state.monitorAwake=true;
  if(id.startsWith("wall-"))state.apparatus[state.world+":"+id]=true;
  if(evaluateStage(progress,state)) {
    renderPanel();
    if(playableVideo(progress,progress.active))playVideo();
  }
  return true;
};
function enterStage(preservePosition=false) {
  const stage=current();
  if(!preservePosition||state.world!==stage.room){state.player.x=state.cameraX=-14;state.player.z=0;}
  state.world=stage.room;
  state.player.gait=state.player.motion=0;state.keys.clear();
  state.activeObject=state.hoverObject=state.pendingAction=state.walkTarget=null;
  state.waypoints=[];state.transition=state.quiet?0:0.3;
  document.getElementById("stage-number").textContent="STAGE "+stage.id+" / 03";
  document.getElementById("world-number").textContent="STAGE "+stage.id;
  document.getElementById("world-name").textContent="";
  document.getElementById("scene-caption").textContent="";
  state.cameraX=-10;
  const pan=document.getElementById("camera-pan");pan.value=String(state.cameraX);
  const shortcuts=document.getElementById("device-shortcuts");shortcuts.replaceChildren();
  roomObjects(state).filter(o=>o.label&&o.kind!=="door"&&o.id!=="sign").forEach((object,i)=>{
    const button=document.createElement("button");button.type="button";
    button.textContent=String(i+1).padStart(2,"0")+" · "+object.label;
    button.addEventListener("click",()=>{
      if(state.videoActive)return;
      state.cameraX=Math.max(-14,Math.min(14,object.x));pan.value=String(state.cameraX);
      state.hoverObject=object.id;activate(object.id);
    });
    shortcuts.append(button);
  });
  renderPanel();
}
document.getElementById("camera-pan").addEventListener("input",event=>{
  if(!state.videoActive)state.cameraX=Number(event.target.value);
});
function showTransfer() {
  pauseGame(true);lever.value="0";
  document.getElementById("transition-title").textContent=progress.active==="03"?"03 / 완료":"STAGE "+STAGES[STAGES.findIndex(s=>s.id===progress.active)+1].id;
  transfer.showModal();lever.focus();
}
function playVideo() {
  const src=playableVideo(progress,progress.active);
  if(!src)return;
  playingStage=progress.active;pauseGame(true);
  video.src=src;videoDialog.showModal();
  video.play().catch(()=>{document.getElementById("panel-status").textContent="재생 버튼을 눌러주세요";});
}
videoButton.addEventListener("click",()=>{
  if(canTransfer(progress))showTransfer();else playVideo();
});
document.getElementById("stage-video-close").addEventListener("click",()=>videoDialog.close());
video.addEventListener("error",()=>{document.getElementById("panel-status").textContent="영상을 불러올 수 없습니다";});
video.addEventListener("ended",()=>{
  if(!video.ended||!playingStage||!finishVideo(progress,playingStage))return;
  saveProgress(progress);
  videoDialog.close();updateVideoButton();showTransfer();
});
videoDialog.addEventListener("close",()=>{
  video.pause();video.removeAttribute("src");video.load();playingStage=null;
  if(!transfer.open){pauseGame(false);videoButton.focus();}
});
lever.addEventListener("change",()=>{
  const value=Number(lever.value);
  if(value<98||!canTransfer(progress))return;
  if(progress.active==="03"){transfer.close();return;}
  if(advanceStage(progress,value)){transfer.close();enterStage();document.getElementById("world").focus();}
});
document.getElementById("transfer-close").addEventListener("click",()=>transfer.close());
transfer.addEventListener("close",()=>{pauseGame(false);videoButton.focus();});
enterStage(true);
