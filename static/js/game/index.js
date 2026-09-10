import { setupInput } from "./input.js";
import { navigateTo } from "../page-transitions.js";
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
state.directControl = Boolean(document.getElementById("stage-panel"));
state.waypoints = [];state.pendingAction = state.walkTarget = null;
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
$("signal-status").textContent = "ON";
state.showHint = (text) => show("NPC", text, "TELEMERA");

const { project, unproject, render } = createRenderer(canvas, state);
const { note, toggleSound, setTrack, onTrackChange, setAtmosphere } =
  createAudio({
    say,
    button: $("sound"),
  });
if (!document.getElementById("stage-panel")) setupDevices({
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
  if (object && !state.directControl) {
    const dx = object.x - state.player.x,
      dz = object.z - state.player.z;
    if (Math.hypot(dx, dz) > 0.001) state.player.heading = Math.atan2(dz, dx);
    if (object.kind !== "door") state.player.reach = 1;
  }
  note(440);
  if (state.onInspect?.(id)) return;
  if (object?.id.startsWith("wall-")) {
    const key = `${state.world}:${id}`;
    state.apparatus[key] = !state.apparatus[key];
    return;
  }
  if (id === "computer") {
    saveSession();
    navigateTo("/records");
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
    if (equipment.gamesLink) { saveSession(); navigateTo("/games"); }
  }
  if (id === "sign")
    show("조작", ROOM_MEMOS[state.world], "CONTROLS");
}

function updateRoom() {

  $("world-number").textContent = `AREA 0${state.world + 1}`;
  $("world-name").textContent = palettes[state.world].name;
  say("");
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
  say("");
}
function interact() {
  if (!state.powered) return;
  if (state.activeObject) activate(state.activeObject.id);
  else say("E / 클릭: 작동");
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
  if (dialog.open || !state.powered || state.videoActive || state.introActive) return;
  const point = pointerPosition(e),
    object = objectAtPoint(point),
    target = object ?? unproject(point.x, point.y);
  if(state.directControl) {
    if(object?.pickKind === "object") activate(object.id);
    else if(object?.pickKind === "fragment") {state.gems[Number(object.id.split("-")[1])].taken=true;say("기록 조각 회수");}
    return;
  }
  if (object?.pickKind === "object" && proximity(state.player, object) < 1) {
    activate(object.id);
    return;
  }
  if (!clickIntent(state, target, object))
    say("");
});
function frame(now) {
  const dt = state.last ? Math.min((now - state.last) / 1000, 0.04) : 0;
  state.last = now;
  if (!state.directControl && !document.hidden && !dialog.open && state.powered && !state.introActive && !state.videoActive) {
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

      }
    }
    if (now > state.captionUntil) {
      const caption = state.activeObject ? "E / 클릭: 작동" : "";
      if ($("scene-caption").textContent !== caption)
        $("scene-caption").textContent = caption;
    }
    state.cameraX += (state.player.x - state.cameraX) * (1 - Math.exp(-dt * 8));
    state.transition = Math.max(0, state.transition - dt);
    state.wasMoving = moving;
  } else if (!document.hidden) {
    advanceLocomotion(state.player, state.player.x, state.player.z, dt);
    state.wasMoving = false;
  }
  if(state.directControl) {
    state.activeObject=roomObjects(state).find(o=>o.id===state.hoverObject)??null;
    if(now>state.captionUntil) $("scene-caption").textContent=state.activeObject?.label??"장치를 클릭해 조사·조작하세요";
    state.transition=Math.max(0,state.transition-dt);
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
say("");
requestAnimationFrame(frame);

export { frame, activate, resetExploration };
