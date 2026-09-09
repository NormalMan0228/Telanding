/** Page machinery and the game share a state; these are physical-looking controls, not decoration. */
import { TRACKS } from "./game/tracks.js";
export function setupDevices({
  state,
  show,
  note,
  setTrack,
  onTrackChange,
  setAtmosphere,
  setPower,
}) {
  const $ = (id) => document.getElementById(id);
  const eye = $("observer-eye");
  document.addEventListener(
    "pointermove",
    (event) => {
      if (!state.eyeAwake || state.quiet || event.pointerType === "touch")
        return;
      const bounds = eye.getBoundingClientRect();
      if (bounds.bottom < 0 || bounds.top > window.innerHeight) return;
      const dx = event.clientX - bounds.left - bounds.width / 2;
      const dy = event.clientY - bounds.top - bounds.height / 2;
      const distance = Math.max(120, Math.hypot(dx, dy));
      eye.style.setProperty("--look-x", `${(dx / distance) * 12}px`);
      eye.style.setProperty("--look-y", `${(dy / distance) * 5}px`);
    },
    { passive: true },
  );
  let calls = 0,
    printed = 0;
  const update = () => {
    setAtmosphere?.(state);
    document.documentElement.dataset.lamp = state.lampMode ? "violet" : "green";
    $("lamp-switch")?.setAttribute(
      "aria-pressed",
      String(Boolean(state.lampMode)),
    );
    $("observer-eye")?.setAttribute(
      "aria-pressed",
      String(Boolean(state.eyeAwake)),
    );
    $("observer-eye")?.classList.toggle("awake", Boolean(state.eyeAwake));
    $("pressure-value").textContent = `${state.pressure ?? 0} / 3`;
    $("pressure-valve").style.setProperty(
      "--turn",
      `${(state.pressure ?? 0) * 90}deg`,
    );
    $("pressure-valve").setAttribute(
      "aria-label",
      `압력 밸브: ${state.pressure ?? 0}/3. 누르면 조절`,
    );
    document.querySelectorAll("[data-signal]").forEach((light) => {
      const active =
        light.dataset.signal === "eye"
          ? state.eyeAwake
          : light.dataset.signal === "pressure"
            ? state.pressure === 3
            : state.lampMode;
      light.classList.toggle("lit", Boolean(active));
    });
    if (
      state.eyeAwake &&
      state.pressure === 3 &&
      state.lampMode &&
      !state.signalRecovered
    ) {
      state.signalRecovered = true;
      $("device-status").textContent =
        "ON";
      note(520, 0.6);
    }
    document
      .querySelectorAll("[data-release-disc]")
      .forEach((disc) =>
        disc.classList.toggle("signal-found", Boolean(state.signalRecovered)),
      );
  };
  function power(powered) {
    setPower?.(powered);
    $("power-plug")?.setAttribute("aria-pressed", String(powered));
    $("power-plug")?.setAttribute(
      "aria-label",
      powered ? "영상 회선 플러그 뽑기" : "영상 회선 플러그 다시 꽂기",
    );
    $("plug-label").textContent = powered
      ? "VIDEO LINK / 연결됨"
      : "DISCONNECTED / 꽂기";
    $("device-status").textContent = powered
      ? "ON"
      : "OFF";
    note(powered ? 320 : 90, 0.2);
  }
  $("power-plug")?.addEventListener("click", () => power(!state.powered));
  $("reconnect")?.addEventListener("click", () => power(true));
  $("lamp-switch")?.addEventListener("click", () => {
    state.lampMode = !state.lampMode;
    note(180, 0.1);
    update();
  });
  $("pressure-valve")?.addEventListener("click", () => {
    state.pressure = ((state.pressure ?? 0) + 1) % 4;
    note(180 + state.pressure * 55, 0.12);
    $("device-status").textContent = `${state.pressure} / 3`;
    update();
  });
  $("receiver")?.addEventListener("click", () => {
    calls++;
    state.phoneRings = calls;
    note(480, 0.2);
    $("device-status").textContent = calls % 2 ? "ON" : "OFF";
  });
  $("printer-button")?.addEventListener("click", () => {
    printed++;
    note(260, 0.08);
    $("paper-ticket").hidden = false;
    $("ticket-number").textContent = `NO. ${String(printed).padStart(3, "0")}`;
    $("ticket-message").textContent = "";
  });
  $("tuning-dial")?.addEventListener("click", () => {
    setTrack(TRACKS[((state.tuning ?? 0) + 1) % TRACKS.length].id);
  });
  onTrackChange?.((track, playing) => {
    state.radioPlaying = Boolean(playing);
    state.tuning = TRACKS.findIndex((t) => t.id === track.id);
    $("dial-value").textContent = track.bpm.toFixed(1);
    $("tuning-dial").style.setProperty(
      "--tuning",
      `${(state.tuning * 360) / TRACKS.length}deg`,
    );
  });
  $("observer-eye")?.addEventListener("click", () => {
    state.eyeAwake = !state.eyeAwake;
    $("device-status").textContent = state.eyeAwake
      ? "ON"
      : "OFF";
    note(120, 0.4);
    update();
  });
  document.querySelectorAll("[data-release-disc]").forEach((disc) =>
    disc.addEventListener("click", () => {
      note(320, 0.3);
      show("Telemera", "", "GAMES", true);
    }),
  );
  $("ticket-close")?.addEventListener("click", () => {
    $("paper-ticket").hidden = true;
    $("printer-button").focus();
  });
  update();
}
