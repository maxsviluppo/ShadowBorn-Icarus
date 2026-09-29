import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {blocks,walkable,configureNavigation,type UV} from './navigation';
import {Footsteps} from './footsteps';
import {advanceGait} from './gait3d';
import {RoomAudio} from './roomAudio';
import {PropMotion,type PropKind} from './propMotion';
import {Locomotion3D,WALK_SPEED,RUN_SPEED} from './locomotion3d';
import {ROOM_METRES,FLOOR_Y,targets,roomBlocks,type Target} from './roomLayout';
const $=(id:string)=>document.getElementById(id)!;
const world=(p:UV)=>new THREE.Vector3((p.u-.5)*ROOM_METRES,FLOOR_Y,(p.v-.5)*ROOM_METRES);
const uv=(v:THREE.Vector3):UV=>({u:v.x/ROOM_METRES+.5,v:v.z/ROOM_METRES+.5});
export async function startRoom3D(){
  const host=$('game-container');
  configureNavigation(roomBlocks,.24/ROOM_METRES);
  const map=$('map-furniture');map.replaceChildren();
  for(const b of blocks){const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');for(const [k,v] of Object.entries({x:b.u*100,y:b.v*100,width:b.w*100,height:b.h*100}))rect.setAttribute(k,String(v));map.append(rect);}
  const loading=document.createElement('div');loading.className='loading-3d';loading.textContent='Ouverture… La stanza prende forma.';host.append(loading);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#211b19');
  const renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;renderer.toneMappingExposure=1;
  renderer.domElement.setAttribute('aria-label','Cella di Barnaby: clicca per camminare o interagire');host.append(renderer.domElement);
  const camera=new THREE.OrthographicCamera(-7,7,6,-6,.1,80);
  camera.position.set(10,10,12);camera.lookAt(0,1.15,0);
  const hemi=new THREE.HemisphereLight(0xfff7ed,0x67615a,1.6);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xfff0d9,1.65);sun.position.set(-4,7,-3);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.5,far:25});sun.shadow.bias=-.0004;sun.shadow.normalBias=.035;sun.shadow.radius=3;scene.add(sun);
  const windowLight=new THREE.PointLight(0xffb453,2.2,3.8,1.7);windowLight.position.set(-2.20,2.18,-1.40);scene.add(windowLight);
  const fill=new THREE.DirectionalLight(0xe4edff,.65);fill.position.set(3,6,5);scene.add(fill);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshLambertMaterial({color:0x211b19}));ground.rotation.x=-Math.PI/2;ground.position.y=-.51;ground.receiveShadow=false;scene.add(ground);
  const loader=new GLTFLoader();
  const [roomFile,heroFile]=await Promise.all([loader.loadAsync('/assets/3d/prison-cell.glb?v=0.11.0'),loader.loadAsync('/assets/3d/barnaby.glb?v=0.11.0')]);
  const room=roomFile.scene,hero=heroFile.scene;scene.add(room,hero);
  hero.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=false;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(m instanceof THREE.MeshStandardMaterial){m.metalness=0;m.roughness=.95;}if(m instanceof THREE.MeshStandardMaterial&&m.map){m.map.magFilter=THREE.NearestFilter;m.map.minFilter=THREE.LinearMipmapLinearFilter;m.map.generateMipmaps=true;m.map.needsUpdate=true;}}}});
  room.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)if(m instanceof THREE.MeshStandardMaterial&&m.name==='Warm window'){m.emissive.setRGB(1,.4,.10);m.emissiveIntensity=.85;}}});
  const mixer=new THREE.AnimationMixer(hero);
  const animation=(name:string)=>{const clip=THREE.AnimationClip.findByName(heroFile.animations,name);if(!clip)throw new Error(`Missing Barnaby animation: ${name}`);const action=mixer.clipAction(clip);action.play();action.paused=true;return action;};
  const idleAction=animation('Idle'),walkAction=animation('Walk'),runAction=animation('Run');
  const door=room.getObjectByName('DoorHinge')!,lid=room.getObjectByName('ChestLid')!,key=room.getObjectByName('BrassKey')!;
  const bookCover=room.getObjectByName('BookCover')!,cabinetLeft=room.getObjectByName('CabinetLeft')!,cabinetRight=room.getObjectByName('CabinetRight')!;
  const bookRest=bookCover.quaternion.clone(),leftRest=cabinetLeft.quaternion.clone(),rightRest=cabinetRight.quaternion.clone();
  const doorRest=door.quaternion.clone(),lidRest=lid.quaternion.clone();
  // Pick the real textured surfaces; distant objects cannot be clicked through walls.
  const interactiveMeshes:THREE.Mesh[]=[];
  room.traverse(o=>{if(o instanceof THREE.Mesh)interactiveMeshes.push(o);});
  const terrain=interactiveMeshes.filter(o=>['CellFloor'].includes(o.name));
  const floorRay=new THREE.Raycaster();
  function heightAt(p:THREE.Vector3){floorRay.set(new THREE.Vector3(p.x,1.18,p.z),new THREE.Vector3(0,-1,0));const hits=floorRay.intersectObjects(terrain,false);return hits.find(h=>h.face&&h.face.normal.y>.45)?.point.y??FLOOR_Y;}
  function rotateProp(object:THREE.Object3D,rest:THREE.Quaternion,value:number){const axis=new THREE.Vector3(...object.userData.axis as [number,number,number]);object.quaternion.copy(rest).multiply(new THREE.Quaternion().setFromAxisAngle(axis,object.userData.openAngle*value));}
  const marker=new THREE.Mesh(new THREE.RingGeometry(.10,.135,32),new THREE.MeshBasicMaterial({color:0xf6d693,side:THREE.DoubleSide,transparent:true,opacity:.8,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.visible=false;scene.add(marker);
  const diagnostics=new THREE.Group();scene.add(diagnostics);diagnostics.visible=false;
  for(const b of blocks){const shape=new THREE.EdgesGeometry(new THREE.BoxGeometry(b.w*ROOM_METRES,.06,b.h*ROOM_METRES));const line=new THREE.LineSegments(shape,new THREE.LineBasicMaterial({color:0xeac37d}));line.position.copy(world({u:b.u+b.w/2,v:b.v+b.h/2}));line.position.y=.16;diagnostics.add(line);}
  let routeLine:THREE.Line|null=null;
  const tooltip=document.createElement('div');tooltip.className='object-label';tooltip.hidden=true;host.append(tooltip);
  const footsteps=new Footsteps(),audio=new RoomAudio();
  const props={book:new PropMotion('book'),chest:new PropMotion('chest'),cabinet:new PropMotion('cabinet'),door:new PropMotion('door')};
  const animateProp=(kind:PropKind,open:boolean)=>{const duration=props[kind].set(open);if(duration>0)audio.play(kind,open,duration);};
  const motion=new Locomotion3D(ROOM_METRES);
  let location:UV={u:.70,v:.79},path:UV[]=[],pending:Target|null=null,mode:'interact'|'examine'|'open'|'close'='interact';
  let doorUnlocked=false,unlockRemaining=0;
  let hasKey=false,doorOpen=false,chestOpen=false,bookOpen=false,cabinetOpen=false,completed=false,debug=false,keySelected=false;
  let speed=0,yaw=Math.PI/6,phase=0,blend=0,runBlend=0,state='idle',elapsed=0,interacting=0,routeRevision=-1;
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
    if(!['key','table','door','chest','cabinet'].includes(id)){say(targets[id].description);return;}
    interacting=.65;
    const before={book:bookOpen,chest:chestOpen,cabinet:cabinetOpen,door:doorOpen};
    const desired=(current:boolean)=>mode==='open'?true:mode==='close'?false:!current;
    if(id==='key'){
      if(mode==='open'||mode==='close'){say('Questa chiave si raccoglie. Potrà aprire la porta.');return;}
      if(!hasKey){hasKey=true;say('Una chiave! Era qui per un motivo. Probabilmente aprire qualcosa.');}
    }else if(id==='table'){bookOpen=desired(bookOpen);say(bookOpen?'Il registro del custode. Qui annota tutto... tranne dove lascia le chiavi.':'Richiudo il libro. I segreti possono aspettare.');}
    else if(id==='cabinet'){cabinetOpen=desired(cabinetOpen);say(cabinetOpen?'Le ante inferiori si aprono. Qui il custode conserva le sue cose.':'Richiudo le ante del mobile.');}
    else if(id==='chest'){chestOpen=desired(chestOpen);say(chestOpen?'Sollevo il coperchio del barile. Sa di legno e di mare.':'Rimetto il coperchio sul barile.');}
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
  function inspect(id:Target){say(id==='door'&&doorOpen?'La porta è aperta. Posso uscire.':targets[id].description);}
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-FLOOR_Y);
  function pick(event:PointerEvent){const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
    const hit=raycaster.intersectObjects(interactiveMeshes.filter(o=>o.userData.target!=='key'||!hasKey),false)[0];
    if(!hit)return undefined;
    const id=hit.object.userData.target as Target|undefined;
    if(id==='wall'&&hit.point.y<.20)return undefined;
    if(id&&!Object.hasOwn(targets,id))return undefined;
    return id;
  }
  let lastTap={time:-1000,x:0,y:0};
  renderer.domElement.addEventListener('pointerdown',event=>{if(event.button!==0)return;void footsteps.unlock();void audio.unlock();host.dataset.audioStarted='true';const id=pick(event);if(completed)return;
    const run=event.timeStamp-lastTap.time<350&&Math.hypot(event.clientX-lastTap.x,event.clientY-lastTap.y)<20;
    lastTap={time:event.timeStamp,x:event.clientX,y:event.clientY};
    if(run&&interacting>.35)return;
    if(id){if(mode==='examine'||!['key','table','door','chest','cabinet'].includes(id)){cancel();inspect(id);}else request(targets[id].goal,id,run);}
    else {
      const surface=raycaster.intersectObjects(interactiveMeshes,false)[0];
      if(surface&&surface.point.y>.20){
        if(mode==='examine'){cancel();inspect('wall');}
      }else if(raycaster.ray.intersectPlane(floorPlane,origin))request(uv(origin),null,run);
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
  function resize(){const w=host.clientWidth,h=host.clientHeight;const scale=Math.min(1,480/h);renderer.setSize(Math.round(w*scale),Math.round(h*scale),false);renderer.domElement.style.width=`${w}px`;renderer.domElement.style.height=`${h}px`;renderer.domElement.style.imageRendering="pixelated";const aspect=w/h,span=Math.max(7.4,8.4/aspect);camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(host);resize();loading.remove();
  // Play the approved Blender skin/poses, with phase driven by distance travelled.
  function pose(dt:number,moving:boolean){
    blend=THREE.MathUtils.damp(blend,moving?Math.min(1,speed/.25):0,7,dt);
    runBlend=THREE.MathUtils.damp(runBlend,THREE.MathUtils.clamp((speed-WALK_SPEED)/(RUN_SPEED-WALK_SPEED),0,1),6,dt);
    const cycle=(phase/(Math.PI*2))%1;
    idleAction.time=elapsed%idleAction.getClip().duration;
    walkAction.time=cycle*walkAction.getClip().duration;runAction.time=cycle*runAction.getClip().duration;
    idleAction.setEffectiveWeight(1-blend);walkAction.setEffectiveWeight(blend*(1-runBlend));runAction.setEffectiveWeight(blend*runBlend);
    mixer.update(0);interacting=Math.max(0,interacting-dt);
  }
  let last=performance.now(),shadowFrame=0;
  function tick(now:number){requestAnimationFrame(tick);if(document.hidden||now-last<1000/30)return;const animationDt=(now-last)/1000,dt=Math.min(animationDt,.10);last=now;elapsed+=dt;let moving=false;
    const step=completed?0:motion.step(dt);location=motion.location;path=motion.path;speed=motion.speed;moving=step>.00001;
    const gait=advanceGait(phase,step,runBlend);phase=gait.phase;footsteps.play(gait.contacts);
    if(routeRevision!==motion.revision){routeRevision=motion.revision;drawRoute();}
    if(motion.arrived&&pending){const id=pending;const aim=new THREE.Vector3(...targets[id].aim),p=world(location);if(motion.face(Math.atan2(aim.x-p.x,aim.z-p.z),dt)){pending=null;marker.visible=false;action(id);}}
    else if(motion.arrived)marker.visible=false;
    state=motion.state;yaw=motion.yaw;
    $('map-player').setAttribute('cx',String(location.u*100));$('map-player').setAttribute('cy',String(location.v*100));
    hero.position.copy(world(location));hero.position.y=heightAt(hero.position);hero.rotation.y=yaw;pose(dt,moving);
    if(unlockRemaining>0){unlockRemaining=Math.max(0,unlockRemaining-animationDt);if(unlockRemaining===0){doorUnlocked=true;doorOpen=true;keySelected=false;animateProp('door',true);say('Serratura aperta. Ora posso uscire.');sync();}}
    rotateProp(door,doorRest,props.door.step(animationDt));
    rotateProp(lid,lidRest,props.chest.step(animationDt));
    rotateProp(bookCover,bookRest,props.book.step(animationDt));
    const cabinetProgress=props.cabinet.step(animationDt);
    rotateProp(cabinetLeft,leftRest,cabinetProgress);rotateProp(cabinetRight,rightRest,cabinetProgress);
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
  host.dataset.room='0.11.0';host.dataset.character='Barnaby';sync();host.dataset.ready='true';requestAnimationFrame(tick);
}
