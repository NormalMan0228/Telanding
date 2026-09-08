import { roomObjects } from "./config.js";

/** Screen hit regions follow the same projected feet and heights as rendering. */
export function pickTarget(state, project, point, unit = 40) {
  const objects = roomObjects(state)
    .filter((o) => o.label)
    .map((o) => ({ ...o, pickKind: "object" }));
  const papers = state.gems.flatMap((g, index) =>
    g.room === state.world && !g.taken
      ? [
          {
            ...g,
            id: `fragment-${index}`,
            w: 0,
            d: 0,
            h: 0.42,
            reach: 0.45,
            label: "기록 조각 줍기",
            pickKind: "fragment",
          },
        ]
      : [],
  );
  return (
    [...objects, ...papers]
      .filter((o) => {
        const foot = project(o.x + (o.visualOffset ?? 0), 0, o.z),
          top = project(o.x + (o.visualOffset ?? 0), o.h, o.z);
        const width =
          o.pickKind === "fragment"
            ? 18
            : Math.max(20, (o.pickWidth ?? o.w) * unit) + 20;
        return (
          Math.abs(point.x - foot.x) <= width / 2 &&
          point.y >= top.y - 8 &&
          point.y <= foot.y + 10
        );
      })
      .sort((a, b) => b.z - a.z)[0] ?? null
  );
}
