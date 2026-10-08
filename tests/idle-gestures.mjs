import fs from 'node:fs';import assert from 'node:assert/strict';import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('src/idleGestures.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {IdleGestures,idleGesturePose}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
for(const kind of ['waist','look']){
 const d=idleGesturePose(kind,0).duration;
 for(const t of [0,d]){const p=idleGesturePose(kind,t);for(const k of ['head','headYaw','armRY','forearmRY','armR','forearmR','armL','forearmL'])assert.ok(Math.abs(p[k])<1e-8);}
 for(let t=0;t<d;t+=1/120){const a=idleGesturePose(kind,t),b=idleGesturePose(kind,t+1/120);for(const k of ['head','headYaw','armRY','forearmRY','armR','forearmR','armL','forearmL'])assert.ok(Math.abs(a[k]-b[k])<.04);}
}
const scheduler=new IdleGestures(()=>.2);
for(let i=0;i<500;i++)assert.equal(scheduler.step(1/60,false),null);
for(let i=0;i<300;i++)assert.equal(scheduler.step(1/60,true),null);
let found=null;for(let i=0;i<240&&!found;i++)found=scheduler.step(1/60,true);assert.equal(found.kind,'waist');
assert.equal(scheduler.step(1/60,false),null,'movement interrupts immediately');
scheduler.interrupt();assert.equal(scheduler.step(.1,true),null,'command restarts delay');
console.log('PASS: neutral gesture endpoints, smooth joints, idle-only scheduling and command cancellation.');

const held=idleGesturePose('waist',1);
for(const t of [1.5,2,2.5,3])assert.equal(idleGesturePose('waist',t).forearmR,held.forearmR,'hand rests for two seconds');
assert.ok(idleGesturePose('look',1.2).headYaw>0);
assert.ok(idleGesturePose('look',3.2).headYaw<0);
for(const t of [1,2,3])assert.equal(idleGesturePose('look',t).armR,0,'looking does not move the arms');
