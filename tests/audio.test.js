import { test } from "node:test";
import assert from "node:assert/strict";
import { TRACKS, eventFor, hz } from "../static/js/game/tracks.js";
import { createAudio } from "../static/js/game/audio.js";

function harness(saved = null) {
  const elements = new Map(),
    events = new Map(),
    timers = new Map(),
    storage = new Map();
  let serial = 0,
    contexts = 0,
    context;
  if (saved) storage.set("telemera.audio.v1", JSON.stringify(saved));
  function element(id) {
    if (!elements.has(id))
      elements.set(id, {
        value: id === "volume" ? "35" : "",
        textContent: "",
        handlers: {},
        children: [],
        attributes: {},
        classList: { toggle() {} },
        setAttribute(k, v) {
          this.attributes[k] = v;
        },
        addEventListener(k, fn) {
          this.handlers[k] = fn;
        },
        replaceChildren(...children) {
          this.children = children;
        },
      });
    return elements.get(id);
  }
  class Param {
    value = 0;
    setValueAtTime(v, t) {
      assert.ok(Number.isFinite(v) && Number.isFinite(t));
      this.value = v;
    }
    exponentialRampToValueAtTime(v, t) {
      assert.ok(v > 0 && Number.isFinite(t));
      this.value = v;
    }
    setTargetAtTime(v, t) {
      assert.ok(Number.isFinite(v) && Number.isFinite(t));
      this.value = v;
    }
  }
  class Node {
    gain = new Param();
    frequency = new Param();
    threshold = new Param();
    knee = new Param();
    ratio = new Param();
    attack = new Param();
    release = new Param();
    connections = [];
    connect(to) {
      assert.ok(to);
      this.connections.push(to);
    }
    disconnect() {
      this.connections = [];
    }
    start(t) {
      assert.ok(t >= 0);
      this.started = t;
    }
    stop(t) {
      if (t === undefined) {
        this.stopped = true;
        this.onended?.();
      } else assert.ok(t >= this.started);
    }
  }
  class Audio {
    currentTime = 0;
    sampleRate = 8000;
    destination = new Node();
    state = "suspended";
    nodes = [];
    reject = false;
    constructor() {
      context = this;
      contexts++;
    }
    createGain() {
      const n = new Node();
      this.nodes.push(n);
      return n;
    }
    createOscillator() {
      return this.createGain();
    }
    createBufferSource() {
      return this.createGain();
    }
    createBiquadFilter() {
      return this.createGain();
    }
    createConvolver() {
      return this.createGain();
    }
    createDynamicsCompressor() {
      return this.createGain();
    }
    createWaveShaper() {
      return this.createGain();
    }
    createAnalyser() {
      const node = this.createGain();
      node.frequencyBinCount = 64;
      node.getByteFrequencyData = (data) => data.fill(100);
      return node;
    }
    createBuffer(channels, length) {
      const data = Array.from(
        { length: channels },
        () => new Float32Array(length),
      );
      return {
        length,
        getChannelData: (i) => data[i],
        copyToChannel: (source, i) => data[i].set(source),
      };
    }
    async resume() {
      if (this.reject) throw Error("unavailable");
      this.state = "running";
    }
    async suspend() {
      this.state = "suspended";
    }
  }
  globalThis.document = {
    hidden: false,
    getElementById: element,
    createElement: () => ({}),
    querySelector: () => element("radio"),
    addEventListener: (type, fn) => events.set(type, fn),
  };
  globalThis.window = {
    AudioContext: Audio,
    addEventListener: (type, fn) => events.set(type, fn),
  };
  globalThis.sessionStorage = {
    getItem: (key) => storage.get(key),
    setItem: (key, value) => storage.set(key, value),
  };
  globalThis.setInterval = (fn) => {
    timers.set(++serial, fn);
    return serial;
  };
  globalThis.clearInterval = (id) => timers.delete(id);
  const messages = [],
    player = createAudio({
      say: (text) => messages.push(text),
      button: element("sound"),
    });
  return {
    player,
    element,
    events,
    timers,
    messages,
    storage,
    get context() {
      return context;
    },
    get contexts() {
      return contexts;
    },
  };
}

