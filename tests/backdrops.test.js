import { test } from "node:test";
import assert from "node:assert/strict";
import { loadBackdrops, BACKDROP_FILES } from "../static/js/game/backdrops.js";

test("the restored room loads first and a failed image cannot prevent adjacent rooms loading", async () => {
  const images = [];
  globalThis.Image = class {
    constructor() {
      images.push(this);
    }
  };
  const state = { world: 2 },
    statuses = [];
  const loader = loadBackdrops(state, (value) => statuses.push(value));
  assert.equal(images.length, 1);
  assert.ok(images[0].src.endsWith("archive-panorama.png"));
  assert.equal(images[0].fetchPriority, "high");
  images[0].onerror();
  await Promise.resolve();
  assert.equal(images.length, 3);
  assert.ok(images.every((image) => !image.src.endsWith("ward-panorama.png")));
  assert.equal(statuses.at(-1), "AUX SIGNAL");
  state.world = 0;
  loader.refresh();
  assert.equal(statuses.at(-1), "RECEIVING…");
  const ward = images.find((image) => image.src.endsWith("ward-panorama.png"));
  assert.equal(ward.fetchPriority, "high");
  loader.refresh();
  assert.equal(images.length, BACKDROP_FILES.length);
  ward.onload();
  assert.equal(statuses.at(-1), "SIGNAL OK");
  assert.equal(state.backdrops[0], ward);
  await Promise.resolve();
  assert.equal(images.length, BACKDROP_FILES.length);
  state.world = 2;
  loader.refresh();
  assert.equal(statuses.at(-1), "AUX SIGNAL");
  delete globalThis.Image;
});
