/** Dialogue returns focus to the object that opened it, including outside the game. */
export function createDialog({ canvas, onOpen }) {
  const $ = (id) => document.getElementById(id),
    element = $("info");
  let origin = canvas;
  function show(title, text, label = "RECOVERED FILE", withGamesLink = false) {
    onOpen();
    $("dialog-label").textContent = label;
    $("dialog-title").textContent = title;
    $("dialog-text").textContent = text;
    $("dialog-link").hidden = !withGamesLink;
    if (!element.open) {
      origin = document.activeElement ?? canvas;
      element.showModal();
    }
  }
  function close() {
    element.close();
  }
  $("close-dialog").onclick = close;
  $("dialog-ok").onclick = close;
  element.addEventListener("click", (event) => {
    if (event.target === element) close();
  });
  element.addEventListener("close", () => {
    const target = origin?.isConnected ? origin : canvas;
    target.focus({ preventScroll: true });
  });
  return { show, close, element };
}
