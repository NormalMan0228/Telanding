import { test } from "node:test";
import assert from "node:assert/strict";
const elements = new Map(),
  storage = new Map();
function element(id) {
  if (!elements.has(id))
    elements.set(id, {
      textContent: "",
      style: { setProperty() {} },
      open: false,
      dataset: {},
      classList: { toggle() {} },
      setAttribute() {},
      addEventListener() {},
      querySelector() {
        return element(id + "-child");
      },
      showModal() {
        this.open = true;
      },
      close() {
        this.open = false;
      },
      focus() {},
      getBoundingClientRect() {
        return { width: 1200, height: 800, left: 0, top: 0 };
      },
      getContext() {
        return new Proxy(
          {},
          {
            get: (_, key) =>
              key === "createLinearGradient"
                ? () => ({ addColorStop() {} })
                : () => {},
            set: () => true,
          },
        );
      },
    });
  return elements.get(id);
}
globalThis.matchMedia = () => ({ matches: false });
globalThis.document = {
  hidden: false,
  documentElement: { dataset: {} },
  createElement: () => element("texture"),
  getElementById: element,
  querySelector: () => element("world"),
  querySelectorAll: () => [],
  addEventListener() {},
};
globalThis.window = { addEventListener() {} };
globalThis.location = {
  assign(path) {
    this.destination = path;
  },
};
globalThis.sessionStorage = {
  setItem: (k, v) => storage.set(k, v),
  getItem: (k) => storage.get(k) ?? null,
};
globalThis.requestAnimationFrame = () => {};
globalThis.setInterval = () => 1;
globalThis.clearInterval = () => {};
const { state, frame, activate, resetExploration } = await import(
  "../static/js/game/index.js"
);
const { MAP, createState, objects } = await import(
  "../static/js/game/config.js"
);
const { restoreSession, persistSession } = await import(
  "../static/js/game/session.js"
);
const { createRenderer } = await import("../static/js/game/renderer.js");
const { blocked, movePlayer, nearby, travel, checkExit } = await import(
  "../static/js/game/navigation.js"
);
const { rooms, roomObjects } = await import("../static/js/game/config.js");
const { facingFor, advanceLocomotion } = await import(
  "../static/js/game/character.js"
);

