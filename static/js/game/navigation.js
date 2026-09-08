import { MAP, roomObjects, rooms } from "./config.js";
export const WALK_SPEED = 3.6;
export function blocked(state, x, z) {
  if (
    Math.abs(x) > MAP.halfWidth - MAP.margin ||
    Math.abs(z) > MAP.halfDepth - MAP.margin
  )
    return true;
  return roomObjects(state).some(
    (o) =>
      o.solid &&
      Math.abs(x - o.x) < o.w / 2 + MAP.margin &&
      Math.abs(z - o.z) < o.d / 2 + MAP.margin,
  );
}
export function movePlayer(state, dx, dz, dt) {
  const length = Math.hypot(dx, dz);
  if (!length) return;
  const distance = Math.min(Math.max(0, dt), 0.1) * WALK_SPEED,
    steps = Math.max(1, Math.ceil(distance / 0.1));
  const xStep = ((dx / length) * distance) / steps,
    zStep = ((dz / length) * distance) / steps;
  for (let i = 0; i < steps; i++) {
    if (!blocked(state, state.player.x + xStep, state.player.z))
      state.player.x += xStep;
    if (!blocked(state, state.player.x, state.player.z + zStep))
      state.player.z += zStep;
  }
}
export function proximity(player, o) {
  return Math.hypot(
    Math.max(0, Math.abs(player.x - o.x) - o.w / 2),
    Math.max(0, Math.abs(player.z - o.z) - o.d / 2),
  );
}
export function nearby(state) {
  return (
    roomObjects(state)
      .filter((o) => o.label && proximity(state.player, o) < 1)
      .sort(
        (a, b) => proximity(state.player, a) - proximity(state.player, b),
      )[0] ?? null
  );
}
export function travel(state, direction) {
  state.world = (state.world + direction + rooms.length) % rooms.length;
  state.player.x = direction > 0 ? -16.3 : 16.3;
  state.player.z = 0;
  state.cameraX = state.player.x;
  state.activeObject = null;
  state.wasMoving = false;
  state.waypoints = [];
  state.pendingAction = null;
  state.walkTarget = null;
  state.transition = state.quiet ? 0 : 0.3;
  return rooms[state.world].name;
}
export function checkExit(state) {
  if (Math.abs(state.player.z) > 0.8) return false;
  if (state.player.x > 17.25) {
    travel(state, 1);
    return true;
  }
  if (state.player.x < -17.25) {
    travel(state, -1);
    return true;
  }
  return false;
}
