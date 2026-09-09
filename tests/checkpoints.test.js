import test from "node:test";
import assert from "node:assert/strict";
import {loadEntry,saveEntry} from "../static/js/entry/checkpoint.js";
import {createEntryState,entryOpen} from "../static/js/entry/puzzle.js";
import {restoreProgress,saveProgress} from "../static/js/stages/checkpoint.js";
import {createProgress,STAGES,evaluateStage} from "../static/js/stages/config.js";
const memory=()=>{const m=new Map();return{setItem:(k,v)=>m.set(k,v),getItem:k=>m.get(k)}};
test("entry device restores independent panels, rejecting malformed values",()=>{
 const storage=memory(),s=createEntryState();s.axes=[1,3,2];s.contacts=[true,true,true];s.sliders=[30,70];saveEntry(s,storage);
 assert.equal(entryOpen(loadEntry(storage)),true);
 storage.setItem("telemera.entry.v2",JSON.stringify({axes:[9,2,1],contacts:[1,true,true],sliders:[-1,70]}));
 assert.deepEqual(loadEntry(storage),createEntryState());
});
test("stage checkpoint keeps clues and inputs but cannot jump over unwatched stages",()=>{
 const storage=memory(),s=createProgress();s.active="03";saveProgress(s,storage);
 assert.equal(restoreProgress(storage).active,"01");
 s.active="01";s.inputs["01"]=[...STAGES[0].solution];s.clues["01"]=STAGES[0].clues.map(c=>c.object);evaluateStage(s,{});
 s.watched=["01"];s.active="02";s.inputs["02"]=[1,0,1,0,0];saveProgress(s,storage);
 const restored=restoreProgress(storage);assert.equal(restored.active,"02");assert.deepEqual(restored.inputs["02"],[1,0,1,0,0]);assert.deepEqual(restored.completed,["01"]);
});
test("unavailable session storage never blocks the experience",()=>{
 const storage={getItem(){throw Error("unavailable")},setItem(){throw Error("unavailable")}};
 assert.deepEqual(loadEntry(storage),createEntryState());assert.deepEqual(restoreProgress(storage),createProgress());
 assert.doesNotThrow(()=>saveEntry(createEntryState(),storage));assert.doesNotThrow(()=>saveProgress(createProgress(),storage));
});

test("a blocked sessionStorage property also falls back without throwing",()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,"sessionStorage");
 Object.defineProperty(globalThis,"sessionStorage",{configurable:true,get(){throw Error("denied")}});
 try{
  assert.deepEqual(loadEntry(),createEntryState());assert.deepEqual(restoreProgress(),createProgress());
  assert.doesNotThrow(()=>saveEntry(createEntryState()));assert.doesNotThrow(()=>saveProgress(createProgress()));
 }finally{if(original)Object.defineProperty(globalThis,"sessionStorage",original);else delete globalThis.sessionStorage;}
});