test("eight distinct facings and distance-driven animation", () => {
  const views = new Set(
    Array.from({ length: 8 }, (_, i) => facingFor((i * Math.PI) / 4, 0)),
  );
  assert.equal(views.size, 8);
  const p = { x: 0, z: 0, heading: 0, gait: 0 };
  assert.equal(advanceLocomotion(p, 0, 0), false);
  p.x = 1;
  p.z = 1;
  advanceLocomotion(p, 0, 0);
  assert.equal(facingFor(p.heading, 0), "front-right");
  const gait = p.gait;
  assert.equal(advanceLocomotion(p, 1, 1), false);
  assert.equal(p.gait, gait);
});
test("solid props stop movement, diagonal speed is normalized, and wall sliding works", () => {
  const s = createState(),
    bed = roomObjects(s)
      .filter((o) => o.kind === "bed")
      .at(-1);
  s.player.x = bed.x - 2;
  s.player.z = bed.z;
  for (let i = 0; i < 60; i++) movePlayer(s, 1, 0, 0.04);
  assert.ok(s.player.x <= bed.x - bed.w / 2 - MAP.margin + 0.00001);
  assert.equal(blocked(s, s.player.x, s.player.z), false);
  const before = s.player.z;
  movePlayer(s, 1, 1, 0.04);
  assert.ok(s.player.z > before);
  const a = createState(),
    b = createState();
  a.player = { x: 0, z: 0 };
  b.player = { x: 0, z: 0 };
  movePlayer(a, 1, 0, 0.04);
  movePlayer(b, 1, 1, 0.04);
  assert.ok(Math.abs(Math.hypot(b.player.x, b.player.z) - a.player.x) < 1e-8);
});
test("door transitions are bidirectional, room-specific and do not bounce", () => {
  const s = createState();
  s.player.x = 17.4;
  s.player.z = 0;
  assert.equal(checkExit(s), true);
  assert.equal(s.world, 1);
  assert.equal(checkExit(s), false);
  assert.notDeepEqual(rooms[0].objects, rooms[1].objects);
  s.player.x = -17.4;
  assert.equal(checkExit(s), true);
  assert.equal(s.world, 0);
  travel(s, -1);
  assert.equal(s.world, rooms.length - 1);
  assert.equal(blocked(s, s.player.x, s.player.z), false);
  s.player.x = 17.4;
  s.player.z = 2;
  assert.equal(checkExit(s), false);
});
test("all room records and door approaches are reachable around solid props", () => {
  for (let room = 0; room < rooms.length; room++) {
    const s = createState();
    s.world = room;
    const step = 0.25,
      queue = [[-16, 0]],
      visited = new Set(["-64,0"]);
    for (let i = 0; i < queue.length; i++) {
      const [x, z] = queue[i];
      for (const [dx, dz] of [
        [step, 0],
        [-step, 0],
        [0, step],
        [0, -step],
      ]) {
        const nx = x + dx,
          nz = z + dz,
          key = `${Math.round(nx / step)},${Math.round(nz / step)}`;
        if (!visited.has(key) && !blocked(s, nx, nz)) {
          visited.add(key);
          queue.push([nx, nz]);
        }
      }
    }
    for (const target of [
      ...s.gems.filter((g) => g.room === room),
      { x: 17.4, z: 0 },
      { x: -17.4, z: 0 },
    ])
      assert.ok(
        queue.some(([x, z]) => Math.hypot(x - target.x, z - target.z) < 0.6),
        `room ${room}: ${JSON.stringify(target)}`,
      );
  }
});
test("nearby interaction, scrolling renderer and page navigation without invented records", () => {
  resetExploration();
  const computer = roomObjects(state).find((o) => o.id === "computer");
  state.player.x = computer.x;
  state.player.z = computer.z + 1;
  assert.equal(nearby(state).id, "computer");
  state.player.z = 2.8;
  assert.notEqual(nearby(state)?.id, "computer");
  const renderer = createRenderer(element("world"), state);
  state.cameraX = -8;
  const first = renderer.project(0, 0, 0).x;
  state.cameraX = 8;
  assert.notEqual(renderer.project(0, 0, 0).x, first);
  for (const [i, g] of state.gems.entries()) {
    state.world = g.room;
    state.player.x = g.x;
    state.player.z = g.z;
    frame(100 + i * 40);
  }
  assert.equal(state.gems.length, 0);
  activate("computer");
  assert.equal(location.destination, "/records");
  const restored = createState();
  restoreSession(restored);
  assert.equal(restored.gems.length, 0);
});
test("installations are solid, activate independently and survive navigation", () => {
  for (let world = 0; world < rooms.length; world++) {
    state.world = world;
    for (const o of roomObjects(state).filter((o) => o.id.startsWith("wall-"))) {
      assert.equal(o.solid, true);
      assert.equal(blocked(state, o.x, o.z), true);
      const key = `${world}:${o.id}`;
      activate(o.id);
      assert.equal(state.apparatus[key], true);
      activate(o.id);
      assert.equal(state.apparatus[key], false);
    }
  }
  state.apparatus["0:wall-shutter"] = true;
  persistSession(state);
  const restored = createState();
  restoreSession(restored);
  assert.equal(restored.apparatus["0:wall-shutter"], true);
});
test("camera motion preserves projected object size and subpixel translation", () => {
  const renderer=createRenderer(element("world"),state);
  let previous=null;
  for(let i=0;i<80;i++) {
    state.cameraX=-2+i*.013;
    const a=renderer.project(0,0,0),b=renderer.project(1,0,0);
    assert.ok(Math.abs(b.x-a.x-a.unit)<1e-8);
    if(previous)assert.ok(Math.abs(a.x-previous.x+.013*a.unit)<1e-8);
    previous=a;
  }
});
test("all room renderers run and stored collisions recover safely", () => {
  for (let i = 0; i < rooms.length; i++) {
    state.world = i;
    state.cameraX = 0;
    frame(500 + i * 40);
  }
  state.world = 0;
  state.player.x = -10;
  state.player.z = -2;
  persistSession(state);
  const s = createState();
  restoreSession(s);
  assert.equal(blocked(s, s.player.x, s.player.z), false);
});
