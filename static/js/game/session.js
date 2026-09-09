import { blocked } from "./navigation.js";
import { MAP, palettes, rooms } from "./config.js";
import { EQUIPMENT } from "../content/archive.js";
const KEY = "telemera.explorer.v2";
export function persistSession(s) {
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({
        player: s.player,
        angle: s.angle,
        world: s.world,
        taken: s.gems.map((g) => g.taken),
        quiet: s.quiet,
        pressure: s.pressure,
        lampMode: s.lampMode,
        eyeAwake: s.eyeAwake,
        discovered: s.discovered,
        signalRecovered: s.signalRecovered,
        monitorAwake: s.monitorAwake,
        chairOccupied: s.chairOccupied,
        letterSent: s.letterSent,
        apparatus: s.apparatus,
      }),
    );
  } catch {}
}
export function restoreSession(s) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY));
    if (!saved) return;
    if (Number.isFinite(saved.player?.x) && Number.isFinite(saved.player?.z)) {
      s.player.x = Math.max(
        -MAP.halfWidth + MAP.margin,
        Math.min(MAP.halfWidth - MAP.margin, saved.player.x),
      );
      s.player.z = Math.max(
        -MAP.halfDepth + MAP.margin,
        Math.min(MAP.halfDepth - MAP.margin, saved.player.z),
      );
    }
    if (Number.isFinite(saved.player?.heading))
      s.player.heading = saved.player.heading;
    if (Number.isFinite(saved.angle)) s.angle = saved.angle;
    if (
      Number.isInteger(saved.world) &&
      saved.world >= 0 &&
      saved.world < palettes.length
    )
      s.world = saved.world;
    if (Array.isArray(saved.taken) && saved.taken.length === s.gems.length)
      s.gems.forEach((g, i) => (g.taken = saved.taken[i] === true));
    if (blocked(s, s.player.x, s.player.z)) {
      s.player.x = -16.3;
      s.player.z = 0;
    }
    if (typeof saved.quiet === "boolean") s.quiet = s.quiet || saved.quiet;
    if (
      Number.isInteger(saved.pressure) &&
      saved.pressure >= 0 &&
      saved.pressure <= 3
    )
      s.pressure = saved.pressure;
    for (const flag of [
      "lampMode",
      "eyeAwake",
      "signalRecovered",
      "monitorAwake",
      "chairOccupied",
      "letterSent",
    ])
      if (typeof saved[flag] === "boolean") s[flag] = saved[flag];
    if (Array.isArray(saved.discovered))
      s.discovered = [
        ...new Set(
          saved.discovered.filter((id) => Object.hasOwn(EQUIPMENT, id)),
        ),
      ];
    for (const [world, room] of rooms.entries())
      for (const o of room.objects.filter((o) => o.id.startsWith("wall-"))) {
        const key = `${world}:${o.id}`;
        if (typeof saved.apparatus?.[key] === "boolean")
          s.apparatus[key] = saved.apparatus[key];
      }
  } catch {}
}
