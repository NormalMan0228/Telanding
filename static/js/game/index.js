import { setupInput } from "./input.js";
import { loadBackdrops } from "./backdrops.js";
import { canvasSize, worldUnit } from "./viewport.js";
import { createDialog } from "./dialog.js";
import { inspectEquipment, ROOM_MEMOS } from "../content/equipment.js";
import { setupDevices } from "../site-devices.js";
import { clickIntent, walkRoute } from "./pathfinding.js";
import { pickTarget } from "./picking.js";
import {
  movePlayer,
  nearby,
  checkExit,
  travel,
  proximity,
} from "./navigation.js";
import { advanceLocomotion } from "./character.js";
import { palettes, roomObjects, createState } from "./config.js";
import { createRenderer } from "./renderer.js";
import { createAudio } from "./audio.js";
import { restoreSession, persistSession } from "./session.js";
const canvas = document.querySelector("#world");
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const size = canvasSize(rect);
  if (!size) return;
  canvas.width = size.width;
  canvas.height = size.height;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);
const $ = (id) => document.getElementById(id);
export const state = createState();
restoreSession(state);
state.angle = 0;
state.cameraX = state.player.x;
const { show, element: dialog } = createDialog({
  canvas,
  onOpen() {
    input.clear();
    state.waypoints = [];
    state.pendingAction = null;
    state.walkTarget = null;
  },
});
const backdrops = loadBackdrops(
  state,
  (status) => ($("signal-status").textContent = status),
);

const { project, unproject, render } = createRenderer(canvas, state);
const { note, toggleSound, setTrack, onTrackChange, setAtmosphere } =
  createAudio({
    say,
    button: $("sound"),
  });
setupDevices({
  state,
  show,
  note,
  setTrack,
  onTrackChange,
  setAtmosphere,
  setPower,
});
function setPower(powered) {
  state.powered = powered;
  input.clear();
  state.waypoints = [];
  state.pendingAction = null;
  state.walkTarget = null;
  $("signal-loss").hidden = powered;
  canvas.setAttribute("aria-disabled", String(!powered));
  $("interact").disabled = !powered;
  document
    .querySelectorAll("[data-move]")
    .forEach((button) => (button.disabled = !powered));
  state.transition = state.quiet ? 0 : 0.35;
  state.last = 0;
  if (powered) canvas.focus({ preventScroll: true });
}
function saveSession() {
  persistSession(state);
}
window.addEventListener("pagehide", saveSession);
$("collected").textContent = state.gems.filter((g) => g.taken).length;
$("world-number").textContent = `WARD 0${state.world + 1}`;
$("world-name").textContent = palettes[state.world].name;
function say(message) {
  $("scene-caption").textContent = message;
  state.captionUntil = performance.now() + 4000;
}
$("sound").onclick = toggleSound;
function setMotion() {
  document.documentElement.dataset.motion = state.quiet ? "off" : "on";
  $("motion").textContent = state.quiet ? "≈ MOTION OFF" : "≈ MOTION ON";
  $("motion").setAttribute("aria-pressed", String(state.quiet));
}
setMotion();
$("motion").onclick = () => {
  state.quiet = !state.quiet;
  setMotion();
};
function activate(id) {
  const object = roomObjects(state).find((item) => item.id === id);
  if (object) {
    const dx = object.x - state.player.x,
      dz = object.z - state.player.z;
    if (Math.hypot(dx, dz) > 0.001) state.player.heading = Math.atan2(dz, dx);
    if (object.kind !== "door") state.player.reach = 1;
  }
  note(440);
  if (id === "computer") {
    saveSession();
    location.assign("/records");
  }
  if (id === "radio") toggleSound();
  if (id === "exit-right" || id === "exit-left") {
    travel(state, id === "exit-left" ? -1 : 1);
    updateRoom();
    saveSession();
  }
  const equipment = inspectEquipment(id, state);
  if (equipment) {
    if (equipment.track) setTrack(equipment.track);
    show(
      equipment.title,
      equipment.text,
      "TELEMERA / UNREGISTERED EQUIPMENT",
      equipment.gamesLink,
    );
  }
  if (id === "sign")
    show("당직자에게", ROOM_MEMOS[state.world], "NIGHT SHIFT / MEMO");
}

