import fs from 'node:fs';
import ts from 'typescript';
const js=ts.transpileModule(fs.readFileSync('src/gait3d.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const {solveLeg,upperBody,bodyHeight,STRIDE_METRES,RUN_STRIDE_METRES}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const b=fs.readFileSync('public/assets/3d/traveller.glb'),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12))),rig=j.nodes.find(n=>n.name==='Traveller').extras;
const d={upper:rig.gaitUpper,lower:rig.gaitLower,stance:rig.gaitStance,idleStance:rig.gaitIdleStance},clips={};
for(const [name,blend,run,duration] of [['Idle',0,0,1],['Walk',1,0,STRIDE_METRES/1.43],['Run',1,1,RUN_STRIDE_METRES/2.7]]){
 const count=Math.round(duration*60);clips[name]=[];
 for(let i=0;i<=count;i++){
  const phase=i/count*Math.PI*2,u=upperBody(phase,blend,run),rot={Torso:[u.lean,u.twist,u.sway],Head:[0,0,-.045+Math.sin(phase-.3)*.025*blend],Backpack:[0,0,0]};
  for(const side of ['L','R']){const leg=solveLeg(phase,side,blend,run,d);rot['Leg'+side]=[leg.hip,0,0];rot['Shin'+side]=[leg.knee,0,0];rot['Foot'+side]=[leg.ankle,0,0];rot['Arm'+side]=[side==='L'?u.armL:u.armR,0,side==='L'?.06:-.06];rot['Forearm'+side]=[side==='L'?u.elbowL:u.elbowR,0,0];}
  clips[name].push({frame:i+1,body:rig.gaitDrop+bodyHeight(phase,blend,run,d)-d.stance,rot});
 }
}
fs.writeFileSync('art/gait-reference/poses.json',JSON.stringify(clips));
