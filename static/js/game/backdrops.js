export const BACKDROP_FILES = ["ward", "dream", "archive", "reception"];

/** Prioritize the current room; adjacent rooms warm up after its first image arrives. */
export function loadBackdrops(state, onStatus) {
  state.backdrops = [];
  const failed = new Set(),
    pending = new Map();
  function report() {
    onStatus(
      state.backdrops[state.world]
        ? "SIGNAL OK"
        : failed.has(state.world)
          ? "AUX SIGNAL"
          : "RECEIVING…",
    );
  }
  function load(index, priority) {
    if (state.backdrops[index] || failed.has(index)) return Promise.resolve();
    if (pending.has(index)) {
      const request = pending.get(index);
      if (priority === "high") request.image.fetchPriority = "high";
      return request.promise;
    }
    let finish;
    const promise = new Promise((resolve) => {
      finish = resolve;
    });
    const image = new Image();
    pending.set(index, { image, promise });
    image.decoding = "async";
    image.fetchPriority = priority;
    image.onload = () => {
      state.backdrops[index] = image;
      pending.delete(index);
      report();
      finish();
    };
    image.onerror = () => {
      failed.add(index);
      pending.delete(index);
      report();
      finish();
    };
    image.src = `/static/images/telemera-${BACKDROP_FILES[index]}-panorama.png`;
    return promise;
  }
  function refresh() {
    report();
    if (typeof Image === "undefined") return;
    const current = state.world;
    load(current, "high").then(() => {
      // A quick room change must not start unnecessary requests for the old room.
      if (state.world !== current) return;
      for (const direction of [-1, 1])
        load(
          (current + direction + BACKDROP_FILES.length) % BACKDROP_FILES.length,
          "low",
        );
    });
  }
  refresh();
  return { refresh };
}
