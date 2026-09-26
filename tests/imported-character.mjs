import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
const buffer=await fs.readFile(new URL('../public/assets/3d/traveller.glb',import.meta.url));
const length=buffer.readUInt32LE(12),model=JSON.parse(buffer.subarray(20,20+length)),bin=buffer.subarray(28+length);
function values(index){const a=model.accessors[index],v=model.bufferViews[a.bufferView],sizes={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16},types={5126:[4,'getFloat32'],5123:[2,'getUint16'],5125:[4,'getUint32'],5121:[1,'getUint8']};const [size,method]=types[a.componentType],width=sizes[a.type],view=new DataView(bin.buffer,bin.byteOffset,bin.byteLength),start=(v.byteOffset??0)+(a.byteOffset??0);return Array.from({length:a.count},(_,i)=>Array.from({length:width},(_,c)=>view[method](start+i*(v.byteStride??width*size)+c*size,true)));}
assert.equal(model.skins.length,1);assert.equal(model.meshes.length,1);
const p=model.meshes[0].primitives[0];assert.ok(model.accessors[p.indices].count/3<=50000);
const weights=values(p.attributes.WEIGHTS_0),joints=values(p.attributes.JOINTS_0);
for(let i=0;i<weights.length;i++){assert.ok(Math.abs(weights[i].reduce((a,b)=>a+b,0)-1)<1e-5);assert.ok(joints[i].every(j=>j<model.skins[0].joints.length));}
assert.equal(model.accessors[p.attributes.TEXCOORD_0].count,weights.length);
assert.ok(model.materials[p.material].pbrMetallicRoughness.baseColorTexture);
assert.ok(model.images.every(i=>i.bufferView!==undefined),'texture embedded, no missing external dependency');
for(const name of ['Idle','Walk','Run'])assert.ok(model.animations.some(a=>a.name===name));
const rig=model.nodes.find(n=>n.name==='Traveller').extras;
const source=await fs.readFile(new URL('../src/gait3d.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {solveLeg}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const dims={upper:rig.gaitUpper,lower:rig.gaitLower,stance:rig.gaitStance};
for(let phase=0;phase<Math.PI*4;phase+=.027)for(const side of ['L','R'])for(const blend of [0,.5,1])for(const run of [0,.5,1]){const p=solveLeg(phase,side,blend,run,dims);const y=dims.upper*Math.cos(p.hip)+dims.lower*Math.cos(p.hip+p.knee),z=-dims.upper*Math.sin(p.hip)-dims.lower*Math.sin(p.hip+p.knee);assert.ok(Math.abs(y-p.y)<1e-6&&Math.abs(z-p.z)<1e-6);assert.ok(Math.abs(p.hip+p.knee+p.ankle)<1e-9);}
assert.ok(buffer.length<4_000_000);
console.log('PASS: textured skin, normalized weights, UVs, embedded texture, idle/walk/run clips, adapted planted-foot IK and web size budget.');
