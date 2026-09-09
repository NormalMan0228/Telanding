import test from "node:test";
import assert from "node:assert/strict";
import {createEntryState,operate,entryOpen} from "../static/js/entry/puzzle.js";
import {setupCurtain} from "../static/js/stages/curtain.js";
test("three independent visual panels can be solved in any order",()=>{
 const s=createEntryState();
 operate(s,"slider",0,30);operate(s,"slider",1,70);
 for(const i of [2,0,1])operate(s,"contact",i);
 assert.equal(entryOpen(s),false);
 operate(s,"axis",0);assert.deepEqual(s.axes,[1,0,0]);
 for(let i=0;i<3;i++)operate(s,"axis",1);
 operate(s,"axis",2);operate(s,"axis",2);
 assert.equal(entryOpen(s),true);
 operate(s,"contact",0);assert.equal(entryOpen(s),false);
 assert.deepEqual(s.axes,[1,3,2]);assert.deepEqual(s.sliders,[30,70]);
 operate(s,"contact",0);assert.equal(entryOpen(s),true);
 operate(s,"slider",0,45);assert.equal(entryOpen(s),false);
});
test("curtain remains closed until interaction, including reduced motion",()=>{
 for(const reduced of [false,true]){
  let scheduled=0,opened=0,click;
  globalThis.matchMedia=()=>({matches:reduced});
  globalThis.window={innerWidth:800,innerHeight:600,addEventListener(){},removeEventListener(){}};
  globalThis.document={activeElement:null,querySelector:()=>null};
  globalThis.requestAnimationFrame=()=>++scheduled;globalThis.cancelAnimationFrame=()=>{};
  const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});
  const overlay={hidden:true},content={inert:false},skip={addEventListener:(event,fn)=>click=fn};
  const finish=setupCurtain({canvas:{getContext:()=>ctx},overlay,content,skip,onOpen:()=>opened++});
  assert.equal(scheduled,0);assert.equal(overlay.hidden,false);assert.equal(content.inert,true);
  click();assert.equal(reduced?opened:scheduled,1);
  finish();assert.equal(content.inert,false);
 }
});
