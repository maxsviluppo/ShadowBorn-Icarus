import fs from 'node:fs';import assert from 'node:assert/strict';
const b=fs.readFileSync('public/assets/3d/barnaby.glb'),len=b.readUInt32LE(12),g=JSON.parse(b.subarray(20,20+len));
const root=g.nodes.findIndex(n=>n.name==='Barnaby');
for(const name of ['Walk','Run']){const clip=g.animations.find(a=>a.name===name);assert.ok(clip);assert.ok(!clip.channels.some(c=>c.target.node===root),'no root translation or rotation in '+name);for(const joint of ['LegL','LegR','ShinL','ShinR','ArmL','ArmR'])assert.ok(clip.channels.some(c=>g.nodes[c.target.node].name===joint&&c.target.path==='rotation'),name+' animates '+joint);}
console.log('PASS: actual Barnaby walk/run animate both legs and arms without root motion or root spinning.');
