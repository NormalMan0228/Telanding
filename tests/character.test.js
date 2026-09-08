import { test } from "node:test";
import assert from "node:assert/strict";
import { footPose, STRIDE_RATE } from "../static/js/game/character.js";

test("planted feet counter world travel in all eight directions and viewport scales", () => {
  for (const unit of [32, 36, 40]) {
    const size = 1.12;
    const amplitude = (Math.PI * unit) / (2 * STRIDE_RATE * size);
    for (let direction = 0; direction < 8; direction++) {
      const heading = (direction * Math.PI) / 4;
      const start = footPose(0.4, amplitude);
      const distance = 0.2;
      const end = footPose(0.4 + distance * STRIDE_RATE, amplitude);
      const dx = distance * Math.cos(heading) * unit;
      const dy = distance * Math.sin(heading) * 22;
      const footTravel = (end.forward - start.forward) * size;
      assert.ok(Math.abs(dx + footTravel * Math.cos(heading)) < 1e-10);
      assert.ok(
        Math.abs(dy + footTravel * Math.sin(heading) * (22 / unit)) < 1e-10,
      );
      assert.equal(start.lift, 0);
      assert.equal(end.lift, 0);
    }
  }
});

test("foot return clears the floor and joins each contact without a position jump", () => {
  const amplitude = 14;
  for (const boundary of [0, Math.PI, Math.PI * 2]) {
    const before = footPose(boundary - 1e-7, amplitude);
    const after = footPose(boundary + 1e-7, amplitude);
    assert.ok(Math.abs(before.forward - after.forward) < 0.00001);
    assert.ok(Math.abs(before.lift - after.lift) < 0.00001);
  }
  for (let phase = Math.PI; phase < 2 * Math.PI; phase += 0.01) {
    const pose = footPose(phase, amplitude);
    assert.ok(pose.lift >= 0 && pose.lift <= 4.2);
    assert.ok(Math.abs(pose.forward) <= amplitude);
  }
  assert.ok(footPose(Math.PI * 1.5, amplitude).lift > 4);
});
