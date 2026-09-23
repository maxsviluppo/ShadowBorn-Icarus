import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=await fs.readFile(new URL('../src/characterMotion.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {CharacterMotion,angleDelta,turnToward,WALK_SPEED,WALK_FRAME_DISTANCE,turnFrame}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const rad=d=>d*Math.PI/180;
assert.ok(Math.abs(angleDelta(rad(350),rad(10))-rad(20))<1e-9);
assert.ok(Math.abs(angleDelta(rad(10),rad(350))+rad(20))<1e-9);
assert.ok(Math.abs(angleDelta(turnToward(rad(350),rad(10),rad(5)),rad(355)))<1e-9);
const turning=new CharacterMotion();turning.facing=0;
let rotationFrames=0;
while(Math.abs(angleDelta(turning.facing,Math.PI))>.035){assert.equal(turning.step(1/60,Math.PI,300),0,'turn in place must not slide');assert.equal(turning.state,'turning');rotationFrames++;assert.ok(rotationFrames<70);}
assert.ok(rotationFrames>35,'180-degree turn should be visible, not instantaneous');
const walking=new CharacterMotion();walking.facing=0;
const first=walking.step(1/60,0,1000);assert.ok(first<WALK_SPEED/60*.1,'gentle initial acceleration');
let peak=0;
for(let i=0;i<180;i++){walking.step(1/60,0,1000);peak=Math.max(peak,walking.speed);}
assert.equal(peak,WALK_SPEED);
walking.step(1/60,0,.5);assert.ok(walking.speed<WALK_SPEED,'brake near goal');
walking.stop();assert.equal(walking.speed,0);
walking.advance(WALK_SPEED);assert.ok(Math.abs(walking.phase-WALK_SPEED/WALK_FRAME_DISTANCE)<1e-9);
assert.ok(walking.phase<7,'relaxed foot cadence');
const travel=fps=>{const actor=new CharacterMotion();actor.facing=0;let d=0;for(let i=0;i<fps*3;i++)d+=actor.step(1/fps,0,1000);return d;};
assert.ok(Math.abs(travel(30)-travel(120))<2,'travel must not materially depend on refresh rate');
for(let angle=-Math.PI*4;angle<Math.PI*4;angle+=.07)assert.ok(turnFrame(angle)>=0&&turnFrame(angle)<16);
assert.notEqual(turnFrame(rad(157.5)),7,'omit incorrectly oriented generated cell');
console.log(`PASS: turn without sliding (${rotationFrames} frames), shortest rotation, acceleration, braking, foot cadence, 30/120 Hz, atlas range.`);
