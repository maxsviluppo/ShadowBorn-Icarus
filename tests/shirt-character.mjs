import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Object3D,Vector3,Quaternion} from 'three';
const file=fs.readFileSync('public/assets/3d/shirt-hero.glb');
const length=file.readUInt32LE(12),g=JSON.parse(file.subarray(20,20+length)),bin=file.subarray(28+length);
function values(index){
 const a=g.accessors[index],v=g.bufferViews[a.bufferView],width={SCALAR:1,VEC3:3,VEC4:4}[a.type];
 assert.equal(a.componentType,5126);
 return Array.from({length:a.count},(_,i)=>Array.from({length:width},(_,j)=>bin.readFloatLE((v.byteOffset??0)+(a.byteOffset??0)+i*(v.byteStride??width*4)+j*4)));
}
const nodes=g.nodes.map(n=>{const o=new Object3D();o.name=n.name??'';if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale);return o;});
g.nodes.forEach((n,i)=>(n.children??[]).forEach(j=>nodes[i].add(nodes[j])));
const roots=nodes.filter(n=>!n.parent),byName=n=>nodes.find(o=>o.name===n);
for(const side of ['L','R'])assert.equal(byName('Hand'+side)?.parent?.name,'Forearm'+side,'prop anchors follow the new hands');
for(const mesh of g.meshes)for(const p of mesh.primitives){
 assert.ok(p.attributes.TEXCOORD_0!==undefined,'source UVs preserved');
 for(const w of values(p.attributes.WEIGHTS_0))assert.ok(Math.abs(w.reduce((a,b)=>a+b,0)-1)<1e-5,'skin weights normalized');
}
const world=n=>byName(n).getWorldPosition(new Vector3());
function sample(clip,t){
 for(const c of clip.channels){const s=clip.samplers[c.sampler],times=values(s.input).flat(),out=values(s.output);let i=times.findIndex(x=>x>=t);if(i<0)i=times.length-1;const j=Math.max(0,i-1),a=i===j?0:(t-times[j])/(times[i]-times[j]),o=nodes[c.target.node];
  if(c.target.path==='rotation')o.quaternion.fromArray(out[j]).slerp(new Quaternion().fromArray(out[i]),a);
  else if(c.target.path==='translation')o.position.fromArray(out[j]).lerp(new Vector3().fromArray(out[i]),a);
 }
 roots.forEach(r=>r.updateMatrixWorld(true));
}
for(const name of ['Idle','Walk','Run']){
 const clip=g.animations.find(a=>a.name===name);assert.ok(clip);
 const duration=Math.max(...clip.samplers.map(s=>values(s.input).at(-1)[0]));
 for(const c of clip.channels){const out=values(clip.samplers[c.sampler].output),first=out[0],last=out.at(-1);assert.ok(first.every((x,i)=>Math.abs(x-last[i])<1e-4),`${name} loop seam: ${g.nodes[c.target.node].name}`);}
 if(name!=='Idle'){
  const duty=name==='Walk'?.58:.40;
  for(const side of ['L','R']){const y=[];
   for(let p=.08;p<duty-.02;p+=.04){sample(clip,((p+(side==='L'?0:.5))%1)*duration);y.push(world('Foot'+side).y);const body=world('Body');assert.ok(Math.abs(body.x)<1e-6&&Math.abs(body.z)<1e-6,'no horizontal root motion');}
   assert.ok(Math.max(...y)-Math.min(...y)<.008,`${name}: planted ${side} foot stays at floor height`);
  }
 }
}
assert.ok(file.length<23e6,'mobile asset size budget');
console.log('PASS shirt hero: continuous idle/walk/run loops, planted support feet and no root translation.');
