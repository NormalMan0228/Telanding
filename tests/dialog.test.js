import { test } from "node:test";
import assert from "node:assert/strict";
import { createDialog } from "../static/js/game/dialog.js";

test("phone and game dialogues pause walking, manage the promotional link, and restore focus", () => {
  const elements = new Map();
  function element(id) {
    if (!elements.has(id))
      elements.set(id, {
        open: false,
        isConnected: true,
        events: {},
        addEventListener(type, fn) {
          this.events[type] = fn;
        },
        showModal() {
          this.open = true;
        },
        close() {
          this.open = false;
          this.events.close?.();
        },
        focus() {
          this.focused = true;
        },
      });
    return elements.get(id);
  }
  const canvas = element("canvas"),
    phone = element("phone");
  let paused = 0;
  globalThis.document = { getElementById: element, activeElement: phone };
  const dialogue = createDialog({ canvas, onOpen: () => paused++ });
  dialogue.show("전화", "신호", "EXT. 000");
  assert.equal(element("dialog-link").hidden, true);
  dialogue.close();
  assert.equal(phone.focused, true);
  document.activeElement = canvas;
  dialogue.show("다음 게임", "새 소식", "NEXT SIGNAL", true);
  assert.equal(element("dialog-link").hidden, false);
  element("info").close();
  assert.equal(canvas.focused, true);
  assert.equal(paused, 2);
  document.activeElement = phone;
  phone.isConnected = false;
  dialogue.show("다시", "신호");
  canvas.focused = false;
  dialogue.close();
  assert.equal(canvas.focused, true);
});
