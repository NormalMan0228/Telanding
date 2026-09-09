import test from "node:test";
import assert from "node:assert/strict";
import { aligned, ALIGNMENT } from "../static/js/entry/machine.js";
test("entry routes unlock only when all mechanical axes match",()=>{
  for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++)
    assert.equal(aligned([a,b,c]),a===1&&b===3&&c===2);
  assert.equal(aligned(ALIGNMENT),true);
  assert.equal(aligned([1,3]),false);
});
