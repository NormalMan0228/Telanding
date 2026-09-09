import { TRACKS, hz, eventFor } from "./tracks.js";
const PREFS = "telemera.audio.v1";
const OUTPUT_GAIN = 5.5;
/** Original score, scheduled on the audio clock. No autoplay or network audio. */
export function createAudio({ say, button, fixedTrack = null }) {
  let audio, master, filter, room, wet, noise, analyser, spectrum;
  let pressure = 0,
    violet = false;
  let playing = false,
    trackIndex = 0,
    step = 0,
    nextAt = 0,
    timer = null,
    elapsed = 0,
    lastClock = 0,
    busy = false;
  const voices = new Set(),
    subscribers = new Set(),
    $ = (id) => document.getElementById(id);
  const select = $("track-select"),
    volume = $("volume"),
    time = $("audio-time"),
    label = $("track-mood");
  const bars = [...(document.querySelectorAll?.(".signal-track i") ?? [])];
  try {
    const saved = JSON.parse(sessionStorage.getItem(PREFS)),
      index = TRACKS.findIndex((t) => t.id === saved?.track);
    if (index >= 0) trackIndex = index;
    if (volume && Number.isFinite(saved?.volume))
      volume.value = String(Math.max(0, Math.min(100, saved.volume)));
  } catch {}
  if (fixedTrack) {
    const fixedIndex = TRACKS.findIndex(t => t.id === fixedTrack);
    if (fixedIndex >= 0) trackIndex = fixedIndex;
  }
  function remember() {
    if (fixedTrack) return;
    try {
      sessionStorage.setItem(
        PREFS,
        JSON.stringify({
          track: TRACKS[trackIndex].id,
          volume: Number(volume?.value ?? 35),
        }),
      );
    } catch {}
  }
  function update() {
    button.textContent = playing ? "Ⅱ PAUSE" : "▶ PLAY";
    button.setAttribute("aria-pressed", String(playing));
    document
      .querySelector(".radio-player")
      ?.classList.toggle("is-playing", playing);
    if (select) select.value = TRACKS[trackIndex].id;
    if (label) label.textContent = TRACKS[trackIndex].mood;
    subscribers.forEach((listener) => listener(TRACKS[trackIndex], playing));
    if (!playing) bars.forEach((bar) => (bar.style.height = "2px"));
  }
  if (select) {
    select.replaceChildren?.(
      ...TRACKS.map((t) => {
        const option = document.createElement("option");
        option.value = t.id;
        option.textContent = t.title;
        return option;
      }),
    );
    select.addEventListener("change", () => setTrack(select.value));
  }
  function connectVoice(source, gain, start, duration) {
    source.connect(gain);
    gain.connect(filter);
    voices.add(source);
    source.onended = () => {
      voices.delete(source);
      source.disconnect();
      gain.disconnect();
    };
    source.start(start);
    source.stop(start + duration + 0.03);
  }
  function voice(
    frequency,
    start,
    duration,
    level,
    wave = "triangle",
    attack = 0.025,
  ) {
    if (!audio || !master) return;
    const osc = audio.createOscillator(),
      gain = audio.createGain();
    osc.type = wave;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, level),
      start + Math.min(attack, duration * 0.4),
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    connectVoice(osc, gain, start, duration);
  }
  function percussion(kind, start) {
    if (kind === "kick") {
      const source = audio.createOscillator(),
        gain = audio.createGain();
      source.type = "sine";
      source.frequency.setValueAtTime(115, start);
      source.frequency.exponentialRampToValueAtTime(38, start + 0.16);
      gain.gain.setValueAtTime(0.065, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      connectVoice(source, gain, start, 0.23);
      return;
    }
    const source = audio.createBufferSource(),
      gain = audio.createGain();
    source.buffer = noise;
    const duration = kind === "snare" ? 0.12 : 0.035;
    gain.gain.setValueAtTime(kind === "snare" ? 0.012 : 0.005, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    connectVoice(source, gain, start, duration);
  }
  function buildGraph() {
    master = audio.createGain();
    master.gain.value = (Number(volume?.value ?? 35) / 100) * OUTPUT_GAIN;
    filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = TRACKS[trackIndex].tone * (0.8 + pressure * 0.15);
    filter.connect(master);
    analyser = audio.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.75;
    spectrum = new Uint8Array(analyser.frequencyBinCount);
    const limiter = audio.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 10;
    limiter.ratio.value = 8;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.18;
    // Compressors can overshoot during stacked clicks; this soft ceiling keeps headroom.
    const ceiling = audio.createWaveShaper(),
      curve = new Float32Array(4097);
    for (let i = 0; i < curve.length; i++) {
      const x = (i / (curve.length - 1)) * 2 - 1;
      curve[i] = 0.94 * Math.tanh(x / 0.94);
    }
    ceiling.curve = curve;
    ceiling.oversample = "2x";
    master.connect(limiter);
    limiter.connect(ceiling);
    ceiling.connect(analyser);
    analyser.connect(audio.destination);
    // A small dark room, not an endless wash: deterministic stereo impulse response.
    room = audio.createConvolver();
    wet = audio.createGain();
    wet.gain.value = violet ? 0.29 : 0.17;
    const length = Math.floor(audio.sampleRate * 1.6),
      impulse = audio.createBuffer(2, length, audio.sampleRate);
    let seed = 317;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return (seed / 4294967296) * 2 - 1;
    };
    for (let channel = 0; channel < 2; channel++) {
      const data = new Float32Array(length);
      for (let i = 0; i < length; i++)
        data[i] = random() * (1 - i / length) ** 3 * 0.4;
      impulse.copyToChannel(data, channel);
    }
    room.buffer = impulse;
    filter.connect(room);
    room.connect(wet);
    wet.connect(master);
    noise = audio.createBuffer(
      1,
      Math.floor(audio.sampleRate * 0.2),
      audio.sampleRate,
    );
    const data = new Float32Array(noise.length);
    for (let i = 0; i < data.length; i++) data[i] = random();
    noise.copyToChannel(data, 0);
  }
  function note(freq, duration = 0.16, level = 0.035) {
    if (playing) voice(freq, audio.currentTime, duration, level, "triangle");
  }
  function schedule() {
    if (!playing || document.hidden) return;
    const track = TRACKS[trackIndex],
      beat = 60 / track.bpm / 2;
    if (nextAt < audio.currentTime - 0.2) nextAt = audio.currentTime + 0.02;
    while (nextAt < audio.currentTime + 0.24) {
      const event = eventFor(track, step);
      if (event.bass !== null)
        voice(hz(event.bass), nextAt, beat * 3.8, 0.065, "sine", 0.06);
      if (event.lead !== null) {
        if (track.bell) {
          for (const [ratio, level, decay] of [
            [1, 0.034, 2.8],
            [2.01, 0.008, 1.2],
            [3.99, 0.002, 0.55],
          ])
            voice(
              hz(event.lead) * ratio,
              nextAt,
              beat * decay,
              level,
              "sine",
              0.008,
            );
        } else
          voice(
            hz(event.lead),
            nextAt,
            beat * 1.7,
            track.wave === "square" ? 0.014 : 0.04,
            track.wave,
          );
      }
      event.chord.forEach((m, i) =>
        voice(hz(m), nextAt + i * 0.045, beat * 12, 0.012, "sine", 0.3),
      );
      if (event.percussion) percussion(event.percussion, nextAt);
      step++;
      nextAt += beat;
    }
    elapsed += Math.max(0, audio.currentTime - lastClock);
    lastClock = audio.currentTime;
    if (document.documentElement?.dataset.motion !== "off") {
      analyser.getByteFrequencyData(spectrum);
      bars.forEach((bar, i) => {
        bar.style.height = `${2 + (spectrum[Math.min(spectrum.length - 1, Math.round(i * 0.9))] / 255) * 16}px`;
      });
    }
    if (time)
      time.textContent = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(Math.floor(elapsed) % 60).padStart(2, "0")}`;
  }
  function clearVoices() {
    voices.forEach((v) => {
      try {
        v.stop();
      } catch {}
    });
    voices.clear();
  }
  function setTrack(id) {
    if (fixedTrack && id !== fixedTrack) return;
    const index = TRACKS.findIndex((t) => t.id === id);
    if (index < 0) return false;
    trackIndex = index;
    step = 0;
    elapsed = 0;
    if (time) time.textContent = "00:00";
    clearVoices();
    if (audio) {
      nextAt = audio.currentTime + 0.03;
      lastClock = audio.currentTime;
      filter.frequency.setTargetAtTime(
        TRACKS[index].tone * (0.8 + pressure * 0.15),
        audio.currentTime,
        0.1,
      );
    }
    update();
    remember();
    if (playing) schedule();
    return true;
  }
  async function toggleSound() {
    if (busy) return;
    busy = true;
    try {
      if (playing) {
        playing = false;
        clearInterval(timer);
        timer = null;
        clearVoices();
        await audio.suspend();
      } else {
        audio ??= new (window.AudioContext || window.webkitAudioContext)();
        if (!master) buildGraph();
        await audio.resume();
        playing = true;
        nextAt = audio.currentTime + 0.03;
        lastClock = audio.currentTime;
        schedule();
        timer = setInterval(schedule, 100);
      }
      update();
    } catch {
      playing = false;
      clearInterval(timer);
      timer = null;
      clearVoices();
      update();
      say("오디오 장치가 응답하지 않는다. 다시 눌러 보자.");
    } finally {
      busy = false;
    }
  }
  volume?.addEventListener("input", () => {
    if (master)
      master.gain.setTargetAtTime(
        (Number(volume.value) / 100) * OUTPUT_GAIN,
        audio.currentTime,
        0.04,
      );
    remember();
  });
  $("track-prev")?.addEventListener("click", () =>
    setTrack(TRACKS[(trackIndex - 1 + TRACKS.length) % TRACKS.length].id),
  );
  $("track-next")?.addEventListener("click", () =>
    setTrack(TRACKS[(trackIndex + 1) % TRACKS.length].id),
  );
  document.addEventListener("visibilitychange", async () => {
    if (!audio) return;
    try {
      if (document.hidden) {
        clearVoices();
        await audio.suspend();
      } else if (playing) {
        await audio.resume();
        nextAt = audio.currentTime + 0.03;
        lastClock = audio.currentTime;
        schedule();
      }
    } catch {
      playing = false;
      clearInterval(timer);
      update();
    }
  });
  window.addEventListener("pagehide", () => {
    playing = false;
    clearInterval(timer);
    clearVoices();
    audio?.suspend().catch(() => {});
    remember();
    update();
  });
  update();
  return {
    note,
    toggleSound,
    setTrack,
    setAtmosphere(state) {
      pressure = Math.max(0, Math.min(3, Number(state.pressure) || 0));
      violet = Boolean(state.lampMode);
      if (audio && filter) {
        filter.frequency.setTargetAtTime(
          TRACKS[trackIndex].tone * (0.8 + pressure * 0.15),
          audio.currentTime,
          0.15,
        );
        wet.gain.setTargetAtTime(violet ? 0.29 : 0.17, audio.currentTime, 0.2);
      }
    },
    onTrackChange(listener) {
      subscribers.add(listener);
      listener(TRACKS[trackIndex], playing);
      return () => subscribers.delete(listener);
    },
    getState: () => ({ playing, track: TRACKS[trackIndex].id }),
  };
}
