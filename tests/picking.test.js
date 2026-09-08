import { test } from "node:test";
import assert from "node:assert/strict";
import { createCanvas } from "@napi-rs/canvas";
import { createState, rooms, roomObjects } from "../static/js/game/config.js";
import { createRenderer } from "../static/js/game/renderer.js";
import { pickTarget } from "../static/js/game/picking.js";
import { worldUnit } from "../static/js/game/viewport.js";
import { clickIntent, walkRoute } from "../static/js/game/pathfinding.js";
import { proximity } from "../static/js/game/navigation.js";

test("the visible door face can be clicked and approached at both map edges", () => {
  globalThis.matchMedia = () => ({ matches: false });
  globalThis.document = { createElement: () => createCanvas(64, 64) };
  for (const width of [360, 712, 800])
    for (let world = 0; world < rooms.length; world++)
      for (const side of [-1, 1]) {
        const state = createState();
        state.world = world;
        state.player.x = state.cameraX = side * 15;
        const { project } = createRenderer(createCanvas(width, 520), state);
        const door = roomObjects(state).find(
          (o) => o.id === (side < 0 ? "exit-left" : "exit-right"),
        );
        const point = project(door.x + door.visualOffset, 1.4, door.z);
        assert.ok(point.x >= 0 && point.x <= width);
        const target = pickTarget(state, project, point, worldUnit(width));
        assert.equal(target?.id, door.id);
        assert.equal(clickIntent(state, target, target), true);
        let frames = 0;
        while (state.waypoints.length && frames++ < 300)
          walkRoute(state, 1 / 60);
        assert.equal(state.waypoints.length, 0);
        assert.ok(proximity(state.player, door) < 1);
        assert.equal(state.pendingAction, door.id);
      }
});
