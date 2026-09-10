import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
test('receiver reveals three distinct signals and retains discoveries through static',()=>{
 const nodes=new Map();let onInput;
 const get=id=>{if(!nodes.has(id))nodes.set(id,{textContent:'',classList:{add(){}},addEventListener(type,handler){onInput=handler;}});return nodes.get(id);};
 const document={getElementById:get,querySelector:get};
 vm.runInNewContext(readFileSync(new URL('../static/js/home.js',import.meta.url),'utf8'),{document});
 const messages=new Set();
 for(const value of [923,987,1046]){get('frequency').value=value;onInput();messages.add(get('transmission').textContent);assert.equal(get('signal-state').textContent,'신호 수신');}
 assert.equal(messages.size,3);
 get('frequency').value=880;onInput();assert.equal(get('signal-state').textContent,'주파수 탐색 중');
 for(let i=0;i<3;i++)assert.match(get('[data-signal="'+i+'"]').textContent,/수신됨/);
});
