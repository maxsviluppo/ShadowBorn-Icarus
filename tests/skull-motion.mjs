import fs from 'node:fs';import assert from 'node:assert/strict';import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('src/skullMotion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
const {skullMotion:f}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
let last=-1,longest=0,bursts=0,previous=false,max=0;
for(let t=0;t<120;t+=1/120){const a=f(t),b=f(t+1/120);if(a.active&&!previous){bursts++;if(last>=0)longest=Math.max(longest,t-last);last=t;}previous=a.active;
 for(const k of ['x','y','angle'])assert.ok(Number.isFinite(a[k]));
 assert.ok(Math.abs(a.x-b.x)<.9,'no jump between bursts');max=Math.max(max,Math.abs(a.x));
 if(!a.active)assert.deepEqual(a,{active:false,x:0,y:0,angle:0});
}
assert.ok(bursts>=38&&longest<4,'frequent short bursts with bounded random pauses');assert.ok(max>1.7&&max<=2.1,'visible but restrained displacement');
assert.notEqual(f(1).x,f(7).x,'variation between windows');
console.log('PASS: visible skull motion, continuous rest, frequent randomized bursts.');
