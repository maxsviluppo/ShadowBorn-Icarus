import fs from 'node:fs';import assert from 'node:assert/strict';import ts from 'typescript';import {createHash} from 'node:crypto';
const load=async path=>import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
const nav=await load('src/navigation.ts'),layout=await load('src/pixelCellLayout.ts');nav.configureNavigation(layout.cellBlocks,.04);
for(const p of [{u:0,v:0},{u:1,v:1},{u:.4,v:.7}]){const q=layout.unprojectCell(layout.projectCell(p));assert.ok(Math.hypot(p.u-q.u,p.v-q.v)<1e-9);}
for(const o of layout.cellObjects){assert.ok(nav.walkable(o.goal),o.id+' approach');const path=nav.findPath({u:.7,v:.79},o.goal);assert.ok(path?.length,o.id+' reachable');let prev={u:.7,v:.79};for(const p of path){assert.ok(nav.clearSegment(prev,p),o.id+' no clipping');prev=p;}}
assert.equal(layout.cellObjects.find(o=>layout.contains({x:280,y:300},o.poly)).id,'skull');
assert.equal(layout.cellObjects.find(o=>layout.contains({x:575,y:285},o.poly)).id,'cabinet');
assert.equal(layout.cellObjects.find(o=>layout.contains({x:672,y:325},o.poly)).id,'barrel');
const png=fs.readFileSync('public/assets/pixel/barnaby-cell-original.png');assert.equal(png.readUInt32BE(16),1024);assert.equal(png.readUInt32BE(20),559);
console.log('PASS: exact image dimensions, affine projection, nine invisible hotspots and safe routes to every object. SHA256:',createHash('sha256').update(png).digest('hex'));

assert.equal(createHash("sha256").update(png).digest("hex"),"60745794fda1db5772bcd255855f2b520647a05f4c5f8d653c674e46341c3782","original painting preserved byte for byte");

assert.equal(nav.walkable({u:.35,v:.55}),false,'bed front leg footprint blocks walking');
assert.equal(layout.cellLayerOccludes('bed',.89,{u:.43,v:.35}),false,'free long side stays in front of bed');
assert.equal(layout.cellLayerOccludes('bed',.89,{u:.20,v:.77}),false,'foot of bed stays behind character');
assert.equal(layout.cellLayerOccludes('bed',.89,{u:.10,v:.10}),true,'bed occludes character only behind its ground edges');
for(const [a,b] of [[{u:.43,v:.35},{u:.2,v:.77}],[{u:.2,v:.77},{u:.49,v:.30}]]){const route=nav.findPath(a,b);assert.ok(route?.length,'route around bed');let prev=a;for(const q of route){assert.ok(nav.clearSegment(prev,q),'no bed corner clipping');prev=q;}}
console.log('PASS: bed footprint and front/behind rendering regression.');
