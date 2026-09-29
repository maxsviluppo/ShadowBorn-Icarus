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
const bytes=await fs.readFile(new URL('../public/assets/3d/adventure-room.glb',import.meta.url));const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
for(const [name,sign] of Object.entries({ChestLid:1,CabinetLeft:-1,CabinetRight:1,DoorHinge:1,BookCover:-1})){
 const node=gltf.nodes.find(n=>n.name===name);assert.ok(node,name+' exists');assert.equal(Math.sign(node.extras.openAngle),sign,name+' correct opening direction');assert.ok(node.children?.length,name+' articulated geometry');
}
for(const id of Object.keys(targets).filter(id=>id!=='stairs'))assert.ok(gltf.nodes.some(n=>n.extras?.target===id),id+' pickable geometry');
const tex=gltf.images.find(i=>i.name==='room-colour');assert.ok(tex,'original colour atlas');assert.ok(bytes.length<30e6,'bounded web asset size');
const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');assert.ok(html.includes('maximum-scale=1.0,user-scalable=no'));
console.log(`PASS: ${routes} room route segments, all object approaches, metre-scaled locomotion, five hinges, texture atlas and mobile viewport.`);