function updateRoom() {
  backdrops.refresh();
  $("world-number").textContent = `AREA 0${state.world + 1}`;
  $("world-name").textContent = palettes[state.world].name;
  say(
    "문을 지나 " + palettes[state.world].name.split(" / ")[1] + "에 도착했다.",
  );
}
function resetExploration() {
  state.player.x = -14;
  state.player.z = 0;
  state.player.heading = 0;
  state.player.gait = 0;
  state.gems.forEach((g) => (g.taken = false));
  $("collected").textContent = "0";
  state.angle = 0;
  state.world = 0;
  state.cameraX = state.player.x;
  $("world-number").textContent = "WARD 01";
  $("world-name").textContent = palettes[0].name;
  say("세션 초기화. 접속자는 여전히 한 명.");
}
function interact() {
  if (!state.powered) return;
  if (state.activeObject) activate(state.activeObject.id);
  else say("가까이 가서 테두리가 빛나는 물건을 눌러 봐.");
}
$("interact").onclick = interact;
const input = setupInput({ canvas, state, interact });
function pointerPosition(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) * canvas.width) / r.width,
    y: ((e.clientY - r.top) * canvas.height) / r.height,
  };
}
function objectAtPoint(point) {
  return pickTarget(state, project, point, worldUnit(canvas.width));
}
canvas.addEventListener("pointermove", (e) => {
  state.hoverObject = objectAtPoint(pointerPosition(e))?.id ?? null;
  canvas.style.cursor = state.hoverObject ? "pointer" : "";
});
canvas.addEventListener("pointerleave", () => (state.hoverObject = null));
canvas.addEventListener("click", (e) => {
  canvas.focus({ preventScroll: true });
  if (dialog.open || !state.powered) return;
  const point = pointerPosition(e),
    object = objectAtPoint(point),
    target = object ?? unproject(point.x, point.y);
  if (object?.pickKind === "object" && proximity(state.player, object) < 1) {
    activate(object.id);
    return;
  }
  if (!clickIntent(state, target, object))
    say("그쪽으로는 갈 수 없다. 다른 쪽을 눌러 보자.");
});
function frame(now) {
  const dt = state.last ? Math.min((now - state.last) / 1000, 0.04) : 0;
  state.last = now;
  if (!document.hidden && !dialog.open && state.powered) {
    let dx = 0,
      dz = 0;
    if (state.keys.has("ArrowUp") || state.keys.has("w")) dz--;
    if (state.keys.has("ArrowDown") || state.keys.has("s")) dz++;
    if (state.keys.has("ArrowLeft") || state.keys.has("a")) dx--;
    if (state.keys.has("ArrowRight") || state.keys.has("d")) dx++;
    let moving = false;
    const previousX = state.player.x,
      previousZ = state.player.z;
    if (dx || dz) movePlayer(state, dx, dz, dt);
    else walkRoute(state, dt);
    moving = advanceLocomotion(state.player, previousX, previousZ, dt);
    if (checkExit(state)) {
      state.waypoints = [];
      state.pendingAction = null;
      state.walkTarget = null;
      updateRoom();
      saveSession();
      moving = false;
    }
    state.activeObject = nearby(state);
    if (state.pendingAction && !state.waypoints?.length) {
      const target = roomObjects(state).find(
        (o) => o.id === state.pendingAction,
      );
      state.pendingAction = null;
      state.walkTarget = null;
      if (target && proximity(state.player, target) < 1) activate(target.id);
    }
    if (!state.waypoints?.length) state.walkTarget = null;
    const actionLabel = state.activeObject
      ? state.activeObject.label
      : "가까운 오브젝트 살펴보기";
    const actionText = $("interact").querySelector("span");
    if (actionText.textContent !== actionLabel)
      actionText.textContent = actionLabel;
    for (const g of state.gems) {
      if (
        g.room === state.world &&
        !g.taken &&
        Math.hypot(g.x - state.player.x, g.z - state.player.z) < 0.65
      ) {
        g.taken = true;
        const count = state.gems.filter((g) => g.taken).length;
        $("collected").textContent = count;
        note(170 + count * 20, 0.25);
        say(`기록 회수: ${count} / 5`);
        if (count === 5)
          show(
            "다음 게임에서 만나자.",
            "흩어진 기록 5개가 한 문장으로 이어졌다.\n\n“우리는 아직 만들어지는 중이야.”\n\n작은 기계가 빈 디스크를 가리킨다.\n새로운 이야기가 도착하면 보관함에 남겨 둘게.",
            "TELEMERA / NEXT SIGNAL",
            true,
          );
      }
    }
    if (now > state.captionUntil) {
      const caption = state.activeObject
        ? "E를 누르거나 물건을 클릭해 살펴보기."
        : state.hoverObject
          ? "눌러 봐. 가까이 가서 살펴볼게."
          : state.gems.some((g) => g.room === state.world && !g.taken)
            ? "종이가 남아 있어. 누가 흘렸을까."
            : state.gems.every((g) => g.taken)
              ? "기록이 다 모였어. 게임 보관함을 열어 볼까."
              : "옆방에도 무언가 있을까.";
      if ($("scene-caption").textContent !== caption)
        $("scene-caption").textContent = caption;
    }
    state.cameraX += (state.player.x - state.cameraX) * Math.min(1, dt * 8);
    state.transition = Math.max(0, state.transition - dt);
    state.wasMoving = moving;
  } else if (!document.hidden) {
    advanceLocomotion(state.player, state.player.x, state.player.z, dt);
    state.wasMoving = false;
  }
  if (!document.hidden && state.powered) {
    state.clock += state.quiet ? 0 : dt;
    for (const [property, flag, speed] of [
      ["eyeOpen", "eyeAwake", 8],
      ["pipeProgress", "letterSent", 4],
    ]) {
      const target = state[flag] ? 1 : 0;
      state[property] = state.quiet
        ? target
        : (state[property] ?? target) +
          (target - (state[property] ?? target)) * (1 - Math.exp(-dt * speed));
    }
  }
  if (!document.hidden)
    state.player.reach = Math.max(0, (state.player.reach ?? 0) - dt / 0.65);
  render(state.clock, state.wasMoving && !dialog.open);
  requestAnimationFrame(frame);
}
say("바닥이나 물건을 눌러 봐. 내가 다가갈게.");
requestAnimationFrame(frame);

export { frame, activate, resetExploration };
