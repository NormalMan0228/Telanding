import { MAP } from "./config.js";
import { blocked, proximity, movePlayer, WALK_SPEED } from "./navigation.js";
const STEP = 0.35;
const key = (x, z) => `${x},${z}`;
/** Small A* grid, collision-aware and without diagonal corner cutting. */
export function findPath(state, target, object = null) {
  const start = {
    x: Math.round(state.player.x / STEP),
    z: Math.round(state.player.z / STEP),
  };
  const targetCell = {
    x: Math.round(target.x / STEP),
    z: Math.round(target.z / STEP),
  };
  const world = (n) => ({ x: n.x * STEP, z: n.z * STEP });
  const goal = (n) =>
    object
      ? proximity(world(n), object) < (object.reach ?? 0.78)
      : Math.hypot(n.x - targetCell.x, n.z - targetCell.z) <= 0.6;
  const open = [{ ...start, g: 0, f: 0 }],
    cost = new Map([[key(start.x, start.z), 0]]),
    parents = new Map(),
    closed = new Set();
  let end = null;
  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const n = open.shift(),
      id = key(n.x, n.z);
    if (closed.has(id)) continue;
    closed.add(id);
    if (goal(n) && !blocked(state, n.x * STEP, n.z * STEP)) {
      end = n;
      break;
    }
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]) {
      const next = { x: n.x + dx, z: n.z + dz },
        p = world(next),
        nextId = key(next.x, next.z);
      if (
        Math.abs(p.x) > MAP.halfWidth - MAP.margin ||
        Math.abs(p.z) > MAP.halfDepth - MAP.margin ||
        blocked(state, p.x, p.z)
      )
        continue;
      if (
        dx &&
        dz &&
        (blocked(state, n.x * STEP, p.z) || blocked(state, p.x, n.z * STEP))
      )
        continue;
      const g = n.g + Math.hypot(dx, dz);
      if (g >= (cost.get(nextId) ?? Infinity)) continue;
      cost.set(nextId, g);
      parents.set(nextId, n);
      open.push({
        ...next,
        g,
        f: g + Math.hypot(next.x - targetCell.x, next.z - targetCell.z),
      });
    }
  }
  if (!end) return null;
  const path = [];
  let n = end;
  while (n.x !== start.x || n.z !== start.z) {
    path.push(world(n));
    n = parents.get(key(n.x, n.z));
    if (!n) return null;
  }
  path.reverse();
  if (!path.length && !blocked(state, start.x * STEP, start.z * STEP))
    path.push(world(start));
  return path;
}
export function clickIntent(state, target, object = null) {
  const path = findPath(state, target, object);
  if (path === null) return false;
  state.waypoints = path;
  state.pendingAction =
    object?.pickKind === "fragment" ? null : (object?.id ?? null);
  state.walkTarget = path.at(-1) ?? null;
  return true;
}

/** Spend the entire frame's movement budget, including across tiny grid waypoints. */
export function walkRoute(state, dt) {
  let remaining = Math.min(Math.max(0, dt), 0.1);
  while (state.waypoints?.length && remaining > 0) {
    const next = state.waypoints[0],
      dx = next.x - state.player.x,
      dz = next.z - state.player.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.00001) {
      state.waypoints.shift();
      continue;
    }
    const slice = Math.min(remaining, distance / WALK_SPEED),
      before = { ...state.player };
    movePlayer(state, dx, dz, slice);
    remaining -= slice;
    if (Math.hypot(next.x - state.player.x, next.z - state.player.z) < 0.00001)
      state.waypoints.shift();
    else if (
      Math.hypot(state.player.x - before.x, state.player.z - before.z) <
      slice * WALK_SPEED * 0.9
    )
      break;
  }
}
