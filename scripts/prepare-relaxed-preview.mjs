import fs from 'node:fs';
import ts from 'typescript';
const load=async path=>{
 const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
 return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
};
const out='art/relaxed-character';fs.mkdirSync(out,{recursive:true});
const {idleGesturePose}=await load('src/idleGestures.ts');
fs.writeFileSync(`${out}/idle-poses.json`,JSON.stringify(['waist','look'].flatMap(kind=>[1,2,3.2].map(t=>({name:`${kind}-${t}`,...idleGesturePose(kind,t)})))));
const {wakeFrame}=await load('src/wakeIntro.ts');
fs.writeFileSync(`${out}/wake-poses.json`,JSON.stringify([0,11.8,13,14.5,16,18.8,19.5,20.5,22.5].map((t,i)=>({name:`sequence-${i}`,time:t,...wakeFrame(t)}))));
const {interactionPose,interactionContact}=await load('src/interactionMotion.ts');
const scale=1.6/1.1243339776992798;
fs.writeFileSync(`${out}/interaction-poses.json`,JSON.stringify(Object.entries(interactionContact).map(([kind,t])=>({name:kind,...interactionPose(kind,t,{upper:.265*scale,lower:.19*scale})}))));
