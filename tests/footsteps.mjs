import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
async function load(name){const src=await fs.readFile(new URL(`../src/${name}.ts`,import.meta.url),'utf8');const js=ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;return import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));}
const {CharacterMotion}=await load('characterMotion');
const {stoneStepSamples,Footsteps}=await load('footsteps');
const actor=new CharacterMotion();let total=0;
for(let i=0;i<2400;i++)total+=actor.advance(.15);
assert.equal(total,8,'24 animation frames must contain exactly eight planted-foot events');
assert.equal(actor.advance(0),0,'no sound without movement');
actor.reset();assert.equal(actor.advance(29.9),0);assert.equal(actor.advance(.2),1,'trigger on contact frame 2');assert.equal(actor.advance(.1),0,'do not repeat contact');
const variants=Array.from({length:4},(_,i)=>stoneStepSamples(48000,i));
for(const data of variants){const peak=Math.max(...data.map(Math.abs));assert.ok(peak>.05&&peak<.8,'audible with clipping headroom');assert.ok(data.every(Number.isFinite));assert.ok(Math.abs(data.at(-1))<.003,'tail decays cleanly');}
assert.notDeepEqual(variants[0],variants[1]);
const audio=new Footsteps();audio.play(1);assert.equal(audio.played,0,'no autoplay before user gesture');assert.equal(audio.toggle(),false);audio.play(1);assert.equal(audio.played,0);
console.log('PASS: foot-contact timing, no duplicate/idle events, mute/autoplay, four finite non-clipping sample variants.');
