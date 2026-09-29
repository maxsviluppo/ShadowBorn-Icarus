import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
const compile=async name=>ts.transpileModule(await fs.readFile(new URL('../src/'+name+'.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const url=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const navUrl=url(await compile('navigation'));const nav=await import(navUrl);
const {targets,roomBlocks,ROOM_METRES}=await import(url(await compile('roomLayout')));
nav.configureNavigation(roomBlocks,.24/ROOM_METRES);
const {Locomotion3D}=await import(url((await compile('locomotion3d')).replace("'./navigation'",JSON.stringify(navUrl))));
const start={u:.7,v:.79};let routes=0;
for(const [id,t] of Object.entries(targets)){
 assert.ok(nav.walkable(t.goal),id+' approach is outside obstacles and swings');
 const path=nav.findPath(start,t.goal);assert.ok(path?.length,id+' reachable');let previous=start;
 for(const p of path){assert.ok(nav.clearSegment(previous,p),id+' collision-free segment');previous=p;routes++;}
 const motion=new Locomotion3D(ROOM_METRES);assert.ok(motion.go(t.goal,true));
 for(let i=0;i<60*40&&!motion.arrived;i++){motion.step(1/60);assert.ok(nav.walkable(motion.location),id+' runtime collision');}
 assert.ok(motion.arrived,id+' arrives');
 assert.ok(Math.hypot(motion.location.u-t.goal.u,motion.location.v-t.goal.v)<.002,id+' actual approach');
}
const bytes=await fs.readFile(new URL('../public/assets/3d/prison-cell.glb',import.meta.url));const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
for(const [name,sign] of Object.entries({ChestLid:1,CabinetLeft:-1,CabinetRight:1,DoorHinge:1,BookCover:-1})){
 const node=gltf.nodes.find(n=>n.name===name);assert.ok(node,name+' exists');assert.equal(Math.sign(node.extras.openAngle),sign,name+' correct opening direction');assert.ok(node.children?.length,name+' articulated geometry');
}
for(const id of Object.keys(targets).filter(id=>id!=='stairs'))assert.ok(gltf.nodes.some(n=>n.extras?.target===id),id+' pickable geometry');
assert.ok(gltf.nodes.find(n=>n.name==='SkullJaw'),'talking skull has independent jaw');assert.ok(bytes.length<30e6,'bounded web asset size');
const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');assert.ok(html.includes('maximum-scale=1.0,user-scalable=no'));
console.log(`PASS: ${routes} room route segments, all object approaches, metre-scaled locomotion, five hinges, cell geometry and mobile viewport.`);

// New cell uses metre dimensions, with a larger playable floor and full-height walls.
assert.equal(ROOM_METRES,5.6);
const floor=gltf.nodes.find(n=>n.name==='CellFloor');assert.ok(floor,'real pickable floor');
const hero=await fs.readFile(new URL('../public/assets/3d/barnaby.glb',import.meta.url));
const h=JSON.parse(hero.subarray(20,20+hero.readUInt32LE(12)));
assert.equal(h.skins.length,1,'skinned Barnaby');
for(const name of ['Idle','Walk','Run','Turn','Jump','Crouch'])assert.ok(h.animations.some(a=>a.name===name),'approved '+name+' clip');
assert.ok(h.nodes.find(n=>n.name==='Barnaby').extras.satchelClearance,'approved bag clearance retained');
assert.ok(hero.length<12e6,'web character size');

assert.ok(h.materials.every(m=>(m.pbrMetallicRoughness?.metallicFactor??1)===0),"Barnaby cloth is non-metallic, preventing black unlit material");
// Verify actual exported geometry can be picked from the game's camera.
import * as THREE from 'three';
const bin=bytes.subarray(28+bytes.readUInt32LE(12));
const readAccessor=i=>{const a=gltf.accessors[i],v=gltf.bufferViews[a.bufferView];const size={SCALAR:1,VEC3:3}[a.type];const ctor={5123:Uint16Array,5125:Uint32Array,5126:Float32Array}[a.componentType];const out=new ctor(a.count*size);const view=new DataView(bin.buffer,bin.byteOffset,bin.byteLength);const method={5123:'getUint16',5125:'getUint32',5126:'getFloat32'}[a.componentType];for(let k=0;k<a.count;k++)for(let c=0;c<size;c++)out[k*size+c]=view[method]((v.byteOffset??0)+(a.byteOffset??0)+k*(v.byteStride??size*ctor.BYTES_PER_ELEMENT)+c*ctor.BYTES_PER_ELEMENT,true);return out;};
const objects=gltf.nodes.map(n=>{const o=new THREE.Group();o.name=n.name??'';if(n.matrix)o.applyMatrix4(new THREE.Matrix4().fromArray(n.matrix));else{if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale);}if(n.mesh!==undefined)for(const p of gltf.meshes[n.mesh].primitives){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(readAccessor(p.attributes.POSITION),3));g.setIndex(new THREE.BufferAttribute(readAccessor(p.indices),1));const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));m.userData=n.extras??{};o.add(m);}return o;});
gltf.nodes.forEach((n,i)=>(n.children??[]).forEach(c=>objects[i].add(objects[c])));
const scene=new THREE.Group();for(const i of gltf.scenes[gltf.scene??0].nodes)scene.add(objects[i]);scene.updateMatrixWorld(true);
for(const id of ['cabinet','chest','door','table']){const target=new THREE.Vector3(...targets[id].aim),origin=new THREE.Vector3(10,10,12);const ray=new THREE.Raycaster(origin,target.clone().sub(origin).normalize());const hit=ray.intersectObject(scene,true)[0];assert.equal(hit?.object.userData.target,id,id+' frontmost visible interaction');}
console.log('PASS: real exported cabinet, barrel, door and book surfaces are selectable.');
