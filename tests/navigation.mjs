import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=await fs.readFile(new URL('../src/navigation.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {findPath,clearSegment,walkable,project,unproject,blocks}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
let checks=0;
const verify=(start,end)=>{const path=findPath(start,end);assert.ok(path?.length,'reachable target');let previous=start;for(const step of path){assert.ok(walkable(step));assert.ok(clearSegment(previous,step),'segment crosses obstacle');previous=step;checks++;}return path;};
const start={u:.7,v:.79};
for(const goal of [{u:.74,v:.5},{u:.43,v:.105},{u:.60,v:.80},{u:.2,v:.5},{u:.82,v:.4}])verify(start,goal);
const around=verify({u:.3,v:.5},{u:.8,v:.5});assert.ok(around.length>1,'must go around central table');
for(let u=.04;u<.97;u+=.065)for(let v=.04;v<.97;v+=.065)if(walkable({u,v}))verify(start,{u,v});
for(const b of blocks)verify(start,{u:b.u+b.w/2,v:b.v+b.h/2});
assert.equal(findPath(start,{u:-.1,v:.5}),null);
assert.equal(findPath(start,{u:.5,v:1.1}),null);
for(const p of [start,{u:.1,v:.1},{u:.9,v:.9}]){const q=unproject(project(p));assert.ok(Math.abs(p.u-q.u)<1e-10&&Math.abs(p.v-q.v)<1e-10);}
console.log(`PASS: ${checks} safe route segments, detours, blocked goals, bounds, coordinate round trips.`);
// Regression: the path from the key to the door must be safe between waypoints,
// including sub-pixel samples at obstacle corners.
const regression=verify({u:.74,v:.5},{u:.43,v:.105});let from={u:.74,v:.5};
for(const to of regression){for(let t=0;t<=1000;t++){const p={u:from.u+(to.u-from.u)*t/1000,v:from.v+(to.v-from.v)*t/1000};assert.ok(walkable(p),'unsafe intermediate movement position');}from=to;}
console.log('PASS: key-to-door movement corner regression.');
