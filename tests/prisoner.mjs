import fs from 'node:fs';import assert from 'node:assert/strict';
const b=fs.readFileSync('public/assets/3d/prisoner.glb');const g=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));assert.ok(g.images?.length);assert.ok(g.skins?.length);
for(const name of ['Idle','Walk','Run']){const clip=g.animations.find(a=>a.name===name);assert.ok(clip,name);for(const joint of ['LegL','LegR','ArmL','ArmR'])assert.ok(clip.channels.some(c=>g.nodes[c.target.node].name===joint),joint);}
console.log('PASS prisoner texture, skin and idle/walk/run clips');

assert.ok(fs.readFileSync('src/pixelCell.ts','utf8').includes('/assets/3d/prisoner.glb'));
