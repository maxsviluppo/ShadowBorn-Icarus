import fs from 'node:fs';import assert from 'node:assert/strict';import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('src/wakeIntro.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
const {wakeFrame:f,WAKE_DURATION:d,WAKE_START:start}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
assert.equal(f(0).black,1);assert.equal(f(0).lie,1);assert.equal(f(0).line,'');
assert.equal(f(3.2).black,0);assert.ok(f(3.2).line.includes('prigione'));
assert.equal(f(17).lie,0);assert.equal(f(17).seated,1);assert.equal(f(17).active,true);
assert.equal(f(22.2).stand,1);assert.equal(f(22.2).active,true);
assert.equal(f(d).active,false);assert.equal(f(d).stand,1);assert.equal(f(d).line,'');
assert.deepEqual(start,{u:.45,v:.69});
for(let t=0;t<d;t+=1/60){const a=f(t),b=f(t+1/60);for(const k of ['black','lie','seated','stand']){assert.ok(a[k]>=0&&a[k]<=1);assert.ok(Math.abs(a[k]-b[k])<.025,'no pose jump: '+k);}}
const joints=['head','torso','arm','forearm','leftLeg','rightLeg','ankle','drop'];
for(let t=0;t<d;t+=1/120)for(const k of joints)assert.ok(Math.abs(f(t)[k]-f(t+1/120)[k])<.035,`continuous joint ${k}`);
for(const k of joints)assert.ok(Math.abs(f(d)[k])<1e-8,`neutral handoff ${k}`);
assert.ok(f(11.8).torso>0&&f(11.8).lie===1,'curl before lifting pelvis');
assert.ok(f(13).leftLeg>f(13).rightLeg,'staggered legs');
assert.ok(f(19.1).torso>.2&&f(19.1).stand===0,'lean before standing');
const html=fs.readFileSync('index.html','utf8');assert.ok(html.indexOf('id="boot-cover"')<html.indexOf('class="game-shell'));
console.log('PASS: black/fade, visible narrative, lying/sitting/standing, continuous poses and delayed control handoff.');
