import test from "node:test";
import assert from "node:assert/strict";
import { STAGES, createProgress, collectClue, evaluateStage, playableVideo, finishVideo, advanceStage, changeInput } from "../static/js/stages/config.js";
test("each stage requires its own discovered clues and matching panel input",()=>{
  assert.equal(STAGES.length,3);
  for(const stage of STAGES){
    const p=createProgress();p.active=stage.id;
    p.inputs[stage.id]=[...stage.solution];
    assert.equal(evaluateStage(p,{}),false);
    for(const clue of stage.clues)collectClue(p,clue.object);
    collectClue(p,stage.clues[0].object);
    assert.equal(p.clues[stage.id].length,3);
    p.inputs[stage.id]=[9,9,9];
    assert.equal(evaluateStage(p,{}),false);
    p.inputs[stage.id]=[...stage.solution];
    assert.equal(evaluateStage(p,{}),true);
    assert.equal(evaluateStage(p,{}),false);
    assert.equal(playableVideo(p,stage.id),null);
  }
});
test("video source stays gated and rejects unsafe URL schemes",()=>{
  const p=createProgress();
  const stages=STAGES.map(s=>({...s,video:"/static/videos/"+s.id+".mp4"}));
  assert.equal(playableVideo(p,"01",stages),null);
  p.completed.push("01");
  assert.equal(playableVideo(p,"01",stages),"/static/videos/01.mp4");
  assert.equal(playableVideo(p,"02",stages),null);
  stages[0].video="javascript:alert(1)";
  assert.equal(playableVideo(p,"01",stages),null);
});
test("coupled dials can reach the inferred solution through actual controls",()=>{
  const p=createProgress();
  changeInput(p,0);assert.deepEqual(p.inputs["01"],[1,1,0]);
  p.inputs["01"]=[0,0,0];
  changeInput(p,1);changeInput(p,2);changeInput(p,2);
  assert.deepEqual(p.inputs["01"],STAGES[0].solution);
  p.active="03";
  for(const value of [0,2,1,1,0,2])changeInput(p,value);
  assert.deepEqual(p.inputs["03"],STAGES[2].solution);
});
test("completion alone cannot skip video or the transfer device; final stage never wraps",()=>{
  const p=createProgress();
  assert.equal(finishVideo(p,"01"),false);
  assert.equal(advanceStage(p,100),false);
  for(const stage of STAGES){
    assert.equal(p.active,stage.id);
    p.completed.push(stage.id);
    assert.equal(advanceStage(p,100),false);
    assert.equal(finishVideo(p,"other"),false);
    assert.equal(finishVideo(p,stage.id),true);
    assert.equal(advanceStage(p,20),false);
    assert.equal(advanceStage(p,100),stage.id!=="03");
  }
  assert.equal(p.active,"03");
});
