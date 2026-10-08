import fs from 'node:fs';import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('src/idleGestures.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
const {idleGesturePose}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
fs.writeFileSync('art/guy-character/idle-poses.json',JSON.stringify(['hair','sleeve'].flatMap(kind=>[.8,1.6].map(t=>({name:`${kind}-${t}`,...idleGesturePose(kind,t)})))));