test("all original tracks produce finite, distinct scores with both rhythmic and ambient arrangements", () => {
  assert.equal(new Set(TRACKS.map((t) => t.id)).size, TRACKS.length);
  const signatures = new Set();
  let rhythmic = 0;
  for (const track of TRACKS) {
    const score = Array.from({ length: 128 }, (_, i) => eventFor(track, i));
    signatures.add(JSON.stringify(score));
    if (score.some((e) => e.percussion)) rhythmic++;
    for (const event of score)
      for (const midi of [event.bass, event.lead, ...event.chord].filter(
        (n) => n !== null,
      ))
        assert.ok(hz(midi) > 20 && hz(midi) < 6000);
  }
  assert.equal(signatures.size, TRACKS.length);
  assert.ok(rhythmic > 0 && rhythmic < TRACKS.length);
});

test("audio requires a user gesture and pause/resume never duplicates the scheduler", async () => {
  const h = harness();
  assert.equal(h.contexts, 0);
  assert.equal(h.player.getState().playing, false);
  h.player.note(440);
  assert.equal(h.contexts, 0);
  await h.player.toggleSound();
  assert.equal(h.contexts, 1);
  assert.equal(h.context.state, "running");
  assert.equal(h.timers.size, 1);
  const nodes = h.context.nodes.length;
  assert.ok(nodes > 10);
  h.context.currentTime = 1;
  for (const tick of h.timers.values()) tick();
  assert.equal(h.element("audio-time").textContent, "00:01");
  await h.player.toggleSound();
  assert.equal(h.context.state, "suspended");
  assert.equal(h.timers.size, 0);
  await h.player.toggleSound();
  assert.equal(h.contexts, 1);
  assert.equal(h.timers.size, 1);
  h.events.get("pagehide")();
  assert.equal(h.timers.size, 0);
  assert.equal(h.player.getState().playing, false);
});

test("track controls stay synchronized, restore preferences without autoplay, and reject invalid IDs", async () => {
  const h = harness({ track: "cassette", volume: 999 });
  assert.equal(h.element("volume").value, "100");
  assert.equal(h.player.getState().track, "cassette");
  assert.equal(h.contexts, 0);
  const changes = [];
  h.player.onTrackChange((t) => changes.push(t.id));
  assert.equal(h.player.setTrack("not-a-track"), false);
  assert.deepEqual(changes, ["cassette"]);
  h.element("track-next").handlers.click();
  assert.equal(h.player.getState().track, "sodium");
  h.player.setTrack(TRACKS.at(-1).id);
  h.element("track-next").handlers.click();
  assert.equal(h.player.getState().track, "standby");
  await h.player.toggleSound();
  h.element("volume").value = "0";
  h.element("volume").handlers.input();
  assert.equal(JSON.parse(h.storage.get("telemera.audio.v1")).volume, 0);
  h.events.get("pagehide")();
});

test("tab suspension and an unavailable audio device recover without unhandled rejections", async () => {
  const h = harness();
  await h.player.toggleSound();
  document.hidden = true;
  await h.events.get("visibilitychange")();
  assert.equal(h.context.state, "suspended");
  document.hidden = false;
  await h.events.get("visibilitychange")();
  assert.equal(h.context.state, "running");
  await h.player.toggleSound();
  h.context.reject = true;
  await h.player.toggleSound();
  assert.equal(h.player.getState().playing, false);
  assert.equal(h.timers.size, 0);
  assert.equal(h.messages.length, 1);
  h.context.reject = false;
  await h.player.toggleSound();
  assert.equal(h.player.getState().playing, true);
  h.events.get("pagehide")();
});
