import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
const compile=async name=>ts.transpileModule(await fs.readFile(new URL('../src/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const url=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const nav=url(await compile('navigation'));
const {walkable}=await import(nav);
const {Locomotion3D,WALK_SPEED,RUN_SPEED}=await import(url((await compile('locomotion3d')).replace("'./navigation'",JSON.stringify(nav))));
assert.ok(Math.abs(WALK_SPEED-1.43)<1e-10);
function drive(m,hz,limit=60){let peak=0,drop=0,previous=m.speed;for(let i=0;i<hz*limit;i++){m.step(1/hz);assert.ok(walkable(m.location),'collision-free movement');peak=Math.max(peak,m.speed);drop=Math.max(drop,previous-m.speed);previous=m.speed;if(m.arrived)return {peak,drop,time:i/hz};}assert.fail('never arrived '+JSON.stringify(m));}
for(const hz of [24,30,60,120])for(const run of [false,true]){
 const m=new Locomotion3D();assert.ok(m.go({u:.43,v:.105},run));const r=drive(m,hz);
 assert.ok(r.peak<=(run?RUN_SPEED:WALK_SPEED)+.005,'speed cap');
 assert.ok(r.drop<5/hz+.035,'no abrupt stop');
 assert.ok(Math.hypot(m.location.u-.43,m.location.v-.105)<.002);
 console.log(hz,run,r);
}
const m=new Locomotion3D();m.go({u:.9,v:.15});m.go({u:.9,v:.15},true);assert.equal(m.running,true);
for(let i=0;i<120;i++)m.step(1/60);
const before=m.speed;m.stop();assert.equal(m.speed,before,'stop command must not snap velocity');drive(m,60);
const n=new Locomotion3D();n.go({u:.9,v:.15},true);for(let i=0;i<120;i++)n.step(1/60);n.go({u:.2,v:.5});drive(n,60);assert.ok(Math.hypot(n.location.u-.2,n.location.v-.5)<.002);
console.log('PASS: double walk/run speed, run promotion, bounded braking, escape, rerouting, collision safety at 24/30/60/120 Hz.');
