export const ALIGNMENT = [1,3,2];
export function aligned(axes){return axes.length===3&&axes.every((v,i)=>v===ALIGNMENT[i]);}
export function drawEntry(ctx,axes,opened=0,state={power:true,contacts:[false,false,false],sliders:[0,100]}){
 ctx.clearRect(0,0,720,600);
 const ellipse=(x,y,rx,ry,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
 const poly=(ps,c)=>{ctx.fillStyle=c;ctx.beginPath();ps.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
 const line=(ps,c,w)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ps.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();};
 ellipse(360,555,230,23,"#020605");
 // Swept hoses connect an off-axis instrument head to the floor sockets.
 for(const [offset,c] of [[0,"#182b26"],[8,"#536358"]]){
  line([[185+offset,185],[119+offset,231],[133+offset,393],[94+offset,506],[211,526]],c,offset?4:17);
  line([[514+offset,214],[593+offset,177],[614+offset,349],[566+offset,510],[501,531]],c,offset?3:13);
 }
 poly([[205,150],[484,133],[551,201],[538,516],[489,549],[220,538],[176,483],[167,236]],"#283c34");
 poly([[205,150],[484,133],[516,175],[207,193],[167,236]],"#647062");
 poly([[516,175],[551,201],[538,516],[502,528]],"#172a24");
 poly([[207,193],[516,175],[502,528],[220,538],[195,488]],"#435449");
 poly([[221,209],[493,193],[482,493],[239,511]],"#293c33");
 // Suspended optical head: deep socket, milky lens and a fixed etched reference.
 line([[351,200],[329,124],[370,104]],"#85907a",9);
 ellipse(376,122,89,63,"#101e1b");ellipse(370,115,88,61,"#717b65");
 ellipse(368,116,74,49,"#364c40");ellipse(365,116,60,38,"#0c1917");
 for(let i=0;i<3;i++){
  const x=328+i*37,y=115,a=ALIGNMENT[i]*Math.PI/2-Math.PI/2;
  ellipse(x,y,12,12,"#586950");ellipse(x,y,9,9,"#142820");
  line([[x,y],[x+Math.cos(a)*8,y+Math.sin(a)*8]],"#a5b592",2);
 }
 for(let i=0;i<3;i++){
  const x=264+i*96,y=i===1?321:297,a=axes[i]*Math.PI/2-Math.PI/2;
  line([[x,240],[x, y-44]],"#9a9778",3);
  ellipse(x+3,y+5,40,43,"#101d19");ellipse(x,y,38,40,"#78816a");ellipse(x,y,29,32,"#344d3e");
  ellipse(x-4,y-5,22,25,"#526b55");ellipse(x,y,9,10,"#222f27");
  line([[x,y],[x+Math.cos(a)*25,y+Math.sin(a)*25]],"#c0bea0",5);
  for(let j=0;j<4;j++){const b=j*Math.PI/2;ellipse(x+Math.cos(b)*34,y+Math.sin(b)*36,2,2,"#c1ba92");}
  ellipse(x,365,3,3,axes[i]===ALIGNMENT[i]?"#b0c396":"#1a2a20");
  const target=ALIGNMENT[i]*Math.PI/2-Math.PI/2;
  line([[x,y-57],[x+Math.cos(target)*12,y-57+Math.sin(target)*12]],"#aab99b",3);
 }
 ctx.font="12px monospace";ctx.textAlign="center";ctx.fillStyle="#9ca98b";
 ctx.fillText("I    II    III",360,224);
 // Physical side sockets: power coupler and radio grille.
 ellipse(566,258,22,30,"#1a2b24");ellipse(561,253,19,26,"#6c7961");
 line([[550,253],[574,253]],state.power?"#d0c792":"#172a20",6);
 ctx.fillStyle="#3b5040";ctx.fillRect(116,302,35,60);
 for(let i=0;i<7;i++)line([[122,309+i*6],[145,309+i*6]],"#111f19",2);
 ellipse(132,351,4,4,"#b8ac79");
 if(!state.power){ellipse(365,116,61,39,"#0c1917");ctx.fillStyle="#71816a";ctx.fillRect(354,114,20,2);}
 // Independent side panels make each goal visible beside its physical control.
 poly([[49,369],[184,359],[190,522],[57,531]],"#4b5f52");
 poly([[59,383],[174,374],[179,511],[66,520]],"#1b3027");
 for(let i=0;i<3;i++){
  const y=405+i*43,connected=Boolean(state.contacts[i]);
  line([[69,y],[105,y]],connected?"#b5c69b":"#697b5f",4);
  line([[137,y],[168,y]],connected?"#b5c69b":"#697b5f",4);
  ellipse(121,y,19,18,"#65765e");ellipse(121,y,15,14,"#233e2e");
  line(connected?[[105,y],[137,y]]:[[121,y-14],[121,y+14]],connected?"#c5ccaa":"#a59877",4);
 }
 poly([[558,344],[682,357],[675,493],[550,480]],"#667361");
 ctx.fillStyle="#172c27";ctx.fillRect(563,372,105,96);
 for(let i=0;i<2;i++){
  const y=405+i*45,target=[30,70][i],value=state.sliders?.[i]??0;
  line([[573,y],[655,y]],"#899579",4);
  const tx=573+target*.82;
  ctx.fillStyle="#b4c598";ctx.fillRect(tx-4,y-13,8,26);
  ctx.fillStyle="#172c27";ctx.fillRect(tx-2,y-10,4,20);
  const x=573+value*.82;
  ctx.fillStyle="#8b9580";ctx.fillRect(x-6,y-7,12,14);
  ctx.fillStyle="#d1c9a1";ctx.fillRect(x-1,y-5,2,10);
 }
 const solved=[aligned(axes),state.contacts.length===3&&state.contacts.every(Boolean),Math.abs((state.sliders?.[0]??0)-30)<=5&&Math.abs((state.sliders?.[1]??100)-70)<=5];
 solved.forEach((on,i)=>{ellipse(330+i*30,365,7,7,"#17251e");ellipse(330+i*30,365,4,4,on?"#c2d7a4":"#47513a");});
 for(const [i,x] of [225,398].entries()){
  poly([[x-9,391],[x+103,387],[x+108,494],[x-5,500]],"#727965");
  ctx.fillStyle="#091511";ctx.fillRect(x,400,94,87);
  const glow=opened>0?"#bac5a3":"#4d614d";
  if(i===0)poly([[x+33,421],[x+65,444],[x+33,466]],glow);
  else {ctx.fillStyle=glow;ctx.fillRect(x+29,422,39,43);ctx.fillStyle="#17291f";ctx.fillRect(x+35,425,23,12);ctx.fillRect(x+36,449,25,16);}
  // Retracting shutters reveal the two physical routes only after alignment.
  const cover=43*(1-opened);
  ctx.fillStyle="#33493b";ctx.fillRect(x,400,94,cover);ctx.fillRect(x,487-cover,94,cover);
  line([[x,400+cover],[x+94,400+cover]],"#87917a",2);
 }
 for(const [x,y] of [[209,217],[492,211],[216,473],[493,484]]){ellipse(x,y,4,4,"#829077");line([[x-2,y],[x+2,y]],"#20372a",1);}
 for(let i=0;i<7;i++)line([[254+i*9,522],[257+i*9,532]],"#14281e",3);
}
