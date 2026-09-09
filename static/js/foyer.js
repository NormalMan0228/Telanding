import {setupCurtain} from "./stages/curtain.js";
const canvas=document.getElementById("foyer-field"),ctx=canvas.getContext("2d");
function render(){
 canvas.width=Math.min(1400,window.innerWidth);canvas.height=Math.min(1100,window.innerHeight);
 const w=canvas.width,h=canvas.height;
 ctx.fillStyle="#091211";ctx.fillRect(0,0,w,h);
 const glow=ctx.createRadialGradient(w*.5,h*.48,10,w*.5,h*.48,w*.65);
 glow.addColorStop(0,"#344b3c");glow.addColorStop(.45,"#182d24");glow.addColorStop(1,"#060c0c");ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
 // A recessed mechanical iris and suspended wires frame the title.
 for(let i=0;i<4;i++){
  ctx.strokeStyle=["#3f514241","#75816b20","#121f19","#55604c25"][i];ctx.lineWidth=i===2?14:2;
  ctx.beginPath();ctx.ellipse(w*.5,h*.48,w*(.33+i*.013),h*(.33+i*.017),-.07,0,Math.PI*2);ctx.stroke();
 }
 for(let i=0;i<12;i++){
  const a=i*Math.PI/6,x=w*.5+Math.cos(a)*w*.38,y=h*.48+Math.sin(a)*h*.4;
  ctx.fillStyle="#69735938";ctx.fillRect(x-2,y-3,4,6);
 }
 for(const side of [-1,1])for(let i=0;i<4;i++){
  const x=w*.5+side*w*(.33+i*.035);ctx.strokeStyle=i%2?"#59644836":"#020a09";ctx.lineWidth=i%2?2:8;
  ctx.beginPath();ctx.moveTo(x,-10);ctx.bezierCurveTo(x+side*20,h*.24,x-side*15,h*.6,x+side*45,h);ctx.stroke();
 }
}
render();window.addEventListener("resize",render);
document.body.append(document.getElementById("hospital-curtain"));
setupCurtain({canvas:document.getElementById("curtain-canvas"),overlay:document.getElementById("hospital-curtain"),content:document.getElementById("content"),skip:document.getElementById("curtain-skip"),onOpen:()=>document.querySelector(".foyer-enter").focus({preventScroll:true})});
