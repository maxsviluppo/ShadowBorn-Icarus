import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
const code=await fs.readFile(new URL('../src/gait3d.ts',import.meta.url),'utf8');
const js=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {solveLeg,advanceGait}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
for(let phase=0;phase<Math.PI*4;phase+=.017)for(const side of ['L','R'])for(const blend of [0,.5,1]){
  const p=solveLeg(phase,side,blend);
  assert.ok(Object.values(p).every(v=>typeof v!=='number'||Number.isFinite(v)));
  // Forward kinematics independently checks the requested foot placement.
  const y=.29*Math.cos(p.hip)+.265*Math.cos(p.hip+p.knee);
  const z=-.29*Math.sin(p.hip)-.265*Math.sin(p.hip+p.knee);
  assert.ok(Math.abs(y-p.y)<1e-6&&Math.abs(z-p.z)<1e-6,'IK reaches sole target');
  assert.ok(Math.abs(p.hip+p.knee+p.ankle)<1e-9,'sole stays level');
  if(!p.swing)assert.equal(p.lift,0,'stance must not hover');
}
for(const hz of [24,30,60,120]){let phase=.001,contacts=0;for(let i=0;i<hz*10;i++){const next=advanceGait(phase,.8/hz);phase=next.phase;contacts+=next.contacts;}assert.equal(contacts,20,'foot contacts independent of frame rate');}
assert.equal(advanceGait(2,0).contacts,0);
assert.equal(advanceGait(2,-1).phase,2);
function glbJson(buffer){assert.equal(buffer.readUInt32LE(0),0x46546c67);return JSON.parse(buffer.subarray(20,20+buffer.readUInt32LE(12)).toString());}
const room=glbJson(await fs.readFile(new URL('../public/assets/3d/custodian-room.glb',import.meta.url)));
const hero=glbJson(await fs.readFile(new URL('../public/assets/3d/traveller.glb',import.meta.url)));
for(const name of ['DoorHinge','ChestLid','BrassKey'])assert.ok(room.nodes.some(n=>n.name===name),name);
for(const name of ['Body','Torso','Head','Backpack','ArmL','ArmR','ForearmL','ForearmR','LegL','LegR','ShinL','ShinR','FootL','FootR'])assert.ok(hero.nodes.some(n=>n.name===name),name);
assert.ok(hero.animations.length>0,'Blender source walk exported');
console.log('PASS: 3D leg IK, planted stance, level soles, 24/30/60/120 Hz contact timing, GLB joints and source animation.');
