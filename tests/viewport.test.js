import { test } from "node:test";
import assert from "node:assert/strict";
import { canvasSize, worldUnit } from "../static/js/game/viewport.js";

test("the playfield preserves its physical aspect ratio on narrow, medium and wide screens", () => {
  for (const width of [288, 350, 649, 650, 900, 1136, 1370])
    for (const height of [500, 690, 850]) {
      const size = canvasSize({ width, height });
      const xScale = width / size.width,
        yScale = height / size.height;
      assert.ok(
        Math.abs(xScale / yScale - 1) < 0.005,
        `distortion at ${width}x${height}`,
      );
      assert.ok(size.width >= 360 && size.width <= 800);
    }
  assert.equal(canvasSize({ width: 0, height: 600 }), null);
});
test("character size and map scale have no sudden responsive breakpoint jump", () => {
  for (const boundary of [600, 650, 700, 900, 960, 1050]) {
    const before = canvasSize({ width: boundary - 1, height: 690 }),
      after = canvasSize({ width: boundary + 1, height: 690 });
    const characterScaleBefore = (boundary - 1) / before.width,
      characterScaleAfter = (boundary + 1) / after.width;
    assert.ok(Math.abs(characterScaleAfter / characterScaleBefore - 1) < 0.03);
    assert.ok(
      Math.abs(worldUnit(after.width) / worldUnit(before.width) - 1) < 0.03,
    );
  }
});
