import {createEntryState} from "./puzzle.js";
const KEY="telemera.entry.v2";
export function loadEntry(storage){
 const state=createEntryState();
 try{
  storage??=globalThis.sessionStorage;
  const saved=JSON.parse(storage.getItem(KEY));
  if(Array.isArray(saved?.axes)&&saved.axes.length===3&&saved.axes.every(v=>Number.isInteger(v)&&v>=0&&v<4))state.axes=[...saved.axes];
  if(Array.isArray(saved?.contacts)&&saved.contacts.length===3&&saved.contacts.every(v=>typeof v==="boolean"))state.contacts=[...saved.contacts];
  if(Array.isArray(saved?.sliders)&&saved.sliders.length===2&&saved.sliders.every(v=>Number.isFinite(v)&&v>=0&&v<=100))state.sliders=[...saved.sliders];
 }catch{}
 return state;
}
export function saveEntry(state,storage){try{storage??=globalThis.sessionStorage;storage.setItem(KEY,JSON.stringify(state));}catch{}}
