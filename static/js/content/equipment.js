import { EQUIPMENT } from "./archive.js";
export function inspectEquipment(id, state) {
  if (!Object.hasOwn(EQUIPMENT, id)) return null;
  if (!state.discovered.includes(id)) state.discovered.push(id);
  const result = { title: EQUIPMENT[id], text: "", gamesLink: false, track: null };
  switch (id) {
    case "mail-tube": state.letterSent = !state.letterSent; break;
    case "postmaster": result.gamesLink = true; break;
    case "observer": state.eyeAwake = !state.eyeAwake; break;
    case "organ": state.pressure = ((state.pressure ?? 0) + 1) % 4; break;
    case "chair": state.chairOccupied = !state.chairOccupied; break;
    case "dream-spool": result.track = "paper"; break;
    case "sleep-terminal": state.monitorAwake = !state.monitorAwake; break;
  }
  return result;
}
export const ROOM_MEMOS = Array(4).fill("WASD / 방향키: 이동\n클릭: 이동 및 작동\nE: 가까운 오브젝트 작동\n좌우 출입구: 구역 이동");
