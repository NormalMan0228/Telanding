import { test } from "node:test";
import assert from "node:assert/strict";
import { createState } from "../static/js/game/config.js";
import { setupDevices } from "../static/js/site-devices.js";
import { inspectEquipment } from "../static/js/content/equipment.js";
import { persistSession, restoreSession } from "../static/js/game/session.js";
import { TRACKS } from "../static/js/game/tracks.js";

function harness() {
  globalThis.matchMedia = () => ({ matches: false });
  const elements = new Map(),
    storage = new Map();
  function element(id) {
    if (!elements.has(id)) {
      const classes = new Set();
      elements.set(id, {
        dataset: {},
        attributes: {},
        handlers: {},
        style: { setProperty() {} },
        classList: {
          toggle(name, on) {
            if (on) classes.add(name);
            else classes.delete(name);
          },
          contains: (name) => classes.has(name),
        },
        setAttribute(k, v) {
          this.attributes[k] = v;
        },
        addEventListener(type, fn) {
          this.handlers[type] = fn;
        },
        focus() {
          this.focused = true;
        },
      });
    }
    return elements.get(id);
  }
  const lights = ["eye", "pressure", "lamp"].map((name) => {
    const e = element(name);
    e.dataset.signal = name;
    return e;
  });
  globalThis.document = {
    addEventListener() {},
    documentElement: { dataset: {} },
    getElementById: element,
    querySelectorAll: (selector) =>
      selector === "[data-signal]"
        ? lights
        : selector === "[data-release-disc]"
          ? [element("disc")]
          : [],
  };
  globalThis.sessionStorage = {
    setItem: (k, v) => storage.set(k, v),
    getItem: (k) => storage.get(k),
  };
  const state = createState(),
    dialogues = [],
    power = [],
    atmospheres = [];
  let trackListener;
  setupDevices({
    state,
    show: (...args) => dialogues.push(args),
    note() {},
    setAtmosphere: (s) => atmospheres.push([s.pressure, s.lampMode]),
    setPower: (on) => {
      state.powered = on;
      power.push(on);
    },
    onTrackChange(fn) {
      trackListener = fn;
      fn(TRACKS[0]);
    },
    setTrack(id) {
      trackListener(TRACKS.find((t) => t.id === id));
    },
  });
  const click = (id) => element(id).handlers.click();
  return {
    state,
    element,
    click,
    dialogues,
    power,
    atmospheres,
    storage,
    trackListener: (track) => trackListener(track),
  };
}

test("the auxiliary puzzle changes the world and reveals a message without gating game information", () => {
  const h = harness();
  h.click("disc");
  assert.equal(h.dialogues.at(-1)[3], true);
  assert.ok(!h.state.signalRecovered);
  h.click("observer-eye");
  for (let i = 0; i < 3; i++) h.click("pressure-valve");
  h.click("lamp-switch");
  assert.equal(h.state.signalRecovered, true);
  assert.equal(h.element("disc").classList.contains("signal-found"), true);
  assert.ok(
    ["eye", "pressure", "lamp"].every((id) =>
      h.element(id).classList.contains("lit"),
    ),
  );
  h.click("lamp-switch");
  assert.equal(h.state.signalRecovered, true);
  assert.deepEqual(h.atmospheres.at(-1), [3, false]);
  h.click("disc");
  assert.equal(h.dialogues.at(-1)[3], true);
});

test("video power, printer and radio controls can all be reversed or repeated", () => {
  const h = harness();
  h.click("power-plug");
  assert.equal(h.state.powered, false);
  h.click("reconnect");
  assert.deepEqual(h.power, [false, true]);
  h.click("printer-button");
  assert.equal(h.element("paper-ticket").hidden, false);
  h.click("ticket-close");
  assert.equal(h.element("paper-ticket").hidden, true);
  assert.equal(h.element("printer-button").focused, true);
  h.trackListener(TRACKS.at(-2));
  h.click("tuning-dial");
  assert.equal(h.state.tuning, TRACKS.length - 1);
  h.click("tuning-dial");
  assert.equal(h.state.tuning, 0);
});

test("equipment discoveries and device states survive page navigation; malformed values do not", () => {
  const h = harness();
  inspectEquipment("sleep-terminal", h.state);
  inspectEquipment("organ", h.state);
  inspectEquipment("organ", h.state);
  inspectEquipment("chair", h.state);
  inspectEquipment("mail-tube", h.state);
  assert.equal(inspectEquipment("postmaster", h.state).gamesLink, true);
  h.state.pressure = 3;
  h.state.signalRecovered = true;
  persistSession(h.state);
  const restored = createState();
  restoreSession(restored);
  assert.equal(restored.monitorAwake, true);
  assert.equal(restored.pressure, 3);
  assert.equal(restored.chairOccupied, true);
  assert.equal(restored.letterSent, true);
  assert.deepEqual(restored.discovered, [
    "sleep-terminal",
    "organ",
    "chair",
    "mail-tube",
    "postmaster",
  ]);
  h.storage.set(
    "telemera.explorer.v2",
    JSON.stringify({
      pressure: 999,
      lampMode: "yes",
      discovered: ["organ", "organ", "unknown"],
      world: -9,
    }),
  );
  const clean = createState();
  restoreSession(clean);
  assert.equal(clean.pressure, 0);
  assert.equal(clean.lampMode, false);
  assert.equal(clean.world, 0);
  assert.deepEqual(clean.discovered, ["organ"]);
});
