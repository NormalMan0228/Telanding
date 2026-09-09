/** Stationary mechanical attendants, drawn from the same world projection as furniture. */
export function drawNPC(o,{ctx,project},state,time){
 if(o.kind!=="npc")return false;
 const p=project(o.x,0,o.z),u=p.unit;
 const breath=state.quiet?0:Math.sin(time*.65+state.world)*.016;
 const ellipse=(x,y,rx,ry,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(p.x+x*u,p.y-y*u,rx*u,ry*u,0,0,Math.PI*2);ctx.fill();};
 const line=(points,c,w)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(p.x+x*u,p.y-y*u):ctx.moveTo(p.x+x*u,p.y-y*u));ctx.stroke();};
 const colors=[["#6a8076","#a9ae94"],["#817673","#b1a598"],["#667c83","#afb7ac"]][state.world%3];
 ellipse(0,0,.47,.09,"#07100cd0");
 for(const side of [-1,1]){
  line([[side*.13,.7],[side*.18,.35],[side*.26,.07]],"#6d8174",3);
  line([[side*.22,1.15],[side*.37,.9],[side*.32,.58]],"#93a08c",2);
  ellipse(side*.26,.06,.11,.035,"#9caa93");
 }
 ellipse(0,.94,.24,.37,colors[0]);
 line([[0,1.15],[.03,1.48]],"#303e35",5);
 if(state.world===1){
  ellipse(0,1.64+breath,.34,.16,colors[1]);
  ellipse(0,1.65+breath,.25,.09,"#132923");
  line([[-.27,1.79],[.26,1.85]],"#8d9180",2);
 }else if(state.world===2){
  ellipse(0,1.6+breath,.18,.34,colors[1]);
  ellipse(-.08,1.62+breath,.06,.28,"#172e2f");
  line([[.16,1.42],[.4,1.59],[.17,1.84]],"#6f8a88",2);
 }else{
  ellipse(0,1.67+breath,.21,.29,colors[1]);
  ellipse(0,1.67+breath,.11,.2,"#172e2a");
  line([[0,1.82+breath],[0,1.52+breath]],"#bac3a6",1);
 }
 const look=Math.max(-.05,Math.min(.05,(state.player.x-o.x)*.004));
 ellipse(look,1.66+breath,.022,.022,"#b7c1a1");
 line([[-.09,1.03],[.1,1.03],[-.09,.96],[.1,.96],[-.09,.89]],"#33483f",1);
 return true;
}
