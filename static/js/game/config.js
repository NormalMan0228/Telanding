/** Room layouts are the single source of truth for drawing, collision and interactions. */
export const MAP = { halfWidth: 18, halfDepth: 3.5, margin: 0.38 };
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
    name: "01",
    wall: "#202c29",
    floor: "#24302b",
    objects: [
      item("computer", "computer", -10, -2, 1.7, 0.9, 1.6, "기록 단말기 접속"),
      item("sign", "sign", -15.4, 1.6, 0.9, 0.3, 1.2, "조작 안내"),
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
        "전원",
      ),
      item("bed-c", "bed", 9, 1.8, 1.1, 1.9, 0.85),
      item("radio", "radio", 12, -2, 1.25, 0.55, 1.6, "원내 방송"),
      item("observer", "observer", -7.3, -2, 2.1, 1.1, 3.2, "작동"),
      item("wall-crt", "crt-stack", -13, -2.85, 2.8, 0.8, 4.6, "전원"),
      item("wall-shutter", "shutter", 0, -2.85, 3.4, 0.8, 5.1, "회전"),
      item("wall-duct", "duct", 6.2, -2.85, 2.6, 0.8, 4.8, "밸브"),
      ...doors(),
    ],
  },
  {
    name: "02",
    wall: "#302329",
    floor: "#2b2427",
    objects: [
      item("sign", "sign", -13, -2, 0.9, 0.3, 1.2, "조작 안내"),
      item("cab-a", "cabinet", -8, -2.9, 0.8, 0.55, 1.9),
      item("cab-b", "cabinet", -6.8, -2.9, 0.8, 0.55, 1.9),
      item("bed-a", "bed", -2, 0, 1.1, 1.9, 0.85),
      item("iv-a", "iv", -0.6, -0.4, 0.6, 0.5, 2),
      item("bed-b", "bed", 5, -1.8, 1.1, 1.9, 0.85),
      item("radio", "radio", 11, 2, 1.25, 0.55, 1.6, "수신기 조사"),
      item("organ", "organ", 7, -1.9, 2.4, 1.2, 3.2, "밸브"),
      item("chair", "chair", -11, 1.7, 3.1, 1.3, 3.1, "작동"),
      item("wall-lenses", "lenses", -3.8, -2.85, 3.2, 0.8, 4.6, "렌즈"),
      item("wall-vessels", "vessels", 1.6, -2.85, 3.2, 0.8, 4.9, "전원"),
      ...doors(),
    ],
  },
  {
    name: "03",
    wall: "#1e2931",
    floor: "#222c32",
    objects: [
      ...[-10, -8, -6, 3, 5, 7].map((x, i) =>
        item("cab-" + i, "cabinet", x, -2.8, 0.8, 0.55, 1.9),
      ),
      item("computer", "computer", 0, 1.9, 1.7, 0.9, 1.6, "기록 단말기 접속"),
      item("sign", "sign", 12, -1, 0.9, 0.3, 1.2, "조작 안내"),
      item(
        "dream-spool",
        "dream-spool",
        -2,
        -1.8,
        2.3,
        1.2,
        2.9,
        "재생",
      ),
      item("wall-reels", "reels", -13, -2.85, 3.1, 0.8, 4.8, "재생"),
      item("wall-crt", "crt-stack", 12, -2.85, 2.8, 0.8, 4.6, "전원"),
      ...doors(),
    ],
  },
  {
    name: "04",
    wall: "#2b2921",
    floor: "#252c25",
    objects: [
      item("sign", "sign", -13, 1.5, 0.9, 0.3, 1.2, "조작 안내"),
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
        2.7,
        1.1,
        3.2,
        "작동",
      ),
      item("radio", "radio", 6, 1.8, 1.25, 0.55, 1.6, "접수실 방송"),
      item("computer", "computer", 11, -2, 1.7, 0.9, 1.6, "기록 단말기 접속"),
      item("wall-duct", "duct", -13, -2.85, 2.6, 0.8, 4.8, "밸브"),
      item("wall-crt", "crt-stack", 5, -2.85, 3.1, 0.8, 4.9, "전원"),
      ...doors(),
    ],
  },
];
// Irregular foreground clusters leave continuous routes between equipment.
const clusters = [
  [["cart",-11.4,1.9,1.35,.85,1.15],["screen",-1.6,2,1.6,.6,2.5],["stool",4.6,.6,.65,.65,.65],["crate",13.9,1.2,1.1,.75,.75],["cart",7.1,-.15,1.2,.7,1],["crate",-6.1,2.25,.9,.7,.6]],
  [["screen",-7,1.4,1.7,.55,2.5],["cart",2.1,.9,1.3,.8,1.2],["stool",9.1,-.1,.65,.65,.65],["crate",13.8,-1.6,1.1,.8,.8],["cart",-14.2,-.8,1.2,.8,1],["crate",5.5,2.3,.8,.7,.55]],
  [["cart",-8.8,.9,1.35,.8,1.2],["screen",4.2,1.6,1.5,.6,2.3],["crate",8.5,-.8,1.2,.9,.9],["stool",-4.2,2.1,.65,.65,.7],["crate",14.5,1.7,1.1,.8,.75],["cart",1.1,-1.7,1.25,.75,1.1]],
];
[[4.4,2.4],[-4.7,2.3],[9.8,1.8]].forEach(([x,z],i)=>rooms[i].objects.push(item("attendant","npc",x,z,.95,.55,2,"조사")));
clusters.forEach((items,room)=>items.forEach(([kind,x,z,w,d,h],i)=>rooms[room].objects.push(item(`prop-${i}`,kind,x,z,w,d,h))));
// Break the uniform cabinet row into staggered storage groups.
rooms[2].objects.filter(o=>o.kind==="cabinet").forEach((o,i)=>{o.z=[-2.8,-2.1,-2.6,-2.7,-1.6,-2.4][i];o.x+=[0,.35,-.25,.15,-.3,.4][i];});
export const palettes = rooms.map((r) => ({ name: r.name, sky: "#080d0e" }));
export const objects = rooms[0].objects;
export function roomObjects(state) {
  return state.stageMode
    ? rooms[state.world].objects.filter((o) => o.kind !== "door")
    : rooms[state.world].objects;
}
const records = [];
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
    apparatus: {},
    transition: 0,
    waypoints: [],
    pendingAction: null,
    walkTarget: null,
    hoverObject: null,
  };
}
