import {drawEntry} from "./machine.js";
import {entryOpen,operate,panelSolved} from "./puzzle.js";
import {loadEntry,saveEntry} from "./checkpoint.js";
import {createAudio} from "../game/audio.js";
const canvas=document.getElementById("entry-machine"),ctx=canvas.getContext("2d");
const state=loadEntry(),links=[document.getElementById("entry-play"),document.getElementById("entry-games")];
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
let opened=0,goal=0,frame=0,previous=0;
canvas.width=720;canvas.height=600;
const audioWindow=document.getElementById("entry-audio");
const audio=createAudio({fixedTrack:"threshold",button:document.getElementById("sound"),say:message=>document.getElementById("entry-status").textContent=message});
audio.setTrack("threshold");
document.getElementById("sound").onclick=audio.toggleSound;
document.getElementById("audio-close").onclick=()=>{audioWindow.hidden=true;document.getElementById("entry-radio").focus();};
document.getElementById("entry-radio").onclick=()=>{audioWindow.hidden=false;document.getElementById("sound").focus();};
function tick(now){
 const dt=previous?Math.min(.05,(now-previous)/1000):0;previous=now;
 opened=reduced.matches?goal:opened+(goal-opened)*Math.min(1,dt*7);
 if(Math.abs(opened-goal)<.002)opened=goal;
 drawEntry(ctx,state.axes,opened,state);
 if(opened!==goal)frame=requestAnimationFrame(tick);else{frame=0;previous=0;}
}
function update(){
 saveEntry(state);
 goal=entryOpen(state)?1:0;
 links.forEach(link=>{link.setAttribute("aria-disabled",String(!goal));link.tabIndex=goal?0:-1;});
 document.querySelectorAll("[data-axis]").forEach((button,i)=>button.setAttribute("aria-label",(i+1)+"번째 회전축, 현재 "+state.axes[i]));
 document.querySelectorAll("[data-contact]").forEach((button,i)=>button.setAttribute("aria-pressed",String(Boolean(state.contacts[i]))));
 document.getElementById("entry-status").textContent=goal?"해치 열림. 왼쪽 플레이, 오른쪽 게임 정보.":"패널 완료 "+panelSolved(state).filter(Boolean).length+" / 3";
 if(!frame)frame=requestAnimationFrame(tick);
}
document.querySelectorAll("[data-axis]").forEach(button=>button.addEventListener("click",()=>{operate(state,"axis",Number(button.dataset.axis));update();}));
document.querySelectorAll("[data-contact]").forEach(button=>button.addEventListener("click",()=>{operate(state,"contact",Number(button.dataset.contact));update();}));
document.querySelectorAll("[data-slider]").forEach(slider=>slider.addEventListener("input",()=>{operate(state,"slider",Number(slider.dataset.slider),Number(slider.value));update();}));
links.forEach(link=>link.addEventListener("click",e=>{if(!entryOpen(state))e.preventDefault();}));
drawEntry(ctx,state.axes,opened,state);
document.querySelectorAll("[data-slider]").forEach(slider=>slider.value=String(state.sliders[Number(slider.dataset.slider)]));
update();
