import { createCanvas } from "@napi-rs/canvas";
import { mkdirSync, writeFileSync } from "node:fs";
import { drawCharacter } from "../static/js/game/character.js";
const directory = "artifacts/qa";
mkdirSync(directory, { recursive: true });
const canvas = createCanvas(1024, 768),
  ctx = canvas.getContext("2d");
ctx.fillStyle = "#121d1c";
ctx.fillRect(0, 0, 1024, 768);
ctx.font = "13px monospace";
for (let direction = 0; direction < 8; direction++)
  for (let frame = 0; frame < 8; frame++) {
    const x = frame * 128 + 64,
      y = direction * 96 + 85;
    ctx.strokeStyle = "#26332e";
    ctx.strokeRect(frame * 128, direction * 96, 128, 96);
    drawCharacter(
      ctx,
      { x, y, scale: 1.25 },
      { heading: (direction * Math.PI) / 4, gait: (frame * Math.PI) / 4 },
      0,
      true,
      false,
      frame * 0.12,
    );
    ctx.fillStyle = "#9ba995";
    ctx.fillText(`${direction}:${frame}`, frame * 128 + 5, direction * 96 + 14);
  }
writeFileSync(`${directory}/character-sheet.png`, canvas.toBuffer("image/png"));
console.log("Rendered 8 directions × 8 walking poses.");
const gestures = createCanvas(1024, 384),
  g = gestures.getContext("2d");
g.fillStyle = "#121d1c";
g.fillRect(0, 0, 1024, 384);
for (let direction = 0; direction < 8; direction++)
  for (let pose = 0; pose < 4; pose++) {
    drawCharacter(
      g,
      { x: direction * 128 + 64, y: pose * 96 + 82, scale: 1.25 },
      {
        heading: (direction * Math.PI) / 4,
        gait: 0,
        motion: 0,
        reach: 1 - pose / 3,
      },
      0,
      false,
      false,
      0,
    );
  }
writeFileSync(
  `${directory}/character-gestures.png`,
  gestures.toBuffer("image/png"),
);
