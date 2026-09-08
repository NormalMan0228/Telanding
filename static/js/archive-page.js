import { createState } from "./game/config.js";
import { restoreSession } from "./game/session.js";
import { FRAGMENTS, EQUIPMENT } from "./content/archive.js";

const state = createState();
restoreSession(state);
const list = document.getElementById("recovered-files");
const recovered = state.gems.filter((g) => g.taken).length;
document.getElementById("recovery-status").textContent = recovered
  ? `회수한 기록 ${recovered} / ${FRAGMENTS.length}. 작은 기계가 주워 온 것들.`
  : "아직 회수한 기록이 없다. 방바닥의 작은 종이를 찾아보자.";
state.gems.forEach((gem, index) => {
  if (!gem.taken) return;
  const entry = FRAGMENTS[index],
    details = document.createElement("details"),
    summary = document.createElement("summary");
  const name = document.createElement("span"),
    title = document.createElement("small"),
    body = document.createElement("div"),
    text = document.createElement("p");
  name.textContent = entry.name;
  title.textContent = entry.title;
  text.textContent = entry.text;
  summary.append(name, title);
  body.append(text);
  details.append(summary, body);
  list.append(details);
});
const equipment = document.getElementById("equipment-list");
state.discovered.forEach((id) => {
  const item = document.createElement("li");
  item.textContent = EQUIPMENT[id];
  equipment.append(item);
});
document.getElementById("equipment-section").hidden = !state.discovered.length;
document.getElementById("signal-file").hidden = !state.signalRecovered;
