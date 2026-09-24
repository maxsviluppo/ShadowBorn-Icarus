import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
const code=await fs.readFile(new URL('../src/propMotion.ts',import.meta.url),'utf8');
const {PropMotion,PROP_SECONDS}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText).toString('base64'));
for(const kind of Object.keys(PROP_SECONDS))for(const hz of [24,30,60,120]){
 const p=new PropMotion(kind);assert.equal(p.set(false),0);let d=p.set(true);assert.equal(d,PROP_SECONDS[kind][0]);assert.equal(p.set(true),0);
 for(let t=0;t<d+1/hz;t+=1/hz)p.step(1/hz);assert.equal(p.value,1);
 d=p.set(false);for(let t=0;t<d+1/hz;t+=1/hz)p.step(1/hz);assert.equal(p.value,0);
 p.set(true);p.step(.15);const before=p.value;d=p.set(false);assert.equal(p.value,before,'reversal must not jump');assert.ok(d>0&&d<PROP_SECONDS[kind][1]);p.step(2);assert.equal(p.value,0);p.reset();assert.equal(p.set(false),0);
}
for(const name of ['step-0','step-1','step-2','step-3','lock-open',...Object.keys(PROP_SECONDS).flatMap(k=>[k+'-open',k+'-close'])]){
 const b=await fs.readFile(new URL('../public/assets/audio/'+name+'.wav',import.meta.url));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.readUInt32LE(24),44100);assert.equal(b.readUInt16LE(22),1);let peak=0,sum=0;for(let i=44;i<b.length;i+=2){const x=b.readInt16LE(i)/32768;peak=Math.max(peak,Math.abs(x));sum+=x*x;}assert.ok(peak>.1&&peak<.71,name+' headroom');assert.ok(sum>1,name+' audible');assert.equal(b.readInt16LE(44),0);assert.equal(b.readInt16LE(b.length-2),0);
}
console.log('PASS: 13 PCM samples, headroom, fade boundaries; finite prop timelines, idempotence, reversal and 24/30/60/120 Hz.');
