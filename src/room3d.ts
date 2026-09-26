import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {blocks,walkable,type UV} from './navigation';
import {Footsteps} from './footsteps';
import {solveLeg,advanceGait} from './gait3d';
import {RoomAudio} from './roomAudio';
import {PropMotion,type PropKind} from './propMotion';
import {Locomotion3D,WALK_SPEED,RUN_SPEED} from './locomotion3d';

const $=(id:string)=>document.getElementById(id)!;
type Target='key'|'table'|'door'|'chest'|'cabinet';
const goals:Record<Target,UV>={key:{u:.74,v:.5},table:{u:.74,v:.5},door:{u:.43,v:.105},chest:{u:.60,v:.8},cabinet:{u:.675,v:.30}};
const world=(p:UV)=>new THREE.Vector3((p.u-.5)*8,.075,(p.v-.5)*8);
const uv=(v:THREE.Vector3):UV=>({u:v.x/8+.5,v:v.z/8+.5});

export async function startRoom3D(){
  const host=$('game-container');
  const loading=document.createElement('div');loading.className='loading-3d';loading.textContent='Ouverture… La stanza prende forma.';host.append(loading);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#182825');
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
  renderer.domElement.setAttribute('aria-label','Stanza 3D del custode: clicca per camminare o interagire');host.append(renderer.domElement);
  const camera=new THREE.OrthographicCamera(-7,7,6,-6,.1,80);
  camera.position.set(11,12,14);camera.lookAt(0,1.05,0);
  const hemi=new THREE.HemisphereLight(0xffefd3,0x526c6d,1.25);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffe5b0,2.0);sun.position.set(-3,9,4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.5,far:25});sun.shadow.bias=-.0004;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xc6dbe4,.8);fill.position.set(4,5,-2);scene.add(fill);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshLambertMaterial({color:0x182825}));ground.rotation.x=-Math.PI/2;ground.position.y=-.51;ground.receiveShadow=true;scene.add(ground);
  const loader=new GLTFLoader();
  const [roomFile,heroFile]=await Promise.all([loader.loadAsync('/assets/3d/custodian-room.glb'),loader.loadAsync('/assets/3d/traveller.glb')]);
  const room=roomFile.scene,hero=heroFile.scene;scene.add(room,hero);
  // A continuous palette with a four-band ramp keeps the illustration readable.
  const ramp=new THREE.DataTexture(new Uint8Array([100,165,215,255]),4,1,THREE.RedFormat);ramp.minFilter=THREE.NearestFilter;ramp.magFilter=THREE.NearestFilter;ramp.needsUpdate=true;
  const materials=new Map<string,THREE.MeshToonMaterial>();
  for(const root of [room,hero])root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;
    const old=o.material as THREE.MeshStandardMaterial;
    let m=materials.get(old.uuid);if(!m){m=new THREE.MeshToonMaterial({color:old.color,map:old.map,normalMap:old.normalMap,normalScale:old.normalScale,gradientMap:ramp,emissive:old.emissive,emissiveIntensity:old.emissiveIntensity??0});materials.set(old.uuid,m);}o.material=m;o.castShadow=true;o.receiveShadow=true;
  });
  // Merge leaf meshes at each articulated pivot: preserve the rig, reduce draw calls.
  function batch(parent:THREE.Object3D){
    for(const child of [...parent.children])batch(child);
    const groups=new Map<THREE.Material,THREE.Mesh[]>();
    for(const child of parent.children)if(child instanceof THREE.Mesh&&!(child instanceof THREE.SkinnedMesh)&&!child.children.length&&!Array.isArray(child.material)){const list=groups.get(child.material)??[];list.push(child);groups.set(child.material,list);}
    for(const [material,meshes] of groups){if(meshes.length<2)continue;const geometries=meshes.map(mesh=>{mesh.updateMatrix();return mesh.geometry.clone().applyMatrix4(mesh.matrix);});const geometry=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(!geometry)continue;const merged=new THREE.Mesh(geometry,material);merged.castShadow=true;merged.receiveShadow=true;parent.add(merged);meshes.forEach(m=>parent.remove(m));}
  }
  batch(room);batch(hero);
  const node=(name:string)=>{const result=hero.getObjectByName(name);if(!result)throw new Error(`Missing character joint: ${name}`);return result;};
  const joints=Object.fromEntries(['Body','Torso','Head','Backpack','ArmL','ArmR','ForearmL','ForearmR','LegL','LegR','ShinL','ShinR','FootL','FootR'].map(n=>[n,node(n)]));
  const rigData=hero.getObjectByName('Traveller')?.userData;
  const legDimensions=rigData?.gaitUpper?{upper:rigData.gaitUpper as number,lower:rigData.gaitLower as number,stance:rigData.gaitStance as number}:undefined;
  const bodyDrop=rigData?.gaitDrop as number|undefined??-.105;
  // Blender skin joints retain Z-up local axes beneath the converted root bone.
  const skinAxes=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),Math.PI/2);
  const inverseSkinAxes=skinAxes.clone().invert();
  const door=room.getObjectByName('DoorHinge')!,lid=room.getObjectByName('ChestLid')!,key=room.getObjectByName('BrassKey')!;
  const bookCover=room.getObjectByName('BookCover')!,cabinetLeft=room.getObjectByName('CabinetLeft')!,cabinetRight=room.getObjectByName('CabinetRight')!;
  const bookRest=bookCover.quaternion.clone(),leftRest=cabinetLeft.quaternion.clone(),rightRest=cabinetRight.quaternion.clone();
  const doorRest=door.quaternion.clone(),lidRest=lid.quaternion.clone();
  // Input uses solid proxy volumes, while all visible geometry remains true 3D.
  const proxies:THREE.Mesh[]=[];
  function proxy(id:Target,p:number[],s:number[]){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...s as [number,number,number]),new THREE.MeshBasicMaterial({visible:false}));mesh.position.set(...p as [number,number,number]);mesh.userData.id=id;scene.add(mesh);proxies.push(mesh);}
  proxy('cabinet',[1.4,.65,-3.3],[1.25,1.3,1.2]);proxy('key',[.89,1.27,.22],[.54,.28,.33]);proxy('table',[.44,.67,0],[2.05,1.15,1.46]);proxy('door',[-.56,1.3,-3.70],[1.55,2.6,.25]);proxy('chest',[-.4,.47,2.32],[1.28,.94,.96]);
  const marker=new THREE.Mesh(new THREE.RingGeometry(.10,.135,32),new THREE.MeshBasicMaterial({color:0xf6d693,side:THREE.DoubleSide,transparent:true,opacity:.8,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.visible=false;scene.add(marker);
  const diagnostics=new THREE.Group();scene.add(diagnostics);diagnostics.visible=false;
  for(const b of blocks){const shape=new THREE.EdgesGeometry(new THREE.BoxGeometry(b.w*8,.06,b.h*8));const line=new THREE.LineSegments(shape,new THREE.LineBasicMaterial({color:0xeac37d}));line.position.copy(world({u:b.u+b.w/2,v:b.v+b.h/2}));line.position.y=.16;diagnostics.add(line);}
  let routeLine:THREE.Line|null=null;
  const tooltip=document.createElement('div');tooltip.className='object-label';tooltip.hidden=true;host.append(tooltip);
  const footsteps=new Footsteps(),audio=new RoomAudio();
  const props={book:new PropMotion('book'),chest:new PropMotion('chest'),cabinet:new PropMotion('cabinet'),door:new PropMotion('door')};
  const animateProp=(kind:PropKind,open:boolean)=>{const duration=props[kind].set(open);if(duration>0)audio.play(kind,open,duration);};
  const motion=new Locomotion3D();
  let location:UV={u:.70,v:.79},path:UV[]=[],pending:Target|null=null,mode:'interact'|'examine'|'open'|'close'='interact';
  let doorUnlocked=false,unlockRemaining=0;
  let hasKey=false,doorOpen=false,chestOpen=false,bookOpen=false,cabinetOpen=false,completed=false,debug=false,keySelected=false;
  let speed=0,yaw=Math.PI/6,phase=0,blend=0,runBlend=0,doorAngle=0,lidAngle=0,bookAngle=0,cabinetAngle=0,state='idle',elapsed=0,interacting=0,routeRevision=-1;
  const origin=new THREE.Vector3();
  const say=(s:string)=>{$('dialogue').textContent=`«${s}»`;};
  function sync(){
    $('goal-key').classList.toggle('done',hasKey);$('goal-door').classList.toggle('done',doorOpen);$('goal-exit').classList.toggle('done',completed);
    $('key-item').hidden=!hasKey;$('empty-bag').hidden=hasKey;$('finish').hidden=!completed;
    $('status').textContent=completed?'Prova completata':state==='walking'?'Un passo alla volta':state==='turning'?'Cambio direzione':'In esplorazione';
    key.visible=!hasKey;$('key-item').classList.toggle('selected',keySelected);
  }
  function setMode(next:typeof mode){mode=next;for(const id of ['interact','examine','open','close']){$(id).classList.toggle('active',id===mode);$(id).setAttribute('aria-pressed',String(id===mode));}}
  function drawRoute(){if(routeLine){scene.remove(routeLine);routeLine.geometry.dispose();(routeLine.material as THREE.Material).dispose();routeLine=null;}
    if(path.length){routeLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints([location,...path].map(p=>world(p).setY(.16))),new THREE.LineBasicMaterial({color:0xe9cb81}));scene.add(routeLine);routeLine.visible=debug;}}
  function toggleDebug(){debug=!debug;diagnostics.visible=false;if(routeLine)routeLine.visible=debug;$('debug').setAttribute('aria-pressed',String(debug));$('debug').textContent=debug?'Nascondi percorsi':'Mostra percorsi';}
  function cancel(){unlockRemaining=0;audio.stop('lock');pending=null;motion.stop();marker.visible=false;}
  function action(id:Target){
    tooltip.hidden=true;
    interacting=.65;
    const before={book:bookOpen,chest:chestOpen,cabinet:cabinetOpen,door:doorOpen};
    const desired=(current:boolean)=>mode==='open'?true:mode==='close'?false:!current;
    if(id==='key'){
      if(mode==='open'||mode==='close'){say('Questa chiave si raccoglie. Potrà aprire la porta.');return;}
      if(!hasKey){hasKey=true;say('Una chiave! Era qui per un motivo. Probabilmente aprire qualcosa.');}
    }else if(id==='table'){bookOpen=desired(bookOpen);say(bookOpen?'Il registro del custode. Qui annota tutto... tranne dove lascia le chiavi.':'Richiudo il libro. I segreti possono aspettare.');}
    else if(id==='cabinet'){cabinetOpen=desired(cabinetOpen);say(cabinetOpen?'Tazze di riserva. Il custode è pronto a qualsiasi visita.':'Ante chiuse. Le candele restano al loro posto.');}
    else if(id==='chest'){chestOpen=desired(chestOpen);say(chestOpen?'Solo una coperta. E un calzino che non riconosco.':'Meglio richiudere. Il calzino sembrava infastidito.');}
    else if(mode==='close'){unlockRemaining=0;audio.stop('lock');doorOpen=false;say('Richiudo la porta. Ancora un momento qui dentro.');}
    else if(!hasKey){say('Chiusa. Potrei bussare... ma sono già dentro.');}
    else if(!doorOpen){
      if(unlockRemaining>0)return;
      if(!doorUnlocked){unlockRemaining=1.1;audio.play('lock',true,1.1);say('La chiave gira nella serratura...');}
      else{doorOpen=true;keySelected=false;say('La porta si apre. Posso uscire.');}
    }
    else if(mode==='open'){say('La porta è già aperta. Posso uscire con Interagisci.');}
    else{completed=true;say('Fuori mi aspetta una nuova avventura. Spero si ricordi lei di me.');}
    for(const [kind,open] of Object.entries({book:bookOpen,chest:chestOpen,cabinet:cabinetOpen,door:doorOpen}))if(before[kind as PropKind]!==open)animateProp(kind as PropKind,open);
    sync();
  }
  function request(target:UV,id:Target|null=null,run=false){if(completed)return;if(id!=='door'&&unlockRemaining>0){unlockRemaining=0;audio.stop('lock');}if(!motion.go(target,run)){say('Di lì non passo. Proviamo un’altra strada.');return;}
    pending=id;path=motion.path;marker.position.copy(world(target)).setY(.15);marker.visible=false;drawRoute();}
  function inspect(id:Target){const text={key:'Una piccola chiave di ottone. Per una piccola distrazione.',table:'Un registro rilegato. Posso aprirlo e richiuderlo.',cabinet:'Un mobile con due ante, sotto le candele.',door:doorOpen?'La strada è libera. Posso uscire.':'Una porta di legno. La serratura sembra aspettare una chiave.',chest:'Un vecchio baule. Le sue cerniere hanno ancora qualcosa da dire.'};say(text[id]);}
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-.075);
  function pick(event:PointerEvent){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(proxies.filter(p=>p.userData.id!=='key'||!hasKey));
    const surface=raycaster.intersectObject(room,true)[0],hit=hits[0];
    return hit&&(!surface||hit.distance<=surface.distance+.16)?hit.object.userData.id as Target:undefined;
  }
  let lastTap={time:-1000,x:0,y:0};
  renderer.domElement.addEventListener('pointerdown',event=>{if(event.button!==0)return;void footsteps.unlock();void audio.unlock();host.dataset.audioStarted='true';const id=pick(event);if(completed)return;
    const run=event.timeStamp-lastTap.time<350&&Math.hypot(event.clientX-lastTap.x,event.clientY-lastTap.y)<20;
    lastTap={time:event.timeStamp,x:event.clientX,y:event.clientY};
    if(run&&interacting>.35)return;
    if(id){if(mode==='examine'){cancel();inspect(id);}else request(goals[id],id,run);}
    else {
      const surface=raycaster.intersectObject(room,true)[0];
      if(surface&&surface.point.y>.18){
        const p=uv(surface.point);
        if(p.u<.14||p.v<.075){
          if(mode==='examine'){cancel();say(p.u<.14&&p.v>.29&&p.v<.75?'Una finestra profonda, con tende e un davanzale di pietra.':'Pietra solida. Meglio passarle accanto.');}
          else request({u:Math.max(.001,Math.min(.999,p.u)),v:Math.max(.001,Math.min(.999,p.v))},null,run);
        }
      }else if(raycaster.ray.intersectPlane(floorPlane,origin)){request(uv(origin),null,run);}
    }
  });
  renderer.domElement.addEventListener('pointermove',event=>{renderer.domElement.style.cursor=pick(event)&&!completed?'pointer':'default';});
  $('interact').onclick=()=>setMode('interact');$('examine').onclick=()=>setMode('examine');$('debug').onclick=toggleDebug;$('open').onclick=()=>setMode('open');$('close').onclick=()=>setMode('close');
  $('sound').onclick=()=>{footsteps.toggle();audio.setEnabled(footsteps.enabled);void footsteps.unlock();$('sound').textContent=footsteps.enabled?'Audio: attivo':'Audio: spento';$('sound').setAttribute('aria-pressed',String(footsteps.enabled));};
  $('music').onclick=()=>{const on=audio.toggleMusic();$('music').textContent=on?'Musica: attiva':'Musica: spenta';$('music').setAttribute('aria-pressed',String(on));};
  document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden)audio.pause();else if(host.dataset.audioStarted==='true')void audio.unlock();});
  $('key-item').onclick=()=>{if(completed)return;keySelected=!keySelected;setMode('interact');say('La chiave è pronta. Ora la porta.');sync();};
  function reset(){doorUnlocked=false;unlockRemaining=0;audio.stopAll();Object.values(props).forEach(p=>p.reset());motion.reset();pending=null;location=motion.location;path=motion.path;speed=0;yaw=motion.yaw;phase=0;blend=0;runBlend=0;lastTap.time=-1000;hasKey=doorOpen=chestOpen=bookOpen=cabinetOpen=completed=keySelected=false;interacting=0;marker.visible=false;drawRoute();setMode('interact');say('Dovevo ricordarmi qualcosa. Ah, sì. Uscire.');sync();}
  $('reset').onclick=reset;
  window.addEventListener('keydown',e=>{if(e.key==='Escape'){cancel();say('Un momento. Stavo pensando.');}if(e.key.toLowerCase()==='d')toggleDebug();});
  function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);const aspect=w/h,span=Math.max(11.7,13.0/aspect)/1.10;camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(host);resize();loading.remove();
  // Analytic two-link IK: soles follow a planted stance, then lift for the swing.
  // The cycle advances by travelled distance, so acceleration cannot make feet race.
  function pose(dt:number,moving:boolean){
    if(joints.Body instanceof THREE.Bone)for(const [name,joint] of Object.entries(joints))if(name!=='Body')joint.rotation.set(0,0,0);
    blend=THREE.MathUtils.damp(blend,moving?Math.min(1,speed/.25):0,7,dt);
    runBlend=THREE.MathUtils.damp(runBlend,THREE.MathUtils.clamp((speed-WALK_SPEED)/(RUN_SPEED-WALK_SPEED),0,1),6,dt);
    joints.Body.position.y=bodyDrop-.04*runBlend+Math.cos(phase*2)*(.005+.015*runBlend)*blend;
    joints.Torso.rotation.z=Math.sin(phase)*.045*blend+Math.sin(elapsed*.9)*.008;
    joints.Torso.rotation.x=(.045+.14*runBlend)*blend+Math.sin(elapsed*1.5)*.007;
    joints.Head.rotation.y=Math.sin(elapsed*.8)*.05*(1-blend);
    joints.Head.rotation.z=-.045+Math.sin(phase-.3)*.025*blend;
    joints.Backpack.rotation.x=Math.sin(phase-.6)*(.035+.04*runBlend)*blend;
    for(const side of ['L','R']){
      const leg=solveLeg(phase,side as 'L'|'R',blend,runBlend,legDimensions);
      joints['Leg'+side].rotation.x=leg.hip;joints['Shin'+side].rotation.x=leg.knee;joints['Foot'+side].rotation.x=leg.ankle;
      joints['Arm'+side].rotation.x=-Math.sin(phase+(side==='L'?0:Math.PI)-.2)*(.24+.20*runBlend)*blend;
      joints['Arm'+side].rotation.z=side==='L'?.06:-.06;
      joints['Forearm'+side].rotation.x=-.08-.75*runBlend;
    }
    if(interacting>0){interacting=Math.max(0,interacting-dt);joints.ArmR.rotation.x=-.7*Math.sin(interacting/.65*Math.PI);}
    if(joints.Body instanceof THREE.Bone)for(const [name,joint] of Object.entries(joints))if(name!=='Body')joint.quaternion.premultiply(skinAxes).multiply(inverseSkinAxes);
  }
  let last=performance.now(),shadowFrame=0;
  function tick(now:number){requestAnimationFrame(tick);if(document.hidden||now-last<1000/30)return;const animationDt=(now-last)/1000,dt=Math.min(animationDt,.10);last=now;elapsed+=dt;let moving=false;
    const step=completed?0:motion.step(dt);location=motion.location;path=motion.path;speed=motion.speed;moving=step>.00001;
    const gait=advanceGait(phase,step,runBlend);phase=gait.phase;footsteps.play(gait.contacts);
    if(routeRevision!==motion.revision){routeRevision=motion.revision;drawRoute();}
    if(motion.arrived&&pending){const id=pending;const aim=id==='door'?new THREE.Vector3(-.56,0,-4):id==='cabinet'?new THREE.Vector3(1.4,0,-3.3):id==='chest'?new THREE.Vector3(-.4,0,2.32):new THREE.Vector3(.44,0,0),p=world(location);if(motion.face(Math.atan2(aim.x-p.x,aim.z-p.z),dt)){pending=null;marker.visible=false;action(id);}}
    else if(motion.arrived)marker.visible=false;
    state=motion.state;yaw=motion.yaw;
    $('map-player').setAttribute('cx',String(location.u*100));$('map-player').setAttribute('cy',String(location.v*100));
    hero.position.copy(world(location));hero.rotation.y=yaw;pose(dt,moving);
    if(unlockRemaining>0){unlockRemaining=Math.max(0,unlockRemaining-animationDt);if(unlockRemaining===0){doorUnlocked=true;doorOpen=true;keySelected=false;animateProp('door',true);say('Serratura aperta. Ora posso uscire.');sync();}}
    doorAngle=props.door.step(animationDt)*1.48;door.quaternion.copy(doorRest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),doorAngle));
    lidAngle=props.chest.step(animationDt)*-1.25;lid.quaternion.copy(lidRest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),lidAngle));
    bookAngle=props.book.step(animationDt)*2.85;bookCover.quaternion.copy(bookRest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),bookAngle));
    cabinetAngle=props.cabinet.step(animationDt)*1.65;
    cabinetLeft.quaternion.copy(leftRest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-cabinetAngle));
    cabinetRight.quaternion.copy(rightRest).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),cabinetAngle));
    host.dataset.musicPlaying=String(audio.musicPlaying);host.dataset.audioReady=String(audio.ready);host.dataset.sfx=String(audio.played);host.dataset.lastSound=audio.last;host.dataset.sampledSteps=String(footsteps.sampled);
    host.dataset.book=String(bookOpen);host.dataset.cabinet=String(cabinetOpen);host.dataset.chest=String(chestOpen);
    if(debug){host.dataset.motion=state;host.dataset.speed=speed.toFixed(4);host.dataset.run=String(motion.running);host.dataset.u=location.u.toFixed(5);host.dataset.v=location.v.toFixed(5);host.dataset.steps=String(footsteps.played);host.dataset.drawCalls=String(renderer.info.render.calls);host.dataset.triangles=String(renderer.info.render.triangles);}
    const statusText=completed?'Prova completata':state==='running'?'Di corsa, con giudizio':state==='braking'?'Rallento…':state==='walking'?'Un passo alla volta':state==='turning'?'Cambio direzione':'In esplorazione';
    if($('status').textContent!==statusText)$('status').textContent=statusText;
    if(++shadowFrame%3===0)renderer.shadowMap.needsUpdate=true;
    renderer.render(scene,camera);
  }
  // Read-only diagnostics for reproducible end-to-end tests; no alternate game controls.
  (window as unknown as {room3d:unknown}).room3d={snapshot:()=>({location:{...location},state,path:[...path],pending,hasKey,doorOpen,chestOpen,completed,steps:footsteps.played,audio:footsteps.state,walkable:walkable(location),triangles:renderer.info.render.triangles,calls:renderer.info.render.calls}),screen:(p:UV,height=.075)=>{const v=world(p).setY(height).project(camera),r=renderer.domElement.getBoundingClientRect();return{x:r.left+(v.x+1)*r.width/2,y:r.top+(1-v.y)*r.height/2};}};
  sync();host.dataset.ready='true';requestAnimationFrame(tick);
}
