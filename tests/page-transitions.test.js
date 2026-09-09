import test from "node:test";
import assert from "node:assert/strict";
const listeners={};globalThis.document={addEventListener:(type,fn)=>listeners[type]=fn,getElementById:()=>overlay};
globalThis.window={addEventListener:(type,fn)=>listeners[type]=fn};
let destination=null,overlay=null,reduced=false;
globalThis.location={href:"https://telemera.test/chamber",origin:"https://telemera.test",pathname:"/chamber",search:"",assign:url=>destination=url};
globalThis.matchMedia=()=>({matches:reduced});
const {navigateTo}=await import("../static/js/page-transitions.js");
test("page jam navigates once after animation and honors reduced motion",async()=>{
 let resolve;overlay={dataset:{},hidden:true,animate:()=>({finished:new Promise(r=>resolve=r)})};
 navigateTo("/play");assert.equal(destination,null);assert.equal(overlay.hidden,false);
 navigateTo("/games");resolve();await new Promise(r=>setImmediate(r));assert.equal(destination,"/play");
 reduced=true;navigateTo("/games");assert.equal(destination,"/games");
});
test("locked puzzle routes and modifier-clicks are never intercepted",()=>{
 let prevented=false;
 const link={href:"https://telemera.test/play",getAttribute:()=>"true",hasAttribute:()=>false};
 listeners.click({target:{closest:()=>link},button:0,preventDefault:()=>prevented=true});
 assert.equal(prevented,false);
 link.getAttribute=()=>null;
 listeners.click({target:{closest:()=>link},button:0,ctrlKey:true,preventDefault:()=>prevented=true});assert.equal(prevented,false);
});
