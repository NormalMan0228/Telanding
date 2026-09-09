import test from "node:test";
import assert from "node:assert/strict";
import {createCanvas} from "@napi-rs/canvas";
import {setupCurtain} from "../static/js/stages/curtain.js";

test("curtain waits for a click, opens once and releases content in reduced motion",()=>{
 globalThis.matchMedia=()=>({matches:true});
 globalThis.window={innerWidth:390,innerHeight:844,addEventListener(){},removeEventListener(){}};
 let frames=0,opened=0,click;
 globalThis.requestAnimationFrame=()=>{frames++;return 1};
 globalThis.cancelAnimationFrame=()=>{};
 const overlay={hidden:true},content={inert:false},skip={addEventListener(type,fn){click=fn}};
 const finish=setupCurtain({canvas:createCanvas(390,844),overlay,content,skip,onOpen(){opened++}});
 assert.equal(overlay.hidden,false);assert.equal(content.inert,true);assert.equal(frames,0);assert.equal(opened,0);
 click();finish();
 assert.equal(opened,1);assert.equal(content.inert,false);assert.equal(overlay.hidden,true);
});
