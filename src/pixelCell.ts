import {loadCellLayers,drawCellLayer,elementUrl} from './cellLayers';
import {initAdventureUI,cursor} from './adventureUI';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {configureNavigation,walkable,type UV} from './navigation';
import {Locomotion3D,WALK_SPEED,RUN_SPEED} from './locomotion3d';
import {advanceGait} from './gait3d';
import {Footsteps} from './footsteps';
import {RoomAudio} from './roomAudio';
import {CELL_METRES,projectCell,unprojectCell,contains,cellBlocks,cellObjects,type CellObject} from './pixelCellLayout';
const $=(id:string)=>document.getElementById(id)!;
export async function startPixelCell(){
 initAdventureUI();
 const host=$('game-container');host.style.background='#201917';
 configureNavigation(cellBlocks,.035);
 const loading=document.createElement('p');loading.className='loading-3d';loading.textContent='La cella prende forma…';host.append(loading);
 const background=new Image();background.src=elementUrl('f0boehf0boehf0bo');
 const layers=await loadCellLayers();let cabinetOpen=false;
 const [file]=await Promise.all([new GLTFLoader().loadAsync('/assets/3d/barnaby.glb?v=0.11.0'),background.decode()]);
 const backdrop=document.createElement('canvas');backdrop.width=1024;backdrop.height=559;const bg=backdrop.getContext('2d')!;bg.imageSmoothingEnabled=false;bg.drawImage(background,0,0,1024,559);
 const frame=document.createElement('div');Object.assign(frame.style,{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)'});
 const canvas=document.createElement('canvas');canvas.width=780;canvas.height=559;canvas.setAttribute('aria-label','Cella pixel art: clicca sul pavimento per camminare');Object.assign(canvas.style,{width:'100%',height:'100%',display:'block',imageRendering:'pixelated',touchAction:'none'});frame.append(canvas);host.append(frame);const ctx=canvas.getContext('2d')!;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','120 0 780 559');svg.setAttribute('role','group');svg.setAttribute('aria-label','Oggetti della cella');Object.assign(svg.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none'});frame.append(svg);
 for(const object of [...cellObjects].reverse()){
  const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',`M${object.poly.map(p=>p.join(',')).join('L')}Z`);path.setAttribute('fill','transparent');path.setAttribute('role','button');path.setAttribute('tabindex','0');path.setAttribute('aria-label',object.name);path.setAttribute('data-object',object.id);path.setAttribute('style','pointer-events:all;cursor:pointer');
  path.addEventListener('pointerenter',()=>{(path as SVGElement).style.cursor=cursor(mode==='examine'||object.id==='window'?'lens':object.id==='skull'||object.id==='mouse'?'lens':object.id==='cabinet'?'wrench':'hand');});
  path.addEventListener('contextmenu',e=>{e.preventDefault();pending=null;motion.stop();const previous=mode;mode='examine';inspect(object);mode=previous;});
  path.addEventListener('click',e=>{e.stopPropagation();select(object,objectRun);objectRun=false;});
  path.addEventListener('keydown',e=>{if(['Enter',' '].includes((e as KeyboardEvent).key)){e.preventDefault();select(object,false);}});svg.append(path);
 }
 const resize=()=>{const scale=Math.min(host.clientWidth/780,host.clientHeight/559);frame.style.width=`${780*scale}px`;frame.style.height=`${559*scale}px`;};new ResizeObserver(resize).observe(host);resize();
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power',preserveDrawingBuffer:true});renderer.setSize(192,224);renderer.setPixelRatio(1);renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),hero=file.scene;scene.add(hero);scene.add(new THREE.HemisphereLight(0xfff6e8,0x69635a,2));const light=new THREE.DirectionalLight(0xffefda,1.6);light.position.set(-3,6,4);scene.add(light);
 hero.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=false;o.receiveShadow=false;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof THREE.MeshStandardMaterial){m.metalness=0;m.roughness=1;if(m.map){m.map.minFilter=THREE.LinearMipmapLinearFilter;m.map.magFilter=THREE.NearestFilter;m.map.generateMipmaps=true;m.map.needsUpdate=true;}}}});
 const camera=new THREE.OrthographicCamera(-.9,.9,1.05,-1.05,.1,30);camera.position.set(6,5.7,6);camera.lookAt(0,.8,0);camera.updateMatrixWorld();const anchor=new THREE.Vector3(0,0,0).project(camera);
 const mixer=new THREE.AnimationMixer(hero);const actions=['Idle','Walk','Run'].map(name=>{const clip=THREE.AnimationClip.findByName(file.animations,name);if(!clip)throw new Error('Missing animation '+name);const a=mixer.clipAction(clip);a.play();a.paused=true;return a;});
 const motion=new Locomotion3D(CELL_METRES),footsteps=new Footsteps(),audio=new RoomAudio();let objectRun=false;let pending:CellObject|null=null,mode:'interact'|'examine'='interact',phase=0,blend=0,runBlend=0,elapsed=0,last=performance.now(),debug=false,lastTap={time:-1000,x:0,y:0};const seen=new Set<string>();
 const say=(s:string)=>{$('dialogue').textContent=`«${s}»`;};
 function inspect(object:CellObject){if(object.id==='cabinet'&&mode==='interact'){cabinetOpen=!cabinetOpen;audio.play('cabinet',cabinetOpen,.65);host.dataset.cabinetOpen=String(cabinetOpen);say(cabinetOpen?'L’anta cigola. Vediamo che cosa nasconde…':'Meglio richiudere, per ora.');}else say(object.description);seen.add(object.id);host.dataset.lastObject=object.id;for(const [id,target] of [['goal-key','door'],['goal-door','cabinet'],['goal-exit','window']])$(id).classList.toggle('done',seen.has(target));}
 function select(object:CellObject,run:boolean){void footsteps.unlock();void audio.unlock();if(mode==='examine'){pending=null;motion.stop();inspect(object);}else if(motion.go({...object.goal},run)){pending=object;}else say('Da qui non ci arrivo. Provo a fare il giro.');}
 frame.addEventListener('pointerdown',event=>{if(event.button!==0)return;void footsteps.unlock();void audio.unlock();const rect=frame.getBoundingClientRect(),point={x:120+(event.clientX-rect.left)*780/rect.width,y:(event.clientY-rect.top)*559/rect.height};const run=event.timeStamp-lastTap.time<350&&Math.hypot(event.clientX-lastTap.x,event.clientY-lastTap.y)<20;lastTap={time:event.timeStamp,x:event.clientX,y:event.clientY};
  if((event.target as Element).closest('[data-object]')){objectRun=run;return;}
  const object=cellObjects.find(o=>contains(point,o.poly.map(p=>[...p])));if(object){select(object,run);return;}const target=unprojectCell(point);if(target.u<0||target.u>1||target.v<0||target.v>1)return;pending=null;if(!motion.go(target,run))say('Qui non posso passare.');
 });
 for(const id of ['open','close'])$(id).hidden=true;
 $('interact').onclick=()=>{mode='interact';$('interact').classList.add('active');$('examine').classList.remove('active');$('interact').setAttribute('aria-pressed','true');$('examine').setAttribute('aria-pressed','false');};
 $('examine').onclick=()=>{mode='examine';$('examine').classList.add('active');$('interact').classList.remove('active');$('interact').setAttribute('aria-pressed','false');$('examine').setAttribute('aria-pressed','true');};
 $('sound').onclick=()=>{footsteps.toggle();audio.setEnabled(footsteps.enabled);void footsteps.unlock();$('sound').textContent=footsteps.enabled?'Audio: attivo':'Audio: spento';$('sound').setAttribute('aria-pressed',String(footsteps.enabled));};
 $('music').onclick=()=>{const enabled=audio.toggleMusic();$('music').textContent=enabled?'Musica: attiva':'Musica: spenta';$('music').setAttribute('aria-pressed',String(enabled));};
 $('reset').onclick=()=>{motion.reset();pending=null;cabinetOpen=false;host.dataset.cabinetOpen='false';phase=blend=runBlend=0;seen.clear();for(const id of ['goal-key','goal-door','goal-exit'])$(id).classList.remove('done');say('Una porta, una finestra e un topo. Da dove comincio?');};
 $('debug').onclick=()=>{debug=!debug;$('debug').setAttribute('aria-pressed',String(debug));};
 window.addEventListener('keydown',e=>{if(e.key==='Escape'){pending=null;motion.stop();}if(e.key.toLowerCase()==='d')debug=!debug;});
 document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden)audio.pause();});
 $('map-furniture').replaceChildren();for(const b of cellBlocks){const r=document.createElementNS(svg.namespaceURI,'rect');for(const [k,v] of Object.entries({x:b.u*100,y:b.v*100,width:b.w*100,height:b.h*100}))r.setAttribute(k,String(v));$('map-furniture').append(r);}
 $('goal-key').innerHTML='<span>01</span>Osservare la porta';$('goal-door').innerHTML='<span>02</span>Esplorare il mobile';$('goal-exit').innerHTML='<span>03</span>Osservare la finestra';$('journal-title').textContent='Esplorare la cella';$('journal-dialog').querySelector('p')!.textContent='Guardati intorno. Ogni oggetto può raccontare qualcosa.';$('key-item').hidden=true;$('finish').hidden=true;
 const help=$('help-dialog').querySelectorAll('p');help[1].textContent='Interagisci con un oggetto per avvicinarti e osservarlo. Esamina per guardarlo da dove sei.';help[2].textContent='La borsa in basso a sinistra apre l’inventario (tasto I). Il diario a destra contiene audio, musica, istruzioni e obiettivi. Clic destro su un oggetto per esaminarlo; su touch scegli Esamina nel diario.';
 say('Una porta, una finestra e un topo. Da dove comincio?');
 function tick(now:number){requestAnimationFrame(tick);if(document.hidden||now-last<1000/30)return;const dt=Math.min((now-last)/1000,.10);last=now;elapsed+=dt;const step=motion.step(dt);const gait=advanceGait(phase,step,runBlend);phase=gait.phase;footsteps.play(gait.contacts);
  if(motion.arrived&&pending){const object=pending;const centre={x:object.poly.reduce((a,p)=>a+p[0],0)/object.poly.length,y:object.poly.reduce((a,p)=>a+p[1],0)/object.poly.length};const aim=unprojectCell(centre);if(motion.face(Math.atan2(aim.u-motion.location.u,aim.v-motion.location.v),dt)){pending=null;inspect(object);}}
  blend=THREE.MathUtils.damp(blend,step>.00001?Math.min(1,motion.speed/.25):0,7,dt);runBlend=THREE.MathUtils.damp(runBlend,THREE.MathUtils.clamp((motion.speed-WALK_SPEED)/(RUN_SPEED-WALK_SPEED),0,1),6,dt);
  actions[0].time=elapsed%actions[0].getClip().duration;actions[1].time=(phase/(Math.PI*2)%1)*actions[1].getClip().duration;actions[2].time=(phase/(Math.PI*2)%1)*actions[2].getClip().duration;actions[0].setEffectiveWeight(1-blend);actions[1].setEffectiveWeight(blend*(1-runBlend));actions[2].setEffectiveWeight(blend*runBlend);mixer.update(0);hero.rotation.y=motion.yaw;renderer.render(scene,camera);
  ctx.clearRect(0,0,780,559);ctx.save();ctx.translate(-120,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(backdrop,0,0);const visibleLayers=layers.filter(l=>l.id!==(cabinetOpen?'cabinet':'cabinet-open'));for(const l of visibleLayers)drawCellLayer(ctx,l);const p=projectCell(motion.location),height=184,width=height*192/224;ctx.drawImage(renderer.domElement,p.x-(anchor.x+1)/2*width,p.y-(1-anchor.y)/2*height,width,height);
  for(const l of visibleLayers)if(motion.location.u+motion.location.v<l.depth)drawCellLayer(ctx,l);
  if(debug&&motion.path.length){ctx.beginPath();ctx.moveTo(p.x,p.y);for(const q of motion.path){const c=projectCell(q);ctx.lineTo(c.x,c.y);}ctx.strokeStyle='#e6c67a';ctx.lineWidth=1;ctx.stroke();}ctx.restore();
  $('map-player').setAttribute('cx',String(motion.location.u*100));$('map-player').setAttribute('cy',String(motion.location.v*100));$('status').textContent=motion.state==='running'?'Di corsa':motion.state==='walking'?'Un passo alla volta':motion.state==='braking'?'Rallento…':'In esplorazione';
  Object.assign(host.dataset,{motion:motion.state,walkable:String(walkable(motion.location)),u:motion.location.u.toFixed(5),v:motion.location.v.toFixed(5),pending:pending?.id??'',speed:motion.speed.toFixed(3)});
 }
 loading.remove();Object.assign(host.dataset,{ready:'true',room:'0.13.0',character:'Barnaby',background:'layered-2d'});requestAnimationFrame(tick);
}
