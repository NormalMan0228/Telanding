import { test } from "node:test";
import assert from "node:assert/strict";
import { createState, rooms, roomObjects } from "../static/js/game/config.js";
import {
  findPath,
  clickIntent,
  walkRoute,
} from "../static/js/game/pathfinding.js";
import {
  blocked,
  movePlayer,
  proximity,
} from "../static/js/game/navigation.js";
globalThis.matchMedia = () => ({ matches: false });
function follow(state, path) {
  state.waypoints = path;
  let count = 0;
  while (path.length && count++ < 3500) {
    walkRoute(state, 0.04);
    assert.equal(blocked(state, state.player.x, state.player.z), false);
  }
  return !path.length;
}
test("every interactive machine is reachable by point-and-click from each entry", () => {
  for (let world = 0; world < rooms.length; world++)
    for (const side of [-1, 1])
      for (const target of rooms[world].objects.filter((o) => o.label)) {
        const s = createState();
        s.world = world;
        s.player.x = side * 16.3;
        s.player.z = 0;
        const path = findPath(s, target, target);
        assert.notEqual(path, null, `${world}/${target.id}`);
        assert.ok(follow(s, path), `walk stalls: ${world}/${target.id}`);
        assert.ok(proximity(s.player, target) < 1);
      }
});

test("a click walk has no one-frame pauses at grid waypoints", () => {
  const state = createState();
  state.player.x = -16;
  state.player.z = 0;
  assert.ok(clickIntent(state, { x: -12, z: 0 }));
  while (state.waypoints.length > 1) {
    const before = { ...state.player };
    walkRoute(state, 1 / 60);
    const distance = Math.hypot(
      state.player.x - before.x,
      state.player.z - before.z,
    );
    assert.ok(
      distance > 0.058 && distance < 0.061,
      `unexpected speed: ${distance}`,
    );
  }
});

test("off-grid starts and paper pickups remain reachable without cutting solid corners", () => {
  let seed = 17;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < 180; i++) {
    const s = createState();
    s.world = i % rooms.length;
    do {
      s.player.x = random() * 33 - 16.5;
      s.player.z = random() * 6 - 3;
    } while (blocked(s, s.player.x, s.player.z));
    const targets = roomObjects(s).filter((o) => o.label),
      target = targets[Math.floor(random() * targets.length)];
    const path = findPath(s, target, target);
    assert.notEqual(
      path,
      null,
      `no route from ${JSON.stringify(s.player)} to ${target.id}`,
    );
    assert.ok(
      follow(s, path),
      `stalled from off-grid start ${i} to ${target.id}`,
    );
  }
  for (const gem of createState().gems) {
    const s = createState();
    s.world = gem.room;
    const target = { ...gem, w: 0, d: 0, reach: 0.45, pickKind: "fragment" };
    assert.ok(clickIntent(s, target, target));
    assert.ok(follow(s, s.waypoints));
    assert.ok(Math.hypot(s.player.x - gem.x, s.player.z - gem.z) < 0.65);
  }
});
test("a floor click inside solid furniture is rejected without corrupting the old route", () => {
  const s = createState();
  const target = roomObjects(s).find((o) => o.kind === "bed");
  s.waypoints = [{ x: 1, z: 0 }];
  assert.equal(clickIntent(s, target), false);
  assert.deepEqual(s.waypoints, [{ x: 1, z: 0 }]);
});
test("diagonal paths do not cut furniture corners", () => {
  const s = createState();
  s.player.x = -6.5;
  s.player.z = -0.7;
  const path = findPath(s, { x: -4, z: -0.3 });
  assert.notEqual(path, null);
  assert.ok(follow(s, path));
});
