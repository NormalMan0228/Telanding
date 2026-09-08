import { rooms } from "./config.js";
/** Unexplained hospital-computer hybrids. Built from native geometry and shared material primitives. */
export function drawMachine(o, tools, state, time) {
  const { ctx, project, box, drawFaces } = tools,
    p = project(o.x, 0, o.z),
    unit = project(o.x + 1, 0, o.z).x - p.x;
  const rect = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(
      Math.round(p.x + x * unit),
      Math.round(p.y - y * unit),
      Math.round(w * unit),
      Math.round(h * unit),
    );
  };
  const ellipse = (x, y, rx, ry, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(
      p.x + x * unit,
      p.y - y * unit,
      rx * unit,
      ry * unit,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  };
  const line = (points, color, width = 1) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    points.forEach(([x, y], i) =>
      i
        ? ctx.lineTo(p.x + x * unit, p.y - y * unit)
        : ctx.moveTo(p.x + x * unit, p.y - y * unit),
    );
    ctx.stroke();
  };
  const pulse = state.quiet
    ? 0
    : Math.sin(time * 1.2) * (state.pressure ?? 0) * 0.025;
  const base = ["#71867a", "#344d45", "#425e51"];
  const glow = (x, y, r, color) => {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ellipse(x, y, r, r, color);
    ctx.restore();
  };
  if (o.kind === "door") {
    const x = o.x + o.visualOffset,
      z = o.z;
    const frame = ["#92937a", "#495c4c", "#647263"];
    box(x, 0, z, 1.45, 0.09, 0.65, frame);
    for (const side of [-1, 1]) {
      box(x + side * 0.64, 0, z, 0.2, 2.5, 0.5, frame);
      box(x + side * 0.64, 0.23, z + 0.27, 0.08, 1.9, 0.04, [
        "#2c4c42",
        "#35483b",
        "#596c50",
      ]);
    }
    box(x, 2.4, z, 1.45, 0.23, 0.55, frame);
    drawFaces();
    const near = Math.hypot(state.player.x - o.x, state.player.z - o.z) < 2.6;
    const a = project(x - 0.48, 2.33, z + 0.28),
      b = project(x + 0.48, 0.1, z + 0.28);
    const shade = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    shade.addColorStop(0, "#06100ff2");
    shade.addColorStop(1, "#0a171ac0");
    ctx.fillStyle = shade;
    ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    const seam = project(x, 2.3, z + 0.3);
    ctx.strokeStyle = near ? "#b8c992" : "#456455";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(seam.x, seam.y);
    ctx.lineTo(seam.x, b.y);
    ctx.stroke();
    for (const side of [-1, 1]) {
      const light = project(x + side * 0.65, 2.2, z + 0.31);
      ctx.fillStyle = near ? "#c7d79b" : "#8b9270";
      ctx.fillRect(light.x - 1, light.y, 2, 8);
    }
    const sign = project(x, 2.47, z + 0.31);
    const destination =
      ((state.world + (o.id === "exit-left" ? -1 : 1) + rooms.length) %
        rooms.length) +
      1;
    ctx.fillStyle = "#243c32";
    ctx.fillRect(sign.x - 17, sign.y - 6, 34, 9);
    ctx.fillStyle = "#c1cba3";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      o.id === "exit-left" ? `< 0${destination}` : `0${destination} >`,
      sign.x,
      sign.y + 1,
    );
    return true;
  }
  if (o.kind === "mail-tube") {
    box(o.x, 0, o.z, 1.2, 0.25, 0.8, base);
    box(o.x, 0.25, o.z, 0.8, 0.72, 0.6, ["#8a8366", "#525b4c", "#666c53"]);
    drawFaces();
    rect(-0.33, 2.97, 0.66, 2.05, "#243d36");
    rect(-0.23, 2.93, 0.46, 1.98, "#5b8b7e55");
    rect(-0.27, 2.93, 0.035, 1.95, "#b1c2a077");
    for (const h of [1, 2.2, 3]) {
      rect(-0.42, h, 0.84, 0.11, "#8f9575");
      rect(-0.42, h - 0.09, 0.84, 0.06, "#455b4b");
    }
    const progress = state.pipeProgress ?? (state.letterSent ? 1 : 0);
    const h = 1.2 + progress * 1.53;
    rect(-0.2, h, 0.4, 0.33, "#a8aa89");
    rect(-0.22, h + 0.03, 0.44, 0.055, "#5b6e58");
    rect(-0.22, h - 0.3, 0.44, 0.045, "#5b6e58");
    line(
      [
        [-0.15, h - 0.06],
        [0, h - 0.17],
        [0.15, h - 0.06],
      ],
      "#54634d",
    );
    glow(0.23, 0.68, 0.045, state.letterSent ? "#accca1" : "#ad9366");
    line(
      [
        [0.43, 2.9],
        [0.65, 3.13],
        [0.8, 3.13],
      ],
      "#78876d",
      3,
    );
    return true;
  }
  if (o.kind === "postmaster") {
    box(o.x, 0, o.z, 2.4, 0.24, 1.1, base);
    box(o.x, 0.24, o.z, 1.7, 0.75, 0.85, ["#7d8168", "#374f44", "#526759"]);
    drawFaces();
    const tilt = state.quiet ? 0 : Math.sin(time * 0.8) * 0.035;
    line(
      [
        [-0.35, 0.98],
        [-0.55, 1.47],
        [0.12, 1.83],
        [tilt, 2.25],
      ],
      "#263d36",
      8,
    );
    line(
      [
        [-0.35, 0.98],
        [-0.55, 1.47],
        [0.12, 1.83],
        [tilt, 2.25],
      ],
      "#a0a184",
      3,
    );
    for (const [x, y] of [
      [-0.55, 1.47],
      [0.12, 1.83],
    ]) {
      ellipse(x, y, 0.11, 0.11, "#7d8d73");
      ellipse(x, y, 0.04, 0.04, "#354d40");
    }
    rect(-0.67 + tilt, 3.07, 1.35, 0.9, "#9a9b7b");
    rect(-0.6 + tilt, 3.02, 1.2, 0.75, "#6b7f6d");
    rect(-0.5 + tilt, 2.94, 0.98, 0.53, "#173a39");
    const blink = !state.quiet && Math.sin(time * 0.53) > 0.997;
    for (const x of [-0.25, 0.2])
      rect(x + tilt, 2.77, 0.06, blink ? 0.025 : 0.16, "#aaceb1");
    line(
      [
        [-0.1 + tilt, 2.53],
        [0.03 + tilt, 2.49],
        [0.15 + tilt, 2.53],
      ],
      "#aaceb1",
    );
    rect(0.45 + tilt, 2.37, 0.08, 0.055, "#c7b276");
    line(
      [
        [-0.85, 0.95],
        [-1.06, 1.36],
        [-0.84, 1.67],
      ],
      "#8f9f80",
      3,
    );
    line(
      [
        [0.85, 0.95],
        [1.1, 1.26],
        [1.24, 1.36],
      ],
      "#8f9f80",
      3,
    );
    ellipse(1.24, 1.36, 0.1, 0.08, "#c0b899");
    rect(-0.55, 0.82, 1.1, 0.1, "#1a322c");
    rect(-0.4, 0.71, 0.8, 0.26, "#aea888");
    for (let i = 0; i < 3; i++)
      rect(-0.3, 0.65 - i * 0.06, i === 2 ? 0.35 : 0.6, 0.02, "#616e53");
    glow(0.66, 0.4, 0.035, state.letterSent ? "#c6d896" : "#918a60");
    return true;
  }
  if (o.kind === "sleep-terminal") {
    for (const x of [-0.58, 0.58])
      for (const z of [-0.8, 0.8])
        box(o.x + x, 0, o.z + z, 0.08, 0.6, 0.08, base);
    box(o.x, 0.48, o.z, 1.4, 0.2, 1.9, base);
    box(o.x, 0.68, o.z + 0.25, 1.22, 0.12, 1.25, [
      "#65796b",
      "#394e45",
      "#4c6756",
    ]);
    box(o.x, 1.02, o.z - 0.65, 1.08, 0.8, 0.5, [
      "#c0b799",
      "#807f69",
      "#656955",
    ]);
    drawFaces();
    const screen = project(o.x, 1.18, o.z - 0.38),
      w = unit * 0.78,
      h = unit * 0.49;
    ctx.fillStyle = "#14282b";
    ctx.fillRect(screen.x - w / 2, screen.y - h, w, h);
    ctx.fillStyle = state.monitorAwake ? "#80c9ac" : "#526e61";
    if (state.monitorAwake) {
      ctx.fillRect(screen.x - w / 2 + 3, screen.y - 4, w - 6, 1);
      const tinyX =
        screen.x +
        Math.max(-w * 0.3, Math.min(w * 0.3, (state.player.x - o.x) * 2));
      ctx.fillRect(tinyX - 2, screen.y - 15, 5, 4);
      ctx.fillRect(tinyX - 1, screen.y - 10, 3, 5);
      ctx.fillStyle = "#dbd1a3";
      ctx.fillRect(tinyX - 1, screen.y - 14, 1, 1);
    } else {
      ctx.fillRect(screen.x - 5, screen.y - h / 2, 10, 1);
    }
    line(
      [
        [0.6, 1.6],
        [0.87, 1.45],
        [0.87, 0.78],
        [0.52, 0.62],
      ],
      "#938769",
      2,
    );
    rect(-0.42, 0.48, 0.84, 0.15, "#b6b092");
    return true;
  }
  if (o.kind === "organ") {
    box(o.x, 0.05, o.z, 2.4, 0.3, 1.2, base);
    box(o.x, 0.35, o.z, 1.7, 1.1, 0.7, ["#74847b", "#345950", "#4b7563"]);
    drawFaces();
    rect(-0.65, 1.22, 1.3, 0.58, "#0d282c");
    line(
      [
        [-0.55, 0.94],
        [-0.34, 0.94],
        [-0.2, 1.05],
        [-0.08, 0.79],
        [0.02, 1.14],
        [0.12, 0.94],
        [0.55, 0.94],
      ],
      "#9ad5b5",
      1.2,
    );
    for (const [i, x] of [-0.74, 0, 0.74].entries()) {
      rect(x - 0.21, 3.05, 0.42, 1.55, "#526f6b");
      rect(x - 0.17, 3, 0.34, 1.5, "#183e43");
      rect(x - 0.14, 2.94, 0.045, 1.34, "#789e8e");
      const center = 2.25 + Math.sin(state.quiet ? i : time + i) * 0.06;
      ellipse(
        x,
        center,
        0.11 + Math.abs(pulse),
        0.2 + Math.abs(pulse),
        ["#a992a3", "#89b49f", "#a5b67d"][i],
      );
      rect(x - 0.26, 3.1, 0.52, 0.12, "#9dab8b");
      rect(x - 0.26, 1.61, 0.52, 0.12, "#617a62");
      line(
        [
          [x, 1.5],
          [x, 1.4],
          [x * 0.5, 1.4],
          [x * 0.5, 1.22],
        ],
        "#ab9470",
        3,
      );
    }
    rect(-0.9, 0.58, 0.18, 0.1, "#b09a65");
    rect(0.7, 0.58, 0.18, 0.1, "#718871");
    for (let i = 0; i < (state.pressure ?? 0); i++)
      glow(-0.22 + i * 0.2, 0.48, 0.035, "#c1db8e");
    return true;
  }
  if (o.kind === "observer") {
    const brass = "#a4966d",
      darkBrass = "#625e43",
      steel = "#526f61";
    box(o.x, 0, o.z, 1.9, 0.18, 1.1, ["#536556", "#263e33", "#354c3d"]);
    box(o.x, 0.18, o.z, 1.65, 0.3, 0.88, ["#74806a", "#365144", "#526b53"]);
    box(o.x, 0.48, o.z, 0.48, 0.84, 0.5, ["#8a8970", "#364c40", "#4f6955"]);
    drawFaces();
    // Heavy braces, exposed hoses and vented chassis keep the silhouette mechanical.
    for (const sign of [-1, 1]) {
      line(
        [
          [sign * 0.2, 1.5],
          [sign * 0.38, 1.08],
          [sign * 0.31, 0.68],
          [sign * 0.48, 0.48],
        ],
        "#172c27",
        6,
      );
      line(
        [
          [sign * 0.56, 1.45],
          [sign * 0.82, 0.96],
          [sign * 0.58, 0.49],
        ],
        darkBrass,
        6,
      );
      line(
        [
          [sign * 0.56, 1.45],
          [sign * 0.82, 0.96],
          [sign * 0.58, 0.49],
        ],
        steel,
        3,
      );
      ellipse(sign * 0.81, 0.97, 0.085, 0.085, brass);
      ellipse(sign * 0.81, 0.97, 0.035, 0.035, "#253e30");
      rect(sign * 0.58 - 0.13, 0.52, 0.26, 0.17, "#6d765a");
    }
    rect(-0.36, 0.38, 0.72, 0.18, "#1b3026");
    for (let i = 0; i < 3; i++)
      line(
        [
          [-0.28, 0.34 - i * 0.05],
          [0.28, 0.34 - i * 0.05],
        ],
        "#708064",
        1,
      );
    for (const y of [0.7, 0.82, 0.94]) rect(-0.13, y, 0.26, 0.035, "#20362b");
    rect(-0.31, 0.61, 0.62, 0.09, brass);
    // Concentric beveled metal rings around an empty optical cavity.
    ellipse(0.015, 2.12, 1.02, 0.94, "#213b34");
    ellipse(-0.025, 2.17, 0.99, 0.91, "#65806d");
    ellipse(0, 2.14, 0.94, 0.86, "#3a6153");
    ellipse(0, 2.15, 0.86, 0.78, darkBrass);
    ellipse(-0.015, 2.17, 0.82, 0.75, "#b4ab82");
    ellipse(0, 2.13, 0.73, 0.65, "#25382d");
    ellipse(0, 2.14, 0.68, 0.61, "#081917");
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4,
        x = Math.cos(angle) * 0.865,
        y = 2.14 + Math.sin(angle) * 0.78;
      ellipse(x, y, 0.052, 0.052, brass);
      line(
        [
          [x - 0.018, y - 0.026],
          [x + 0.018, y + 0.026],
        ],
        "#283a2b",
        1,
      );
    }
    for (const sign of [-1, 1]) {
      rect(sign * 0.965 - 0.035, 2.42, 0.07, 0.47, "#263c31");
      for (let i = 0; i < 3; i++)
        rect(sign * 0.965 - 0.028, 2.36 - i * 0.11, 0.056, 0.035, "#809078");
      line(
        [
          [sign * 0.53, 2.94],
          [sign * 0.6, 3.15],
        ],
        darkBrass,
        4,
      );
      ellipse(sign * 0.6, 3.16, 0.08, 0.08, "#b0a577");
    }
    const open = state.quiet
      ? state.eyeAwake
        ? 1
        : 0
      : (state.eyeOpen ?? (state.eyeAwake ? 1 : 0));
    const blink = !state.quiet && Math.sin(time * 0.47) > 0.997;
    if (open > 0.02 && !blink) {
      const look = Math.max(
        -0.2,
        Math.min(0.2, (state.player.x - o.x) * 0.018),
      );
      ellipse(look, 2.14, 0.29, 0.43 * open, "#bac7a5");
      ellipse(look + 0.035, 2.14, 0.12, 0.28 * open, "#355f51");
      if (open > 0.6) glow(look + 0.06, 2.3, 0.045, "#d2e2b5");
    } else
      line(
        [
          [-0.53, 2.15],
          [-0.26, 2.1],
          [0.26, 2.1],
          [0.53, 2.15],
        ],
        "#7b927e",
        2,
      );
    return true;
  }
  if (o.kind === "chair") {
    box(o.x, 0, o.z, 1.8, 0.2, 1.3, base);
    box(o.x, 0.2, o.z, 0.6, 0.5, 0.6, base);
    box(o.x, state.chairOccupied ? 0.63 : 0.7, o.z, 1.4, 0.18, 1, base);
    drawFaces();
    rect(-0.5, 2.3, 1, 1.4, "#395951");
    rect(-0.38, 2.2, 0.76, 1.12, "#6a8570");
    line(
      [
        [-0.8, 0.8],
        [-0.8, 1.3],
        [-0.5, 1.3],
      ],
      "#adb294",
      3,
    );
    line(
      [
        [0.8, 0.8],
        [0.8, 1.3],
        [0.5, 1.3],
      ],
      "#adb294",
      3,
    );
    rect(-0.25, 1.95, 0.5, 0.06, "#a99a7e");
    rect(-0.42, 1.25, 0.84, 0.08, "#a99a7e");
    line(
      [
        [0.48, 2.24],
        [0.82, 2.9],
        [1.12, 2.9],
        [1.12, 2.6],
      ],
      "#758d7c",
      2,
    );
    rect(0.72, 3.04, 0.8, 0.65, "#a5ae92");
    rect(0.81, 2.93, 0.6, 0.4, "#173039");
    const phases = ["- -", "0 0", "? ?", "..."];
    ctx.fillStyle = "#acd4b9";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      state.chairOccupied ? "72" : phases[state.pressure ?? 0],
      p.x + 1.1 * unit,
      p.y - 2.68 * unit,
    );
    if (state.chairOccupied) {
      const beat = state.quiet ? 1 : 0.7 + Math.sin(time * 7.54) * 0.3;
      glow(0.86, 2.65, 0.035 + beat * 0.015, "#dfb677");
    }
    ellipse(0, 1.55, 0.14, 0.2, "#283f36");
    return true;
  }
  if (o.kind === "dream-spool") {
    box(o.x, 0, o.z, 2.3, 0.28, 1.2, base);
    box(o.x, 0.28, o.z, 1.9, 1.4, 0.8, ["#727f8a", "#354b5a", "#4f6674"]);
    drawFaces();
    rect(-0.8, 1.55, 1.6, 1.05, "#253a4c");
    for (const x of [-0.45, 0.45]) {
      ellipse(x, 1.02, 0.35, 0.35, "#9ca9a1");
      ellipse(x, 1.02, 0.12, 0.12, "#334f57");
      const turn = state.quiet ? 0 : time * 0.3 * (1 + (state.pressure ?? 0));
      for (let i = 0; i < 3; i++) {
        const a = turn + (i * Math.PI * 2) / 3;
        line(
          [
            [x, 1.02],
            [x + Math.cos(a) * 0.27, 1.02 + Math.sin(a) * 0.27],
          ],
          "#536e73",
          2,
        );
      }
    }
    line(
      [
        [-0.1, 0.9],
        [0.1, 0.9],
      ],
      "#c3b98a",
      3,
    );
    rect(-0.45, 0.48, 0.9, 0.14, "#101d25");
    const paper = 0.4 + (state.pressure ?? 0) * 0.07;
    rect(-0.32, 0.38, 0.64, paper, "#a4b6a7");
    for (let i = 0; i < 3; i++)
      line(
        [
          [-0.2, 0.24 - i * 0.08],
          [0.2, 0.24 - i * 0.08],
        ],
        "#4d726a",
        1,
      );
    line(
      [
        [-0.8, 1.7],
        [-0.8, 2.8],
        [0.1, 2.8],
        [0.1, 2.2],
      ],
      "#879d92",
      2,
    );
    ellipse(0.1, 2.2, 0.17, 0.26, "#b4bb9f");
    return true;
  }
  return false;
}
