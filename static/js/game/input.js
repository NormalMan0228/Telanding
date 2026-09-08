const normalize = (key) => (key.length === 1 ? key.toLowerCase() : key);
const movement = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "w",
  "a",
  "s",
  "d",
]);
const directions = {
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
};

/** Track each physical input separately so one released finger cannot cancel another. */
export function setupInput({ canvas, state, interact }) {
  const keyboard = new Set(),
    held = new Map();
  function sync() {
    state.keys.clear();
    keyboard.forEach((key) => state.keys.add(key));
    held.forEach((keys) => keys.forEach((key) => state.keys.add(key)));
  }
  function manual() {
    state.waypoints = [];
    state.pendingAction = null;
    state.walkTarget = null;
  }
  function clear() {
    keyboard.clear();
    held.clear();
    sync();
  }
  canvas.addEventListener("keydown", (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const key = normalize(event.key);
    if (movement.has(key)) {
      event.preventDefault();
      manual();
      keyboard.add(key);
      sync();
    }
    if (key === "e" && !event.repeat) {
      event.preventDefault();
      interact();
    }
  });
  window.addEventListener("keyup", (event) => {
    keyboard.delete(normalize(event.key));
    sync();
  });
  window.addEventListener("blur", clear);
  canvas.addEventListener("blur", clear);
  document.addEventListener("visibilitychange", () => {
    clear();
    state.last = 0;
  });
  document.querySelectorAll("[data-move]").forEach((button) => {
    const keys = button.dataset.move
      .split("-")
      .map((direction) => directions[direction]);
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      manual();
      held.set(event.pointerId, keys);
      sync();
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      button.addEventListener(type, (event) => {
        held.delete(event.pointerId);
        sync();
      });
    const source = `button:${button.dataset.move}`;
    button.addEventListener("keydown", (event) => {
      if (![" ", "Enter"].includes(event.key)) return;
      event.preventDefault();
      manual();
      held.set(source, keys);
      sync();
    });
    button.addEventListener("keyup", (event) => {
      if ([" ", "Enter"].includes(event.key)) {
        event.preventDefault();
        held.delete(source);
        sync();
      }
    });
    button.addEventListener("blur", () => {
      held.delete(source);
      sync();
    });
  });
  return { clear };
}
