import { createCanvas, loadImage } from "@napi-rs/canvas";
import { mkdirSync, writeFileSync } from "node:fs";
import { createState, rooms } from "../static/js/game/config.js";
import { BACKDROP_FILES } from "../static/js/game/backdrops.js";
import { createRenderer } from "../static/js/game/renderer.js";
import { canvasSize } from "../static/js/game/viewport.js";
globalThis.matchMedia = () => ({ matches: false });
globalThis.document = { createElement: () => createCanvas(64, 64) };
mkdirSync("artifacts/qa", { recursive: true });
const backdrops = await Promise.all(
  BACKDROP_FILES.map((name) =>
    loadImage(`static/images/telemera-${name}-panorama.png`),
  ),
);
for (let room = 0; room < rooms.length; room++) {
  const canvas = createCanvas(800, 520),
    state = createState();
  state.world = room;
  state.backdrops = backdrops;
  state.player.x = room === 0 ? -2 : room === 1 ? 5 : room === 2 ? -1 : -4;
  state.player.z = 0.6;
  state.cameraX = state.player.x;
  state.pressure = 3;
  state.eyeAwake = true;
  const renderer = createRenderer(canvas, state);
  renderer.render(3, true);
  writeFileSync(`artifacts/qa/room-${room}.png`, canvas.toBuffer("image/png"));
}
console.log(
  `Rendered ${rooms.length} complete room frames using the production renderer.`,
);
for (const [name, width, height] of [
  ["entrance-wide", 1136, 690],
  ["entrance-medium", 649, 690],
  ["entrance-mobile", 350, 550],
]) {
  const dimensions = canvasSize({ width, height });
  const canvas = createCanvas(dimensions.width, dimensions.height),
    state = createState();
  state.backdrops = backdrops;
  state.eyeAwake = true;
  state.monitorAwake = true;
  state.pressure = 2;
  createRenderer(canvas, state).render(2, false);
  writeFileSync(`artifacts/qa/${name}.png`, canvas.toBuffer("image/png"));
}
