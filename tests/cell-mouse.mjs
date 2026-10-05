import fs from 'node:fs';import assert from 'node:assert/strict';import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('src/cellMouse.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
const {CellMouse}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
for(const random of [0,.5,.99999]){const m=new CellMouse(()=>random);m.flee();assert.equal(m.selectable,false);assert.equal(m.amount,1);m.step(.45);assert.equal(m.phase,'hidden');assert.ok(m.wait>=10&&m.wait<=20);m.step(m.wait-.01);assert.equal(m.amount,0);m.step(.02);assert.equal(m.phase,'returning');m.step(.6);assert.equal(m.selectable,true);m.step(m.wait);assert.equal(m.phase,'leaving');m.reset();assert.equal(m.selectable,true);}
console.log('PASS mouse flee, hidden interval 10–20 seconds, return and spontaneous retreat');
