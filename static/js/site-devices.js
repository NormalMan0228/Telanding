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
        "보조 회선 연결. 보관함의 디스크가 반응한다.";
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
      ? "화면 안쪽에서 누군가 안도의 한숨을 쉰다."
      : "영상 회선이 빠졌다. 플러그를 다시 꽂을 수 있다.";
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
    $("device-status").textContent = [
      "관 안쪽은 조용하다.",
      "기계가 잠에서 깨어났다.",
      "다른 쪽에서도 밸브를 돌리는 소리가 난다.",
      "압력 정상. 정상이라는 말이 조금 수상하다.",
    ][state.pressure];
    update();
  });
  $("receiver")?.addEventListener("click", () => {
    calls++;
    state.phoneRings = calls;
    note(480, 0.2);
    show(
      "번호 없는 내선",
      [
        "“안녕하세요. 오늘은 어느 꿈을 수리하러 오셨나요?”\n\n수화기 안에서 아주 작은 팬이 돌아간다.",
        "“화면 바깥의 밸브요. 세 번째 칸에 맞춰 주세요. 원래는 두 칸짜리였는데.”",
        "“여긴 게임이 되기 전의 이야기들이 기다리는 곳이에요. 새 소식은 보관함을 열어 보세요.”",
        "“아직 계시네요. 다행이다.”\n\n통화가 끝났는데도 누군가 손을 흔든다.",
      ][(calls - 1) % 4],
      "EXT. 000 / CONNECTED",
    );
  });
  $("printer-button")?.addEventListener("click", () => {
    printed++;
    note(260, 0.08);
    $("paper-ticket").hidden = false;
    $("ticket-number").textContent = `NO. ${String(printed).padStart(3, "0")}`;
    $("ticket-message").textContent = [
      "기억의 유통기한을 확인할 수 없습니다.",
      "작은 기계에게 이름을 지어 주지 마세요. 정이 듭니다.",
      "출시 소식: 아직 도착하지 않았습니다.",
      "오늘의 처방: 이상한 것을 하나 더 눌러 볼 것.",
    ][(printed - 1) % 4];
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
      ? "누군가 당신 대신 눈을 깜박였다."
      : "관찰자가 잠깐 눈을 감았다.";
    note(120, 0.4);
    update();
  });
  document.querySelectorAll("[data-release-disc]").forEach((disc) =>
    disc.addEventListener("click", () => {
      note(320, 0.3);
      show(
        state.signalRecovered
          ? "수신인: 다음 방문자"
          : "아직 쓰이지 않은 디스크",
        state.signalRecovered
          ? "보조 회선으로 작은 쪽지가 도착했다.\n\n“여기까지 와 줘서 고마워.\n다음에는 우리 게임 안에서 만나자.”\n\n— Telemera\n\n공개된 게임 소식은 보관함에서 확인할 수 있다."
          : "아직 게임이 기록되지 않은 디스크다.\n표지에는 Telemera라고 적혀 있다.\n\n출시 소식과 새 영상이 도착하면 보관함에 남겨 둔다.",
        "A: / NEXT SIGNAL",
        true,
      );
    }),
  );
  $("ticket-close")?.addEventListener("click", () => {
    $("paper-ticket").hidden = true;
    $("printer-button").focus();
  });
  update();
}
