import fs from 'node:fs';import assert from 'node:assert/strict';import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('src/interactionMotion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
const {interactionPose:pose,interactionDuration:duration,interactionContact:contact}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
for(const kind of ['sit','cabinet','cut','give']){
 for(const t of [0,duration[kind]]){const p=pose(kind,t);assert.equal(p.weight,0);assert.equal(p.drop,0);}
 assert.ok(contact[kind]>.8&&contact[kind]<duration[kind]-.8);
 for(let t=0;t<duration[kind];t+=1/60){const p=pose(kind,t);assert.ok(Object.values(p).every(Number.isFinite));assert.ok(p.knee>=0);assert.ok(Math.abs(p.thigh+p.knee+p.ankle)<1e-9);const length=.325*Math.cos(p.thigh)+.310*Math.cos(p.thigh+p.knee);assert.ok(Math.abs(length+p.drop-.635)<1e-9,'feet stay at floor height');}
}
assert.ok(pose('cut',1.2).drop>pose('cabinet',1.2).drop);
console.log('PASS: interaction transitions, forward knees, planted feet and contact timing.');
