/** Room layouts are the single source of truth for drawing, collision and interactions. */
export const MAP = { halfWidth: 18, halfDepth: 3.5, margin: 0.24 };
const item = (id, kind, x, z, w, d, h, label) => ({
  id,
  kind,
  x,
  z,
  w,
  d,
  h,
  label,
  solid: kind !== "door",
});
const doors = () =>
  [-1, 1].map((side) => ({
    ...item(
      side < 0 ? "exit-left" : "exit-right",
      "door",
      side * 17.7,
      0,
      0.4,
      1.8,
      2.6,
      side < 0 ? "이전 구역으로" : "다음 구역으로",
    ),
    visualOffset: -side * 0.65,
    pickWidth: 1.45,
  }));
export const rooms = [
  {
    name: "01 / 눈을 빌려주는 대기실",
    wall: "#424d46",
    floor: "#35413b",
    objects: [
      item("computer", "computer", -10, -2, 1.7, 0.9, 1.6, "기록 단말기 접속"),
      item("sign", "sign", -15.4, 1.6, 0.9, 0.3, 1.2, "당직 메모"),
      item("bed-a", "bed", -5, -1.7, 1.1, 1.9, 0.85),
      item("iv-a", "iv", -3.7, -2, 0.6, 0.5, 2),
      item(
        "sleep-terminal",
        "sleep-terminal",
        2,
        -1.7,
        1.4,
        1.9,
        1.9,
        "잠든 단말기 조사",
      ),
      item("bed-c", "bed", 9, 1.8, 1.1, 1.9, 0.85),
      item("radio", "radio", 12, -2, 1.25, 0.55, 1.6, "원내 방송"),
      item("observer", "observer", -7.3, -2, 2, 1.1, 3.2, "관찰 장치 깨우기"),
      ...doors(),
    ],
  },
  {
    name: "02 / 인공 꿈 처치실",
    wall: "#514448",
    floor: "#43373a",
    objects: [
      item("sign", "sign", -13, -2, 0.9, 0.3, 1.2, "처치실 메모"),
      item("cab-a", "cabinet", -8, -2.9, 0.8, 0.55, 1.9),
      item("cab-b", "cabinet", -6.8, -2.9, 0.8, 0.55, 1.9),
      item("bed-a", "bed", -2, 0, 1.1, 1.9, 0.85),
      item("iv-a", "iv", -0.6, -0.4, 0.6, 0.5, 2),
      item("bed-b", "bed", 5, -1.8, 1.1, 1.9, 0.85),
      item("radio", "radio", 11, 2, 1.25, 0.55, 1.6, "수신기 조사"),
      item("organ", "organ", 7, -1.9, 2.4, 1.2, 3.2, "기억 배양기 조사"),
      item("chair", "chair", -11, 1.7, 1.8, 1.3, 3.1, "아무도 앉지 않은 의자"),
      ...doors(),
    ],
  },
  {
    name: "03 / 미발매 기록실",
    wall: "#3f4952",
    floor: "#303c44",
    objects: [
      ...[-10, -8, -6, 3, 5, 7].map((x, i) =>
        item("cab-" + i, "cabinet", x, -2.8, 0.8, 0.55, 1.9),
      ),
      item("computer", "computer", 0, 1.9, 1.7, 0.9, 1.6, "기록 단말기 접속"),
      item("sign", "sign", 12, -1, 0.9, 0.3, 1.2, "기록실 메모"),
      item(
        "dream-spool",
        "dream-spool",
        -2,
        -1.8,
        2.3,
        1.2,
        2.9,
        "꿈 기록기 가동",
      ),
      ...doors(),
    ],
  },
  {
    name: "04 / 수신인 없는 접수실",
    wall: "#484337",
    floor: "#303a34",
    objects: [
      item("sign", "sign", -13, 1.5, 0.9, 0.3, 1.2, "접수실 메모"),
      item(
        "mail-tube",
        "mail-tube",
        -9,
        -1.8,
        1.2,
        0.8,
        3.2,
        "공기 우편 보내기",
      ),
      item("cab-a", "cabinet", -5, -2.8, 0.8, 0.55, 1.9),
      item(
        "postmaster",
        "postmaster",
        -1,
        -1.7,
        2.4,
        1.1,
        3.2,
        "접수원에게 말 걸기",
      ),
      item("radio", "radio", 6, 1.8, 1.25, 0.55, 1.6, "접수실 방송"),
      item("computer", "computer", 11, -2, 1.7, 0.9, 1.6, "기록 단말기 접속"),
      ...doors(),
    ],
  },
];
export const palettes = rooms.map((r) => ({ name: r.name, sky: "#080d0e" }));
export const objects = rooms[0].objects;
export function roomObjects(state) {
  return rooms[state.world].objects;
}
const records = [
  { room: 0, x: -7, z: 1 },
  { room: 0, x: 6, z: 0 },
  { room: 1, x: -10, z: 1.6 },
  { room: 1, x: 8, z: 1 },
  { room: 2, x: 10, z: 1.8 },
];
export function createState() {
  return {
    player: { x: -14, z: 0, heading: Math.PI / 4, gait: 0 },
    cameraX: -14,
    angle: 0,
    world: 0,
    clock: 0,
    last: 0,
    quiet: matchMedia("(prefers-reduced-motion: reduce)").matches,
    captionUntil: 0,
    activeObject: null,
    powered: true,
    wasMoving: false,
    keys: new Set(),
    gems: records.map((g) => ({ ...g, taken: false })),
    pressure: 0,
    lampMode: false,
    eyeAwake: false,
    discovered: [],
    transition: 0,
    waypoints: [],
    pendingAction: null,
    walkTarget: null,
    hoverObject: null,
  };
}
