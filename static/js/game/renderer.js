import { drawInstallation } from "./installations.js";
import { drawProp } from "./props.js";
import { drawNPC } from "./npcs.js";
import { drawMachine } from "./machines.js";
import { worldUnit } from "./viewport.js";
import { proximity } from "./navigation.js";
import { drawCharacter } from "./character.js";
import { createMaterials, drawTexturedFace } from "./materials.js";
import { MAP, rooms, roomObjects } from "./config.js";
export function createRenderer(canvas, state) {
  let ctx = canvas.getContext("2d");
  const glowLayer = document.createElement("canvas");
  const glowContext = glowLayer.getContext("2d");
  const materials = createMaterials();
  let surfaceKind = "metal";
  ctx.imageSmoothingEnabled = false;
  function project(x, y, z) {
    const unit = worldUnit(canvas.width);
    const viewHalf = canvas.width / (2 * unit);
    const camera = Math.max(
      -MAP.halfWidth + viewHalf,
      Math.min(MAP.halfWidth - viewHalf, state.cameraX ?? state.player.x),
    );
    return {
      x: canvas.width / 2 + (x - camera) * unit,
      y: canvas.height * 0.68 + z * 22 - y * unit,
      d: z,
      scale: 1,
      unit,
      depthScale: 22 / unit,
    };
  }

  function unproject(x, y) {
    const origin = project(0, 0, 0),
      unit = worldUnit(canvas.width);
    return { x: (x - origin.x) / unit, z: (y - origin.y) / 22 };
  }
  let faces = [];
  function poly(points, color) {
    const ps = points.map((p) => project(...p));
    faces.push({
      p: ps,
      color,
      texture: surfaceKind,
      d: ps.reduce((a, p) => a + p.d, 0) / ps.length,
    });
  }
  function box(x, y, z, w, h, d, colors) {
    const a = x - w / 2,
      b = x + w / 2,
      c = z - d / 2,
      e = z + d / 2,
      t = y + h;
    poly(
      [
        [a, y, c],
        [b, y, c],
        [b, t, c],
        [a, t, c],
      ],
      colors[1],
    );
    poly(
      [
        [b, y, c],
        [b, y, e],
        [b, t, e],
        [b, t, c],
      ],
      colors[2],
    );
    poly(
      [
        [b, y, e],
        [a, y, e],
        [a, t, e],
        [b, t, e],
      ],
      colors[1],
    );
    poly(
      [
        [a, y, e],
        [a, y, c],
        [a, t, c],
        [a, t, e],
      ],
      colors[2],
    );
    poly(
      [
        [a, t, c],
        [b, t, c],
        [b, t, e],
        [a, t, e],
      ],
      colors[0],
    );
  }
  function drawFaces() {
    faces.sort((a, b) => a.d - b.d);
    for (const face of faces) {
      ctx.fillStyle = face.color;
      ctx.beginPath();
      face.p.forEach((p, i) =>
        i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y),
      );
      ctx.closePath();
      ctx.fill();
      const area = Math.abs(
        (face.p[1].x - face.p[0].x) * (face.p[2].y - face.p[0].y) -
          (face.p[1].y - face.p[0].y) * (face.p[2].x - face.p[0].x),
      );
      if (area > 80)
        drawTexturedFace(
          ctx,
          face.p,
          materials.texture(face.color, face.texture),
        );
    }
    faces = [];
  }
  function drawBed(x, z) {
    const metal = ["#69736a", "#344138", "#47544a"];
    for (const dx of [-0.48, 0.48])
      for (const dz of [-0.85, 0.85])
        box(x + dx, 0, z + dz, 0.07, 0.75, 0.07, metal);
    box(x, 0.42, z, 1.05, 0.16, 1.85, ["#626f62", "#36493e", "#4a5848"]);
    box(x, 0.58, z + 0.25, 1, 0.12, 1.15, ["#4f6359", "#37473f", "#45564a"]);
    box(x, 0.6, z - 0.6, 0.8, 0.15, 0.4, ["#8b8c77", "#575f51", "#73775e"]);
    box(x, 0.75, z - 0.85, 1.1, 0.08, 0.06, metal);
  }
  function drawIV(x, z) {
    const steel = ["#7c8379", "#4b594f", "#5c6a5f"];
    box(x, 0, z, 0.6, 0.06, 0.5, steel);
    box(x, 0, z, 0.055, 2, 0.055, steel);
    box(x, 1.95, z, 0.6, 0.055, 0.055, steel);
    box(x + 0.23, 1.35, z, 0.22, 0.48, 0.12, ["#7f8c78", "#515e50", "#697b62"]);
    drawFaces();
    const top = project(x + 0.25, 1.38, z + 0.08),
      end = project(x + 0.12, 0.35, z + 0.15);
    ctx.strokeStyle = "#849b7f";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.bezierCurveTo(
      top.x + 8,
      top.y + 10,
      end.x - 6,
      end.y - 8,
      end.x,
      end.y,
    );
    ctx.stroke();
    const fluid = project(x + 0.23, 1.57, z + 0.08);
    ctx.fillStyle = state.lampMode ? "#aa819f" : "#99ab78";
    ctx.fillRect(fluid.x - 2, fluid.y, 4, 7);
  }
  function drawCabinet(x, z) {
    box(x, 0, z, 0.8, 1.9, 0.55, ["#687062", "#3a453c", "#4d5849"]);
    box(x, 1.1, z + 0.29, 0.6, 0.025, 0.035, ["#202a22", "#202a22", "#202a22"]);
    box(x + 0.2, 0.8, z + 0.3, 0.06, 0.2, 0.06, [
      "#8c9279",
      "#757c66",
      "#757c66",
    ]);
    drawFaces();
    const face = project(x, 1.66, z + 0.32),
      width = worldUnit(canvas.width);
    ctx.fillStyle = "#79816a";
    ctx.fillRect(face.x - width * 0.21, face.y, width * 0.3, 4);
    ctx.fillStyle = "#1c3025";
    ctx.fillRect(face.x - width * 0.17, face.y + 1, width * 0.2, 1);
    for (let i = 0; i < 4; i++) {
      const vent = project(x, 1.45 - i * 0.075, z + 0.32);
      ctx.fillStyle = "#20352a";
      ctx.fillRect(vent.x - width * 0.23, vent.y, width * 0.46, 1);
    }
    const light = project(x + 0.22, 0.16, z + 0.32);
    ctx.fillStyle = "#a99461";
    ctx.fillRect(light.x, light.y, 2, 2);
  }

  function model(o) {
    const { x, z } = o;
    if (o.id === "computer") {
      box(x, 0, z, 1.7, 0.75, 0.9, ["#51534a", "#292f2c", "#3b443b"]);
      box(x, 0.75, z, 0.95, 0.8, 0.55, ["#9b9a80", "#777c66", "#4b5b4a"]);
      box(x, 0.91, z + 0.29, 0.68, 0.48, 0.025, [
        "#95b784",
        "#79a16c",
        "#365c43",
      ]);
      box(x, 0.77, z + 0.48, 0.7, 0.05, 0.3, ["#686e5e", "#323a32", "#50594a"]);
      drawFaces();
      ctx.save();
      const screen = project(x - 0.26, 1.24, z + 0.32),
        width = worldUnit(canvas.width);
      ctx.fillStyle = "#2b553c";
      ctx.font = "6px monospace";
      ctx.textAlign = "left";
      ctx.fillText("FILES", screen.x, screen.y);
      for (let i = 0; i < 2; i++)
        ctx.fillRect(
          screen.x,
          screen.y + 4 + i * 3,
          width * (i ? 0.22 : 0.42),
          1,
        );
      if (state.quiet || Math.floor(state.clock * 1.4) % 2 === 0)
        ctx.fillRect(screen.x, screen.y + 11, 3, 2);
      for (let row = 0; row < 3; row++)
        for (let col = 0; col < 7; col++) {
          const key = project(
            x - 0.26 + col * 0.087,
            0.825,
            z + 0.39 + row * 0.06,
          );
          ctx.fillStyle = "#91977d";
          ctx.fillRect(key.x, key.y, 2, 1);
        }
      const disk = project(x - 0.55, 0.48, z + 0.46);
      ctx.fillStyle = "#14271c";
      ctx.fillRect(disk.x, disk.y, width * 0.5, 2);
      ctx.fillStyle = "#b3b982";
      ctx.fillRect(disk.x + width * 0.6, disk.y, 2, 2);
      ctx.restore();
    }
    if (o.id === "radio") {
      box(x, 0, z, 1.25, 0.7, 0.55, ["#646c5b", "#323c32", "#444d3e"]);
      box(x - 0.28, 0.1, z + 0.29, 0.39, 0.4, 0.03, [
        "#454f58",
        "#3d4850",
        "#62666a",
      ]);
      box(x + 0.3, 0.31, z + 0.29, 0.35, 0.15, 0.03, [
        "#a6ad77",
        "#a6ad77",
        "#a6ad77",
      ]);
      box(x + 0.37, 0.7, z, 0.035, 0.85, 0.035, [
        "#676e63",
        "#676e63",
        "#676e63",
      ]);
      drawFaces();
      const width = worldUnit(canvas.width);
      for (let i = 0; i < 5; i++) {
        const line = project(x - 0.45, 0.43 - i * 0.055, z + 0.32);
        ctx.fillStyle = "#1a2b2d";
        ctx.fillRect(line.x, line.y, width * 0.31, 1);
      }
      for (const dx of [0.16, 0.42]) {
        const knob = project(x + dx, 0.16, z + 0.32);
        ctx.fillStyle = "#92977a";
        ctx.beginPath();
        ctx.arc(knob.x, knob.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      const tuning = project(x + 0.29, 0.36, z + 0.33);
      ctx.fillStyle = "#38523a";
      ctx.fillRect(tuning.x - width * 0.1, tuning.y, width * 0.2, 1);
      ctx.fillStyle = state.radioPlaying ? "#c6d495" : "#7b6e43";
      ctx.fillRect(tuning.x, tuning.y - 2, 1, 5);
    }
    if (o.id === "sign") {
      box(x, 0, z, 0.12, 0.8, 0.12, ["#535646", "#353a2d", "#424735"]);
      box(x, 0.65, z, 0.9, 0.48, 0.13, ["#868271", "#77745e", "#545840"]);
      drawFaces();
      const face = project(x, 0.99, z + 0.09),
        width = worldUnit(canvas.width);
      ctx.fillStyle = "#bab494";
      ctx.fillRect(face.x - width * 0.28, face.y - 2, width * 0.56, 12);
      ctx.fillStyle = "#4a5c43";
      for (let i = 0; i < 3; i++)
        ctx.fillRect(
          face.x - width * 0.21,
          face.y + 1 + i * 3,
          width * (i === 2 ? 0.24 : 0.4),
          1,
        );
    }
  }
  function drawPlayer(t, moving) {
    drawCharacter(
      ctx,
      project(state.player.x, 0, state.player.z),
      state.player,
      state.angle,
      moving,
      state.quiet,
      t,
    );
  }

  function drawGem(g, t) {
    const p = project(
      g.x,
      0.22 + (state.quiet ? 0 : Math.sin(t + g.x) * 0.04),
      g.z,
    );
    ctx.save();
    ctx.shadowColor = "#bdc993";
    ctx.shadowBlur = 7;
    ctx.fillStyle = "#c5c0a2";
    ctx.fillRect(p.x - 4, p.y - 5, 8, 10);
    ctx.restore();
    ctx.fillStyle = "#4b5546";
    ctx.fillRect(p.x - 2, p.y - 2, 4, 1);
    ctx.fillRect(p.x - 2, p.y, 4, 1);
    ctx.fillRect(p.x - 2, p.y + 2, 2, 1);
    ctx.fillStyle = "#9cb98e";
    ctx.fillRect(p.x + 3, p.y - 4, 1, 1);
  }

  function render(t, moving) {
    ctx.imageSmoothingEnabled = true;
    const baseRoom = rooms[state.world];
    const room = state.lampMode
      ? { ...baseRoom, wall: "#2e2637", floor: "#292932" }
      : baseRoom;
    ctx.fillStyle = "#080d0d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (state.powered === false) return;
    {
      surfaceKind = "wall";
      for (let x = -MAP.halfWidth; x < MAP.halfWidth; x += 3) {
        poly(
          [
            [x, 0, -3.5],
            [x + 3, 0, -3.5],
            [x + 3, 2, -3.5],
            [x, 2, -3.5],
          ],
          room.floor,
        );
        poly(
          [
            [x, 2, -3.5],
            [x + 3, 2, -3.5],
            [x + 3, 7, -3.5],
            [x, 7, -3.5],
          ],
          room.wall,
        );
      }
      drawFaces();
      surfaceKind = "metal";
      surfaceKind = "tile";
      for (let x = -MAP.halfWidth; x < MAP.halfWidth; x += 2)
        for (let z = -3.5; z < 3.5; z += 1) {
          poly(
            [
              [x, 0, z],
              [x + 2, 0, z],
              [x + 2, 0, z + 1],
              [x, 0, z + 1],
            ],
            room.floor,
          );
        }
      drawFaces();
      surfaceKind = "metal";
    }
    surfaceKind = "metal";
    // Ground contact remains subtle, so low-poly furniture belongs to the tiled floor.
    const unit = worldUnit(canvas.width);
    const visible = (x, w = 0) => {
      const screen = project(x, 0, 0).x;
      return (
        screen + (w * unit) / 2 + 64 >= 0 &&
        screen - (w * unit) / 2 - 64 <= canvas.width
      );
    };
    const visibleObjects = roomObjects(state).filter((o) => visible(o.x, o.w));
    for (const o of visibleObjects.filter((o) => o.solid)) {
      const p = project(o.x, 0, o.z),
        unit = worldUnit(canvas.width);
      ctx.save();
      ctx.fillStyle = "#02050555";
      ctx.shadowColor = "#020505";
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 3, o.w * unit * 0.55, o.d * 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    const items = visibleObjects.map((o) => ({
      x: o.x,
      z: o.z,
      draw: () => {
        const near = o.label && (state.directControl ? state.hoverObject===o.id : proximity(state.player, o) < 1);
        const mainContext = ctx;
        if (near) {
          if (
            glowLayer.width !== canvas.width ||
            glowLayer.height !== canvas.height
          ) {
            glowLayer.width = canvas.width;
            glowLayer.height = canvas.height;
          }
          glowContext.clearRect(0, 0, canvas.width, canvas.height);
          ctx = glowContext;
        }
        if (drawInstallation(o, { ctx, project, box, drawFaces }, state, t) || drawMachine(o, { ctx, project, box, drawFaces }, state, t)) {
        } else if (drawNPC(o, {ctx,project}, state, t)) {
        } else if (drawProp(o, {ctx,project,box,drawFaces}, state)) {
        } else if (o.kind === "bed") drawBed(o.x, o.z);
        else if (o.kind === "iv") drawIV(o.x, o.z);
        else if (o.kind === "cabinet") drawCabinet(o.x, o.z);
        else model(o);
        drawFaces();
        if (near) {
          ctx = mainContext;
          ctx.save();
          ctx.shadowColor = "#b7dfb3";
          ctx.shadowBlur = 7;
          ctx.drawImage(glowLayer, 0, 0);
          ctx.restore();
        }
      },
    }));
    items.push(
      ...state.gems
        .filter((g) => g.room === state.world && !g.taken && visible(g.x))
        .map((g) => ({ x: g.x, z: g.z, draw: () => drawGem(g, t) })),
    );
    if(!state.directControl) items.push({
      x: state.player.x,
      z: state.player.z,
      draw: () => drawPlayer(t, moving),
    });
    items.sort((a, b) => a.z - b.z);
    items.forEach((o) => o.draw());
    if (state.walkTarget) {
      const p = project(state.walkTarget.x, 0, state.walkTarget.z);
      ctx.strokeStyle = "#aacbac66";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 7, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (state.lampMode) {
      ctx.save();
      ctx.globalCompositeOperation = "soft-light";
      ctx.fillStyle = "#76469a30";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    if (state.transition > 0) {
      ctx.fillStyle = `rgba(4,8,6,${Math.min(0.7, state.transition * 2)})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  return { project, unproject, render };
}
