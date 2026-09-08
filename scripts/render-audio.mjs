import { OfflineAudioContext } from "node-web-audio-api";
import { mkdirSync, writeFileSync } from "node:fs";
import { createAudio } from "../static/js/game/audio.js";
import { TRACKS } from "../static/js/game/tracks.js";

const rate = 22050,
  directory = "artifacts/qa/audio";
mkdirSync(directory, { recursive: true });
const report = [],
  stress = process.argv.includes("--stress");
for (const track of stress
  ? [TRACKS[2], ...TRACKS.filter((track) => track.bell)]
  : TRACKS) {
  const duration = stress ? 8 : (64 * 60) / track.bpm / 2 + 2,
    frames = Math.ceil(duration * rate);
  const offline = new OfflineAudioContext(2, frames, rate);
  let clock = 0,
    tick;
  const context = new Proxy(offline, {
    get(target, key) {
      if (key === "currentTime") return clock;
      if (key === "resume" || key === "suspend") return async () => {};
      const value = Reflect.get(target, key, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  const elements = new Map();
  function element(id) {
    if (!elements.has(id))
      elements.set(id, {
        value: id === "volume" ? (stress ? "100" : "35") : "",
        style: {},
        classList: { toggle() {} },
        setAttribute() {},
        addEventListener() {},
        replaceChildren() {},
      });
    return elements.get(id);
  }
  globalThis.document = {
    hidden: false,
    documentElement: { dataset: { motion: "off" } },
    getElementById: element,
    querySelector: () => element("radio"),
    querySelectorAll: () => [],
    createElement: () => ({}),
    addEventListener() {},
  };
  globalThis.window = {
    AudioContext: function () {
      return context;
    },
    addEventListener() {},
  };
  globalThis.sessionStorage = { getItem: () => null, setItem() {} };
  globalThis.setInterval = (fn) => {
    tick = fn;
    return 1;
  };
  globalThis.clearInterval = () => {};
  const audio = createAudio({
    say: (message) => {
      throw Error(message);
    },
    button: element("sound"),
  });
  audio.setTrack(track.id);
  if (stress) audio.setAtmosphere({ pressure: 3, lampMode: true });
  await audio.toggleSound();
  if (!tick) throw Error(`No scheduler for ${track.id}`);
  for (clock = 0.1; clock < duration - 2; clock += 0.1) {
    tick();
    if (stress) {
      audio.note(180, 0.4);
      audio.note(520, 0.4);
      audio.note(320, 0.4);
    }
  }
  const rendered = await offline.startRendering();
  const channels = [new Float32Array(frames), new Float32Array(frames)];
  channels.forEach((data, index) => rendered.copyFromChannel(data, index));
  let peak = 0,
    sum = 0,
    clipped = 0;
  const wav = Buffer.alloc(44 + frames * 4);
  wav.write("RIFF");
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(2, 22);
  wav.writeUInt32LE(rate, 24);
  wav.writeUInt32LE(rate * 4, 28);
  wav.writeUInt16LE(4, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(frames * 4, 40);
  for (let i = 0; i < frames; i++)
    for (let channel = 0; channel < 2; channel++) {
      const value = channels[channel][i];
      if (!Number.isFinite(value)) throw Error(`Invalid sample in ${track.id}`);
      peak = Math.max(peak, Math.abs(value));
      sum += value * value;
      if (Math.abs(value) >= 1) clipped++;
      wav.writeInt16LE(
        Math.round(Math.max(-1, Math.min(1, value)) * 32767),
        44 + (i * 2 + channel) * 2,
      );
    }
  const rms = Math.sqrt(sum / (frames * 2));
  if (peak < 0.001 || clipped)
    throw Error(
      `Invalid audio level: ${track.id}, peak ${peak}, clipping ${clipped}`,
    );
  writeFileSync(`${directory}/${stress ? "stress-" : ""}${track.id}.wav`, wav);
  const entry = {
    track: track.id,
    duration: Math.round(duration * 10) / 10,
    peakDb: Math.round(20 * Math.log10(peak) * 10) / 10,
    rmsDb: Math.round(20 * Math.log10(rms) * 10) / 10,
    clipped,
  };
  report.push(entry);
  console.log(entry);
}
writeFileSync(
  `${directory}/${stress ? "stress-levels" : "levels"}.json`,
  JSON.stringify(report, null, 2),
);
