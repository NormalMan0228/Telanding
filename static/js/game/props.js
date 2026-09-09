export function drawProp(o, {ctx,project,box,drawFaces}, state) {
  if(!["cart","screen","stool","crate"].includes(o.kind))return false;
  const metal=["#697369","#34453f","#4d5c50"];
  const wood=["#736e57","#403d32","#56533f"];
  if(o.kind==="screen") {
    for(const side of [-1,1]) {
      box(o.x+side*o.w*.44,0,o.z,.06,o.h,.06,metal);
      box(o.x+side*o.w*.44,0,o.z,.3,.05,o.d,metal);
    }
    box(o.x,.5,o.z,o.w,.06,.08,metal);
    for(let i=0;i<7;i++)box(o.x-o.w*.43+i*o.w/7,.55+(i%3)*.035,o.z+(i%2)*.04,o.w/7,o.h-.75,.035,["#465952","#3c5049","#50645a"]);
  } else if(o.kind==="cart") {
    for(const side of [-1,1])for(const z of [-1,1])box(o.x+side*o.w*.4,.08,o.z+z*o.d*.4,.05,o.h,.05,metal);
    for(const y of [.25,o.h*.85])box(o.x,y,o.z,o.w,.08,o.d,metal);
    box(o.x-.2,o.h*.85+.08,o.z,.4,.4,.3,wood);
    box(o.x+.3,o.h*.85+.08,o.z+.08,.24,.16,.35,metal);
  } else if(o.kind==="stool") {
    for(const side of [-1,1])box(o.x+side*.22,0,o.z,.06,o.h,.08,metal);
    box(o.x,o.h-.12,o.z,o.w,.12,o.d,wood);
  } else {
    box(o.x,0,o.z,o.w,o.h,o.d,wood);
    box(o.x,o.h,o.z,o.w*.85,.08,o.d*.95,metal);
    box(o.x+.08,o.h+.08,o.z-.03,o.w*.7,.24,o.d*.7,wood);
  }
  ctx.save();
  if(o.kind==="screen"&&state.player.z<o.z&&Math.abs(state.player.x-o.x)<o.w/2+.4)ctx.globalAlpha=.38;
  drawFaces();
  ctx.restore();
  // Contact details stay attached to the shared projection, not separately rounded.
  const p=project(o.x,0,o.z);
  if(o.kind==="cart")for(const side of [-1,1]) {
    ctx.fillStyle="#111c1a";ctx.beginPath();ctx.ellipse(p.x+side*o.w*p.unit*.4,p.y,3,4,0,0,Math.PI*2);ctx.fill();
  }
  return true;
}
