import { createCanvas, loadImage } from "@napi-rs/canvas";
import { performance } from "node:perf_hooks";
import { createState, rooms } from "../static/js/game/config.js";
import { BACKDROP_FILES } from "../static/js/game/backdrops.js";
import { createRenderer } from "../static/js/game/renderer.js";
globalThis.matchMedia = () => ({ matches: false });
globalThis.document = { createElement: () => createCanvas(64, 64) };
const images = await Promise.all(
  BACKDROP_FILES.map((name) =>
    loadImage(`static/images/telemera-${name}-panorama.png`),
  ),
);
for (let world = 0; world < rooms.length; world++) {
  const canvas = createCanvas(640, 420),
    state = createState();
  state.world = world;
  state.backdrops = images;
  state.eyeAwake = true;
  state.pressure = 3;
  const { render } = createRenderer(canvas, state);
  const frames = 90;
  render(0, false);
  const start = performance.now();
  for (let i = 0; i < frames; i++) {
    state.cameraX = state.player.x = -14 + (i / frames) * 28;
    state.player.z = Math.sin(i / 25);
    state.player.gait = i * 0.15;
    render(i / 60, true);
  }
  console.log(
    `Room ${world + 1}: ${((performance.now() - start) / frames).toFixed(2)} ms/frame (native Canvas; excludes browser layout)`,
  );
}
