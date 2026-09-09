/** Coarse shaded mesh with depth folds, hanging mesh and a weighted scalloped hem. */
export function drawCurtain(ctx,width,height,progress){
 ctx.clearRect(0,0,width,height);
 const ease=progress*progress*(3-2*progress), top=height*.055;
 const poly=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fill();};
 for(const side of [-1,1]){
  const span=width*(.52-ease*.485),origin=side<0?-width*.008:width*1.008;
  const point=(u,v)=>{
   const phase=u*Math.PI*18;
   const depth=Math.cos(phase)*(.6+.4*v);
   const sway=Math.sin(v*Math.PI)*Math.sin(u*15+ease*3)*ease*width*.008;
   return [origin-side*(u*span+sway),top+v*(height*.91)+depth*(3+v*height*.026)+Math.sin(u*Math.PI)*height*.016];
  };
  // Cast shadows along the folds before the cloth is drawn.
  ctx.save();ctx.shadowColor="#000b";ctx.shadowBlur=14;ctx.shadowOffsetX=side*-7;
  poly([point(0,0),point(1,0),point(1,1),point(0,1)],"#16231f");ctx.restore();
  for(let y=0;y<18;y++)for(let x=0;x<90;x++){
   const u=x/90,v=y/18,phase=(u+.0055)*Math.PI*18;
   const normal=Math.sin(phase),depth=Math.cos(phase);
   const light=.36+.30*Math.max(0,normal*.8+depth*.45)+.08*depth;
   const band=v<.12?.69:1;
   const shade=light*band*(.94+.06*Math.cos(v*10+u*4));
   const color=`rgb(${Math.round(116*shade)},${Math.round(139*shade)},${Math.round(123*shade)})`;
   poly([point(u,v),point(u+1/90,v),point(u+1/90,v+1/18),point(u,v+1/18)],color);
  }
  for(let i=0;i<=9;i++){
   const a=point(i/9,0);ctx.strokeStyle="#848e7c";ctx.lineWidth=2;
   ctx.beginPath();ctx.ellipse(a[0],top*.75,2,top*.35,0,0,Math.PI*2);ctx.stroke();
  }
  for(const v of [.125,.975]){
   ctx.strokeStyle=v>.9?"#1b3029":"#748172";ctx.lineWidth=v>.9?3:1;ctx.beginPath();
   for(let i=0;i<=90;i++){const p=point(i/90,v);i?ctx.lineTo(...p):ctx.moveTo(...p);}ctx.stroke();
  }
 }
 ctx.fillStyle="#1d2924";ctx.fillRect(0,top*.3,width,5);
 ctx.fillStyle="#737e6a";ctx.fillRect(0,top*.3,width,1);
}
export function setupCurtain({ canvas, overlay, content, skip, onOpen = () => {} }) {
  const ctx=canvas.getContext("2d"), reduced=matchMedia("(prefers-reduced-motion: reduce)");
  let frame=0, start=null, finished=false, started=false, progress=0;
  const finish=()=>{
    if(finished)return;
    finished=true; cancelAnimationFrame(frame);
    overlay.hidden=true;content.inert=false;
    window.removeEventListener("resize", resize);
    onOpen();
  };
  const resize=()=>{
    canvas.width=Math.max(320,Math.min(540,Math.round(window.innerWidth/2)));
    canvas.height=Math.round(canvas.width*window.innerHeight/window.innerWidth);
    drawCurtain(ctx,canvas.width,canvas.height,progress);
  };
  content.inert=true; overlay.hidden=false; resize();
  skip.addEventListener("click",()=>{
    if(started)return; started=true;
    skip.hidden=true;
    if(reduced.matches){finish();return;}
    frame=requestAnimationFrame(tick);
  },{once:true});
  window.addEventListener("resize",resize);
  const tick=(now)=>{
    if(finished)return;
    start??=now;
    progress=Math.min(1,Math.max(0,(now-start)/2400));
    drawCurtain(ctx,canvas.width,canvas.height,progress);
    if(progress>=1)finish();else frame=requestAnimationFrame(tick);
  };
  return finish;
}
