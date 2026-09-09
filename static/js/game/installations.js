/** Every visible installation has a footprint in config.js, used by collision and picking. */
export function drawInstallation(o, { ctx, project, box, drawFaces }, state, time) {
  if (!o.id.startsWith("wall-")) return false;
  const active = Boolean(state.apparatus?.[`${state.world}:${o.id}`]);
  const feedback=state.panelFeedback?.room===state.world?state.panelFeedback:null;
  const phase = o.kind==="shutter"&&feedback?.kind==="dials"
    ? feedback.values.reduce((sum,v,i)=>sum+v*(i+1),0)*.8
    : active && !state.quiet ? time : 0;
  const metal = ["#686b5c", "#293a36", "#46514a"];
  const front = o.z + o.d / 2 + 0.015;
  const plane = (x, y, w, h, color) => {
    const a = project(o.x + x, y, front), b = project(o.x + x + w, y - h, front);
    ctx.fillStyle = color; ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
  };
  const disc = (x, y, r, color, ratio = 1) => {
    const p = project(o.x + x, y, front), u = p.unit;
    ctx.fillStyle = color; ctx.beginPath();
    for (let i = 0; i < 20; i++) {
      const a = i * Math.PI / 10;
      const px = p.x + Math.cos(a) * r * u, py = p.y + Math.sin(a) * r * u * ratio;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  };
  box(o.x, 0, o.z, o.w, 0.3, o.d, metal);
  box(o.x, 0.3, o.z, o.w * 0.94, o.h - 0.3, o.d * 0.9, metal);
  drawFaces();
  plane(-o.w * 0.43, o.h - 0.15, o.w * 0.86, o.h - 0.65, "#142320");
  if (o.kind === "shutter") {
    const cy = o.h * 0.55, r = o.w * 0.44;
    disc(0, cy, r, "#88836a"); disc(0, cy, r * 0.91, "#34443b");
    disc(0, cy, r * 0.76, "#0c1717");
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3 + phase * 0.13;
      disc(Math.cos(a) * r * 0.43, cy + Math.sin(a) * r * 0.43, r * 0.39, i % 2 ? "#4d5a4b" : "#68705a");
    }
    disc(0, cy, r * (active ? 0.33 : 0.12), "#080f10");
    plane(-0.9, 0.8, 1.8, 0.1, active ? "#b6a27a" : "#495546");
  } else if (o.kind === "crt-stack") {
    for (let i = 0; i < 3; i++) {
      const y = 1.4 + i * 1.2, x = (i % 2 ? 0.12 : -0.12);
      plane(-o.w * 0.34 + x, y, o.w * 0.68, 0.96, "#7a7b67");
      plane(-o.w * 0.29 + x, y - 0.1, o.w * 0.58, 0.68, "#172e2e");
      if (active) {
        plane(-o.w * 0.24 + x, y - 0.29, o.w * 0.48, 0.02, "#91a99a");
        plane(x + Math.sin(phase * 0.7 + i) * 0.3, y - 0.14, 0.03, 0.56, "#b4b58e");
      }
      plane(o.w * 0.2 + x, y - 0.83, 0.08, 0.04, "#a89062");
    }
  } else if (o.kind === "duct") {
    for (let i = 0; i < 4; i++) {
      const x = -o.w * 0.36 + i * o.w * 0.24;
      plane(x, o.h - 0.1, 0.2, o.h - 0.65, "#677266");
      plane(x + 0.04, o.h - 0.1, 0.05, o.h - 0.65, "#a09b7e");
      for (const y of [1, 2.5, 3.8]) plane(x - 0.05, y, 0.3, 0.12, "#807554");
    }
    disc(0, 2.1, 0.58, "#3a3029"); disc(0, 2.1, 0.48, "#988465"); disc(0, 2.1, 0.32, "#263934");
    disc(Math.cos(phase) * 0.25, 2.1 + Math.sin(phase) * 0.25, 0.08, "#c3b591");
  } else if (o.kind === "reels" || o.kind === "lenses") {
    for (const x of [-o.w * 0.23, o.w * 0.23]) {
      for (const y of [1.6, 3.5]) {
        const r = o.w * 0.215;
        disc(x, y, r, "#8c8871"); disc(x, y, r * 0.87, "#3b4b49");
        if (o.kind === "reels") {
          for (let i = 0; i < 3; i++) {
            const a = phase * 0.7 + i * Math.PI * 2 / 3 + (feedback?.kind==="sequence"?feedback.values.length*.4:0);
            disc(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.23, "#111c20");
          }
          disc(x, y, r * 0.16, "#aea68d");
        } else {
          disc(x, y, r * 0.65, active ? "#607878" : "#25322f");
          disc(x + Math.sin(phase * 0.3) * 0.15, y, r * 0.23, "#101c22", 1.5);
        }
      }
    }
  } else if (o.kind === "vessels") {
    for (const [i, x] of [-o.w * 0.29, 0, o.w * 0.29].entries()) {
      plane(x - 0.34, o.h - 0.4, 0.68, 3.3, "#294047");
      plane(x - 0.31, o.h - 0.45, 0.055, 3.2, "#71898a");
      plane(x - 0.4, o.h - 0.25, 0.8, 0.2, "#9a947a");
      plane(x - 0.4, 1.1, 0.8, 0.2, "#777661");
      const y = 2.5 + Math.sin(phase * 0.4 + i) * 0.23;
      disc(x, y, 0.21, ["#827188", "#839486", "#9a896d"][i], 2.8);
      plane(x - 0.025, y + 0.38, 0.05, 0.75, "#152527");
    }
  }
  return true;
}
