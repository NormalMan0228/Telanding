import { test } from "node:test";
import assert from "node:assert/strict";
import { setupInput } from "../static/js/game/input.js";

function target(dataset = {}) {
  const listeners = {};
  return {
    dataset,
    setPointerCapture() {},
    addEventListener(type, listener) {
      (listeners[type] ??= []).push(listener);
    },
    fire(type, props = {}) {
      let prevented = false;
      const event = {
        key: "",
        preventDefault() {
          prevented = true;
        },
        ...props,
      };
      listeners[type]?.forEach((fn) => fn(event));
      return prevented;
    },
  };
}
function harness() {
  const canvas = target(),
    up = target({ move: "up" }),
    diagonal = target({ move: "up-right" }),
    left = target({ move: "left" });
  globalThis.window = target();
  globalThis.document = {
    ...target(),
    querySelectorAll: () => [up, diagonal, left],
  };
  const state = {
    keys: new Set(),
    waypoints: [{ x: 1, z: 0 }],
    pendingAction: "radio",
    walkTarget: { x: 1, z: 0 },
    last: 50,
  };
  let interactions = 0;
  const input = setupInput({ canvas, state, interact: () => interactions++ });
  return {
    canvas,
    up,
    diagonal,
    left,
    state,
    input,
    get interactions() {
      return interactions;
    },
  };
}

test("overlapping touch directions release independently and cancelled pointers cannot stick", () => {
  const h = harness();
  h.up.fire("pointerdown", { pointerId: 1 });
  h.diagonal.fire("pointerdown", { pointerId: 2 });
  h.up.fire("pointerup", { pointerId: 1 });
  assert.deepEqual([...h.state.keys].sort(), ["ArrowRight", "ArrowUp"]);
  h.diagonal.fire("pointercancel", { pointerId: 2 });
  assert.equal(h.state.keys.size, 0);
  h.diagonal.fire("lostpointercapture", { pointerId: 2 });
  assert.equal(h.state.keys.size, 0);
  assert.equal(h.state.pendingAction, null);
  assert.equal(h.state.waypoints.length, 0);
});
test("uppercase movement works, modifier shortcuts remain available, and E does not repeat", () => {
  const h = harness();
  assert.equal(h.canvas.fire("keydown", { key: "W" }), true);
  assert.ok(h.state.keys.has("w"));
  window.fire("keyup", { key: "w" });
  assert.equal(h.state.keys.size, 0);
  assert.equal(h.canvas.fire("keydown", { key: "a", ctrlKey: true }), false);
  assert.equal(h.state.keys.size, 0);
  h.canvas.fire("keydown", { key: "E" });
  h.canvas.fire("keydown", { key: "E", repeat: true });
  assert.equal(h.interactions, 1);
});
test("onscreen controls support keyboard hold and every focus-loss path clears movement", () => {
  const h = harness();
  h.left.fire("keydown", { key: " " });
  assert.ok(h.state.keys.has("ArrowLeft"));
  h.left.fire("keyup", { key: " " });
  assert.equal(h.state.keys.size, 0);
  h.left.fire("keydown", { key: "Enter" });
  h.left.fire("blur");
  assert.equal(h.state.keys.size, 0);
  h.canvas.fire("keydown", { key: "d" });
  window.fire("blur");
  assert.equal(h.state.keys.size, 0);
  h.up.fire("pointerdown", { pointerId: 4 });
  document.fire("visibilitychange");
  assert.equal(h.state.keys.size, 0);
  assert.equal(h.state.last, 0);
});
