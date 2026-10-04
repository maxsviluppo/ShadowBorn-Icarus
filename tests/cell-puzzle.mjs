import fs from 'node:fs';import assert from 'node:assert/strict';import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('src/cellPuzzle.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {CellPuzzle}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const s=new CellPuzzle();
s.act('rope','take');s.act('rope','cut');assert.equal(s.has('rope'),false);
s.act('grog','take');assert.equal(s.has('grog'),false);
s.act('handle','take');assert.equal(s.has('jaw'),false);
assert.ok(!s.act('handle','examine').includes('mandibola'));
s.act('jug','extract');assert.equal(s.has('eye'),false);
s.act('jug','take');s.act('jug','extract');s.act('jug','extract');s.act('cup','take');s.act('cup','take');
assert.deepEqual(s.inventory,['jug','eye','cup']);assert.equal(s.visible('jug'),false);assert.equal(s.visible('cup'),false);
s.act('cabinet','interact');assert.equal(s.visible('grog'),true);s.act('grog','take');s.act('grog','break');assert.equal(s.has('grog'),true);
s.act('rope','interact','grog');assert.equal(s.has('grog'),true,'wrong combination preserves item');
assert.match(s.act('wall-barrel','interact','grog'),/danni/);assert.equal(s.bottleBroken,false);assert.equal(s.has('grog'),true);
s.act('handle','interact','grog');assert.equal(s.has('grog'),false);assert.equal(s.has('bottle'),true);
s.act('handle','take');assert.equal(s.has('jaw'),true);assert.equal(s.jawKnown,false);
s.act('skull','talk');assert.equal(s.jawKnown,true);assert.match(s.act('handle','examine'),/mandibola/);
s.act('skull','interact','jaw');assert.equal(s.jawGiven,true);assert.equal(s.has('jaw'),false);
s.act('bottle','break');assert.equal(s.has('bottle'),true);assert.equal(s.bottleBroken,false);s.act('barrel','interact','bottle');assert.equal(s.has('bottle'),false);assert.equal(s.visible('broken'),true);assert.equal(s.has('shard'),false);s.act('broken','take');assert.equal(s.has('shard'),true);assert.equal(s.visible('broken'),false);s.act('broken','take');assert.equal(s.inventory.filter(i=>i==='shard').length,1);
s.act('rope','interact','shard');s.act('rope','cut');assert.equal(s.inventory.filter(i=>i==='rope').length,1);assert.equal(s.ropeCut,true);
assert.equal(s.has('shard'),true);assert.equal(s.has('jug'),true);assert.equal(s.has('eye'),true);
console.log('PASS: complete cell puzzle, prerequisites, no duplicates, hidden jaw identity, non-destructive wrong combinations.');

assert.match(s.exitHint(),/orbita/);
s.act('door','interact');assert.equal(s.roomComplete,false);
s.act('skull','interact','eye');assert.equal(s.eyeGiven,true);assert.equal(s.has('eye'),false);
const inv=[...s.inventory];s.act('skull','interact','eye');assert.deepEqual(s.inventory,inv);
assert.match(s.exitHint(),/indovinelli/);s.riddlesPassed=true;s.secretRevealed=true;assert.equal(s.exitHint(),'');s.act('door','examine');assert.equal(s.roomComplete,false);
s.act('door','interact');assert.equal(s.roomComplete,false,'main door stays barred');s.act('wall-hole','interact','cup');assert.equal(s.roomComplete,true);
for(const field of ['jugTaken','eyeFound','cupTaken','grogTaken','rustDissolved','jawTaken','jawGiven','eyeGiven','bottleBroken','shardTaken','ropeCut','riddlesPassed','secretRevealed']){
 const incomplete=Object.assign(new CellPuzzle(),s,{inventory:[...s.inventory],roomComplete:false,[field]:false});
 assert.ok(incomplete.exitHint(),field+' produces a hint');incomplete.act('wall-hole','interact','cup');assert.equal(incomplete.roomComplete,false,field+' prevents exit');
}
const early=new CellPuzzle();early.act('skull','interact','eye');assert.equal(early.eyeGiven,false);
early.act('jug','take');early.act('jug','extract');early.act('skull','interact','eye');assert.equal(early.eyeGiven,true);assert.equal(early.jawGiven,false);
console.log('PASS: eye placement in either order, single consumption, every exit prerequisite, examination never exits.');
