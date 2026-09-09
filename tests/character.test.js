import { test } from "node:test";
import assert from "node:assert/strict";
import {
  footPose,
  STEP_HEIGHT,
  STEP_LENGTH,
} from "../static/js/game/character.js";

test("opposite feet alternate with a compact, symmetric stride", () => {
  for (let phase = 0; phase < Math.PI * 2; phase += 0.01) {
    const left = footPose(phase);
    const right = footPose(phase + Math.PI);
    assert.ok(Math.abs(left.forward + right.forward) < 1e-10);
    assert.ok(left.lift >= 0 && left.lift <= STEP_HEIGHT);
    assert.ok(right.lift >= 0 && right.lift <= STEP_HEIGHT);
    assert.ok(Math.abs(left.forward) <= STEP_LENGTH);
    assert.ok(Math.abs(right.forward) <= STEP_LENGTH);
    assert.ok(left.lift === 0 || right.lift === 0);
  }
});

test("foot motion joins each contact without a position jump", () => {
  for (const boundary of [0, Math.PI, Math.PI * 2]) {
    const before = footPose(boundary - 1e-7);
    const after = footPose(boundary + 1e-7);
    assert.ok(Math.abs(before.forward - after.forward) < 0.00001);
    assert.ok(Math.abs(before.lift - after.lift) < 0.00001);
  }
  assert.equal(footPose(Math.PI / 2).lift, STEP_HEIGHT);
  assert.equal(footPose(Math.PI * 1.5).lift, 0);
});
