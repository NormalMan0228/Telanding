import { createCanvas } from "@napi-rs/canvas";
import { mkdirSync, writeFileSync } from "node:fs";
import { drawCurtain } from "../static/js/stages/curtain.js";
mkdirSync("artifacts/qa", { recursive: true });
const canvas=createCanvas(640,400),ctx=canvas.getContext("2d");
for(const [name,progress] of [["closed",0],["opening",0.5],["open",1]]) {
  drawCurtain(ctx,640,400,progress);
  writeFileSync(`artifacts/qa/curtain-${name}.png`,canvas.toBuffer("image/png"));
}
