import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const js=ts.transpileModule(fs.readFileSync('src/gait3d.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {solveLeg,advanceGait,upperBody,bodyHeight}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
let flight=false,walkLift=0,runLift=0;
for(let phase=0;phase<Math.PI*2;phase+=.01){
 const wl=solveLeg(phase,'L',1,0),wr=solveLeg(phase,'R',1,0),rl=solveLeg(phase,'L',1,1),rr=solveLeg(phase,'R',1,1);
 assert.ok(!wl.swing||!wr.swing,'walk keeps at least one foot supporting');flight||=rl.swing&&rr.swing;
 walkLift=Math.max(walkLift,wl.lift);runLift=Math.max(runLift,rl.lift);
 for(const run of [0,.25,.5,.75,1]){const a=bodyHeight(phase,1,run),b=bodyHeight(phase+.0001,1,run);assert.ok(Math.abs(a-b)<.001,'continuous body motion');}
}
assert.ok(flight,'run has a brief airborne recovery');assert.ok(runLift>walkLift*2,'run heel recovers higher');
assert.ok(Math.abs(upperBody(0,1,1).elbowL)>Math.abs(upperBody(0,1,0).elbowL));
for(const [run,stride] of [[0,1.10],[1,1.38]])for(const hz of [24,30,60,120]){let phase=.001,contacts=0;for(let i=0;i<10*hz;i++){const p=advanceGait(phase,stride/hz,run);phase=p.phase;contacts+=p.contacts;}assert.equal(contacts,20);}
console.log('PASS: GIF-derived walk support, run recovery/flight, arm distinction, continuous blend and synchronized contacts.');
