import {interactionPose,interactionDuration,interactionContact,type InteractionKind} from './interactionMotion';
import {throwPose,bottleFlight,THROW_RELEASE,THROW_IMPACT,THROW_DURATION} from './bottleThrow';
import {CellPuzzle,type Item,type Verb} from './cellPuzzle';
import {createPuzzleUI} from './puzzleUI';
import {loadPuzzleArt} from './puzzleArt';
import {loadCellLayers,drawCellLayer,elementUrl} from './cellLayers';
import {initAdventureUI,cursor} from './adventureUI';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {configureNavigation,walkable,type UV} from './navigation';
import {Locomotion3D,WALK_SPEED,RUN_SPEED} from './locomotion3d';
import {advanceGait} from './gait3d';
import {Footsteps} from './footsteps';
import {RoomAudio} from './roomAudio';
import {cellLayerOccludes,CELL_METRES,projectCell,unprojectCell,contains,cellBlocks,cellObjects,type CellObject} from './pixelCellLayout';
const $=(id:string)=>document.getElementById(id)!;
export async function startPixelCell(){
 initAdventureUI();
 const host=$('game-container');host.style.background='#201917';
 configureNavigation(cellBlocks,.04);
 const loading=document.createElement('p');loading.className='loading-3d';loading.textContent='La cella prende forma…';host.append(loading);
 const background=new Image();background.src=elementUrl('f0boehf0boehf0bo');
 const layers=(await loadCellLayers()).filter(l=>!l.id.startsWith('cabinet'));const puzzle=new CellPuzzle(),puzzleArt=await loadPuzzleArt();
 const [file]=await Promise.all([new GLTFLoader().loadAsync('/assets/3d/barnaby.glb?v=0.11.0'),background.decode()]);
 const backdrop=document.createElement('canvas');backdrop.width=1024;backdrop.height=559;const bg=backdrop.getContext('2d')!;bg.imageSmoothingEnabled=false;bg.drawImage(background,0,0,1024,559);
 const frame=document.createElement('div');Object.assign(frame.style,{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)'});
 const canvas=document.createElement('canvas');canvas.width=780;canvas.height=559;canvas.setAttribute('aria-label','Cella pixel art: clicca sul pavimento per camminare');Object.assign(canvas.style,{width:'100%',height:'100%',display:'block',imageRendering:'pixelated',touchAction:'none'});frame.append(canvas);host.append(frame);const ctx=canvas.getContext('2d')!;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','120 0 780 559');svg.setAttribute('role','group');svg.setAttribute('aria-label','Oggetti della cella');Object.assign(svg.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none'});frame.append(svg);
 for(const object of [...cellObjects].reverse()){
  const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',`M${object.poly.map(p=>p.join(',')).join('L')}Z`);path.setAttribute('fill','transparent');path.setAttribute('role','button');path.setAttribute('tabindex','0');path.setAttribute('aria-label',object.name);path.setAttribute('data-object',object.id);path.setAttribute('style','pointer-events:all;cursor:pointer');
  path.addEventListener('pointerenter',()=>{(path as SVGElement).style.cursor=cursor(mode==='examine'||object.id==='window'?'lens':object.id==='skull'||object.id==='mouse'?'lens':object.id==='cabinet'?'wrench':'hand');});
  const menu=()=>{if(throwing||interaction)return;pending=null;motion.stop();ui.worldMenu(path,object.id,object.description);};
  let hold:ReturnType<typeof setTimeout>|undefined,suppress=false,start={x:0,y:0};
  path.addEventListener('contextmenu',e=>{e.preventDefault();menu();});
  path.addEventListener('pointerdown',e=>{const p=e as PointerEvent;if(p.pointerType==='touch'){suppress=false;start={x:p.clientX,y:p.clientY};hold=setTimeout(()=>{suppress=true;menu();},500);}});
  path.addEventListener('pointermove',e=>{const p=e as PointerEvent;if(Math.hypot(p.clientX-start.x,p.clientY-start.y)>12)clearTimeout(hold);});
  for(const type of ['pointerup','pointercancel','pointerleave'])path.addEventListener(type,()=>clearTimeout(hold));
  path.addEventListener('keydown',e=>{if((e as KeyboardEvent).key==='ContextMenu'||((e as KeyboardEvent).shiftKey&&(e as KeyboardEvent).key==='F10')){e.preventDefault();menu();}});
  path.addEventListener('click',e=>{e.stopPropagation();if(suppress){suppress=false;return;}select(object,objectRun);objectRun=false;});
  path.addEventListener('keydown',e=>{if(['Enter',' '].includes((e as KeyboardEvent).key)){e.preventDefault();select(object,false);}});svg.append(path);
 }
 const resize=()=>{const scale=Math.min(host.clientWidth/780,host.clientHeight/559);frame.style.width=`${780*scale}px`;frame.style.height=`${559*scale}px`;};new ResizeObserver(resize).observe(host);resize();
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power',preserveDrawingBuffer:true});renderer.setSize(192,224);renderer.setPixelRatio(1);renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
 const scene=new THREE.Scene(),hero=file.scene;scene.add(hero);scene.add(new THREE.HemisphereLight(0xfff6e8,0x69635a,2));const light=new THREE.DirectionalLight(0xffefda,1.6);light.position.set(-3,6,4);scene.add(light);
 hero.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=false;o.receiveShadow=false;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof THREE.MeshStandardMaterial){m.metalness=0;m.roughness=1;
 m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',`#include <dithering_fragment>
 // RGB565 output with a subtle fixed pixel dither; texture colours remain the source.
 vec2 cell=mod(floor(gl_FragCoord.xy),2.0);
 float threshold=(cell.x==0.0?(cell.y==0.0?0.0:3.0):(cell.y==0.0?2.0:1.0))/4.0-0.375;
 vec3 levels=vec3(31.0,63.0,31.0);
 gl_FragColor.rgb=floor(clamp(gl_FragColor.rgb+threshold/levels,0.0,1.0)*levels+0.5)/levels;`);};m.customProgramCacheKey=()=>'barnaby-rgb565';if(m.map){m.map.minFilter=THREE.LinearMipmapLinearFilter;m.map.magFilter=THREE.NearestFilter;m.map.generateMipmaps=true;m.map.needsUpdate=true;}}}});
 const camera=new THREE.OrthographicCamera(-.9,.9,1.05,-1.05,.1,30);camera.position.set(6,5.7,6);camera.lookAt(0,.8,0);camera.updateMatrixWorld();const anchor=new THREE.Vector3(0,0,0).project(camera);
 const mixer=new THREE.AnimationMixer(hero);const actions=['Idle','Walk','Run'].map(name=>{const clip=THREE.AnimationClip.findByName(file.animations,name);if(!clip)throw new Error('Missing animation '+name);const a=mixer.clipAction(clip);a.play();a.paused=true;return a;});
 const motion=new Locomotion3D(CELL_METRES),footsteps=new Footsteps(),audio=new RoomAudio();let objectRun=false;let pending:CellObject|null=null,mode:'interact'|'examine'='interact',phase=0,blend=0,runBlend=0,elapsed=0,last=performance.now(),debug=false,lastTap={time:-1000,x:0,y:0};const seen=new Set<string>();let pendingVerb:Verb='interact',pendingItem:Item|undefined;
 let interaction:{kind:InteractionKind;time:number;committed:boolean;object:CellObject;verb:Verb;item?:Item}|null=null;
 let throwing:{time:number;start:{x:number;y:number}|null;impact:boolean}|null=null;
 const body=hero.getObjectByName('Body')!;
 const poseBones=['LegL','LegR','ShinL','ShinR','FootL','FootR','ArmL','ForearmL'].map(n=>hero.getObjectByName(n)!);
 const arm=hero.getObjectByName('ArmR')!,forearm=hero.getObjectByName('ForearmR')!,torso=hero.getObjectByName('Torso')!;
 let dialogueTimer:ReturnType<typeof setTimeout>|undefined;
 const say=(s:string)=>{const bag=document.getElementById('bag-toggle');if(bag?.getAttribute('aria-expanded')==='true')bag.click();clearTimeout(dialogueTimer);$('dialogue').textContent=s.replace(/[\u00ab\u00bb\u201c\u201d]/g,'');dialogueTimer=setTimeout(()=>{$('dialogue').textContent='';},7000);};
 const ui=createPuzzleUI(puzzle,say,(id,verb,item)=>{const object=cellObjects.find(o=>o.id===id);if(object)select(object,false,verb,item);});
 function finishInteraction(object:CellObject,verb:Verb,item?:Item){const wasOpen=puzzle.cabinetOpen;const result=ui.execute(object.id,verb,item);if(wasOpen!==puzzle.cabinetOpen)audio.play('cabinet',puzzle.cabinetOpen,.65);say(result||object.description);Object.assign(host.dataset,{lastObject:object.id,cabinetOpen:String(puzzle.cabinetOpen),ropeCollected:String(puzzle.ropeCut),jawGiven:String(puzzle.jawGiven)});}
 function inspect(object:CellObject){
  const kind:InteractionKind|undefined=object.id==='skull'&&pendingItem==='jaw'&&puzzle.has('jaw')&&!puzzle.jawGiven?'give':!pendingItem&&pendingVerb==='interact'&&object.id==='bed'?'sit':!pendingItem&&pendingVerb==='interact'&&object.id==='cabinet'?'cabinet':object.id==='rope'&&!puzzle.ropeCut&&puzzle.has('shard')&&(pendingItem==='shard'||(!pendingItem&&pendingVerb==='cut'))?'cut':undefined;
  if(kind){interaction={kind,time:0,committed:false,object,verb:pendingVerb,item:pendingItem};motion.stop();ui.clear();return;}
if(object.id==='barrel'&&pendingItem==='bottle'&&puzzle.has('bottle')){throwing={time:0,start:null,impact:false};motion.stop();ui.clear();say('Questa volta è vuota. Vediamo se la botte regge.');return;}const wasOpen=puzzle.cabinetOpen;const result=ui.execute(object.id,pendingVerb,pendingItem);if(wasOpen!==puzzle.cabinetOpen)audio.play('cabinet',puzzle.cabinetOpen,.65);say(result||object.description);seen.add(object.id);host.dataset.lastObject=object.id;host.dataset.cabinetOpen=String(puzzle.cabinetOpen);host.dataset.ropeCollected=String(puzzle.ropeCut);host.dataset.jawGiven=String(puzzle.jawGiven);}
 function select(object:CellObject,run:boolean,verb?:Verb,item?:Item){
  if(throwing||interaction||!puzzle.visible(object.id))return;
  void footsteps.unlock();void audio.unlock();pendingVerb=verb??(mode==='examine'?'examine':ui.defaultVerb(object.id));pendingItem=item??ui.selected;
  if(pendingVerb==='examine'&&!pendingItem){pending=null;motion.stop();inspect(object);}else if(motion.go({...object.goal},run)){pending=object;}else say('Da qui non ci arrivo. Provo a fare il giro.');
 }
 frame.addEventListener('pointerdown',event=>{if(throwing||interaction||event.button!==0)return;void footsteps.unlock();void audio.unlock();const rect=frame.getBoundingClientRect(),point={x:120+(event.clientX-rect.left)*780/rect.width,y:(event.clientY-rect.top)*559/rect.height};const run=event.timeStamp-lastTap.time<350&&Math.hypot(event.clientX-lastTap.x,event.clientY-lastTap.y)<20;lastTap={time:event.timeStamp,x:event.clientX,y:event.clientY};
  if((event.target as Element).closest('[data-object]')){objectRun=run;return;}
  const object=cellObjects.find(o=>puzzle.visible(o.id)&&o.id!=='handle'&&contains(point,o.poly.map(p=>[...p])));if(object){select(object,run);return;}const target=unprojectCell(point);if(target.u<0||target.u>1||target.v<0||target.v>1)return;pending=null;if(!motion.go(target,run))say('Qui non posso passare.');
 });
 for(const id of ['open','close'])$(id).hidden=true;
 $('interact').onclick=()=>{mode='interact';$('interact').classList.add('active');$('examine').classList.remove('active');$('interact').setAttribute('aria-pressed','true');$('examine').setAttribute('aria-pressed','false');};
 $('examine').onclick=()=>{mode='examine';$('examine').classList.add('active');$('interact').classList.remove('active');$('interact').setAttribute('aria-pressed','false');$('examine').setAttribute('aria-pressed','true');};
 $('sound').onclick=()=>{footsteps.toggle();audio.setEnabled(footsteps.enabled);void footsteps.unlock();$('sound').textContent=footsteps.enabled?'Audio: attivo':'Audio: spento';$('sound').setAttribute('aria-pressed',String(footsteps.enabled));};
 $('music').onclick=()=>{const enabled=audio.toggleMusic();$('music').textContent=enabled?'Musica: attiva':'Musica: spenta';$('music').setAttribute('aria-pressed',String(enabled));};
 $('reset').onclick=()=>{throwing=null;interaction=null;motion.reset();pending=null;Object.assign(puzzle,new CellPuzzle());ui.clear();phase=blend=runBlend=0;seen.clear();say('Una porta, una finestra e un topo. Da dove comincio?');};
 $('debug').onclick=()=>{debug=!debug;$('debug').setAttribute('aria-pressed',String(debug));};
 window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!throwing&&!interaction){pending=null;motion.stop();}if(e.key.toLowerCase()==='d')debug=!debug;});
 document.addEventListener('visibilitychange',()=>{last=performance.now();if(document.hidden)audio.pause();});
 $('map-furniture').replaceChildren();for(const b of cellBlocks){const r=document.createElementNS(svg.namespaceURI,'rect');for(const [k,v] of Object.entries({x:b.u*100,y:b.v*100,width:b.w*100,height:b.h*100}))r.setAttribute(k,String(v));$('map-furniture').append(r);}
 $('goal-key').innerHTML='<span>01</span>Osservare la porta';$('goal-door').innerHTML='<span>02</span>Esplorare il mobile';$('goal-exit').innerHTML='<span>03</span>Osservare la finestra';$('journal-title').textContent='Esplorare la cella';$('journal-dialog').querySelector('p')!.textContent='Guardati intorno. Ogni oggetto può raccontare qualcosa.';$('finish').hidden=true;
 const help=$('help-dialog').querySelectorAll('p');help[0].textContent='Nella borsa: clicca un oggetto per Esamina, Usa o le azioni speciali. Dopo Usa, clicca il bersaglio nella stanza. Esc annulla.';help[1].textContent='Interagisci con un oggetto per avvicinarti e osservarlo. Esamina per guardarlo da dove sei.';help[2].textContent='La borsa in basso a sinistra apre l’inventario (tasto I). Il diario a destra contiene audio, musica, istruzioni e obiettivi. Clic destro su un oggetto per scegliere un’azione; su touch tieni premuto. Il doppio clic resta dedicato alla corsa.';
 say('Una porta, una finestra e un topo. Da dove comincio?');
 function shadow(x:number,y:number,rx:number,ry:number,opacity:number){ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);const g=ctx.createRadialGradient(0,0,.1,0,0,1);g.addColorStop(0,`rgba(0,0,0,${opacity})`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();}
 function tick(now:number){requestAnimationFrame(tick);if(document.hidden||now-last<1000/30)return;const dt=Math.min((now-last)/1000,.10);last=now;elapsed+=dt;const previousYaw=motion.yaw;const step=motion.step(dt);
  if(motion.arrived&&pending){const object=pending;const centre={x:object.poly.reduce((a,p)=>a+p[0],0)/object.poly.length,y:object.poly.reduce((a,p)=>a+p[1],0)/object.poly.length};const aim=unprojectCell(centre);if(motion.face(Math.atan2(aim.u-motion.location.u,aim.v-motion.location.v),dt)){pending=null;inspect(object);}}
  const yawStep=Math.abs(Math.atan2(Math.sin(motion.yaw-previousYaw),Math.cos(motion.yaw-previousYaw)));
  const turning=step<.00001&&yawStep>.0001;
  const gait=advanceGait(phase,turning?yawStep*.35:step,turning?0:runBlend);phase=gait.phase;footsteps.play(gait.contacts);
  blend=THREE.MathUtils.damp(blend,turning?.62:step>.00001?Math.min(1,motion.speed/.25):0,7,dt);runBlend=THREE.MathUtils.damp(runBlend,THREE.MathUtils.clamp((motion.speed-WALK_SPEED)/(RUN_SPEED-WALK_SPEED),0,1),6,dt);
  actions[0].time=elapsed%actions[0].getClip().duration;actions[1].time=(phase/(Math.PI*2)%1)*actions[1].getClip().duration;actions[2].time=(phase/(Math.PI*2)%1)*actions[2].getClip().duration;actions[0].setEffectiveWeight(1-blend);actions[1].setEffectiveWeight(blend*(1-runBlend));actions[2].setEffectiveWeight(blend*runBlend);mixer.update(0);hero.rotation.y=motion.yaw;
  const bodyBase=body.position.clone(),boneBases=poseBones.map(b=>b.quaternion.clone());
  let seatWeight=0,heldJaw:{x:number;y:number}|null=null;
  const armBase=arm.quaternion.clone(),forearmBase=forearm.quaternion.clone(),torsoBase=torso.quaternion.clone();
  if(throwing){throwing.time+=dt;const pose=throwPose(throwing.time);arm.rotateX(pose.arm);forearm.rotateX(pose.forearm);torso.rotateX(pose.torso);hero.updateMatrixWorld(true);
   const hand=forearm.localToWorld(new THREE.Vector3(0,0,-.20)).project(camera),feet=projectCell(motion.location),h=219.3975,w=h*192/224;
   const handScreen={x:feet.x+(hand.x-anchor.x)*w/2,y:feet.y-(hand.y-anchor.y)*h/2};
   if(throwing.time<THROW_RELEASE||!throwing.start)throwing.start=handScreen;
   if(throwing.time>=THROW_IMPACT&&!throwing.impact){throwing.impact=true;audio.glassBreak();}
   if(throwing.time>=THROW_DURATION){throwing=null;say(ui.execute('barrel','interact','bottle'));}
  }
  if(interaction){
   interaction.time+=dt;const a=interaction,p=interactionPose(a.kind,a.time);seatWeight=a.kind==='sit'?p.weight:0;
   body.position.y-=p.drop;torso.rotateX(p.torso);arm.rotateX(p.arm);forearm.rotateX(p.forearm);
   poseBones[0].rotateX(p.thigh);poseBones[1].rotateX(p.thigh);poseBones[2].rotateX(p.knee);poseBones[3].rotateX(p.knee);poseBones[4].rotateX(p.ankle);poseBones[5].rotateX(p.ankle);poseBones[6].rotateX(p.arm*.55);poseBones[7].rotateX(p.forearm);
   if(a.kind==='sit')hero.rotation.y+=Math.PI*p.weight;
   if(a.kind==='give'&&!a.committed){hero.updateMatrixWorld(true);const hand=forearm.localToWorld(new THREE.Vector3(0,0,-.20)).project(camera),feet=projectCell(motion.location);heldJaw={x:feet.x+(hand.x-anchor.x)*219.3975*192/224/2,y:feet.y-(hand.y-anchor.y)*219.3975/2};}

   if(!a.committed&&a.time>=interactionContact[a.kind]){a.committed=true;if(a.kind==='sit')say('Solo un momento di riposo... poi torno a cercare una via d’uscita.');else {finishInteraction(a.object,a.verb,a.item);if(a.kind==='give')audio.click();}}
   if(a.time>=interactionDuration[a.kind])interaction=null;
  }
  host.dataset.action=interaction?interaction.kind:throwing?(throwing.time<THROW_RELEASE?'windup':throwing.time<THROW_IMPACT?'bottle-flight':'glass-falling'):'';
  host.dataset.actionTime=interaction?.time.toFixed(2)??'';
  renderer.render(scene,camera);
  body.position.copy(bodyBase);poseBones.forEach((b,i)=>b.quaternion.copy(boneBases[i]));
  arm.quaternion.copy(armBase);forearm.quaternion.copy(forearmBase);torso.quaternion.copy(torsoBase);
  ctx.clearRect(0,0,780,559);ctx.save();ctx.translate(-120,0);ctx.imageSmoothingEnabled=false;ctx.drawImage(backdrop,0,0);for(const q of [[423,365,89,19],[577,335,43,12],[671,359,39,12],[710,370,14,5]])shadow(q[0],q[1],q[2],q[3],.24);const visibleLayers=layers;for(const l of visibleLayers)drawCellLayer(ctx,l);puzzleArt.draw(ctx,puzzle);puzzleArt.drawSkull(ctx,puzzle);puzzleArt.drawFragments(ctx,puzzle);const p=projectCell(motion.location),height=219.3975,width=height*192/224;shadow(p.x,p.y+1,19,7,.30);ctx.drawImage(renderer.domElement,p.x-6*seatWeight-(anchor.x+1)/2*width,p.y-40*seatWeight-(1-anchor.y)/2*height,width,height);
  if(cellLayerOccludes('cabinet',.52,motion.location))puzzleArt.draw(ctx,puzzle);
  for(const l of visibleLayers)if(!(l.id==='bed'&&seatWeight>0)&&cellLayerOccludes(l.id,l.depth,motion.location))drawCellLayer(ctx,l);
  if(cellLayerOccludes('barrel',.82,motion.location))puzzleArt.drawFragments(ctx,puzzle);
  if(heldJaw)puzzleArt.drawHeld(ctx,'jaw',heldJaw.x,heldJaw.y);
  if(throwing&&throwing.start){const t=throwing.time;if(t<THROW_IMPACT){const b=t<THROW_RELEASE?{...throwing.start,rotation:-.25}:bottleFlight(t,throwing.start,{x:672,y:284});puzzleArt.drawBottle(ctx,b.x,b.y,b.rotation);}else{const q=Math.min(1,(t-THROW_IMPACT)/(THROW_DURATION-THROW_IMPACT));for(let i=0;i<12;i++){const a=i*2.399,x=672+Math.cos(a)*(8+17*q),y=284+Math.sin(a)*5-30*Math.sin(q*Math.PI);ctx.fillStyle=i%2?'#b4cac0':'#536f69';ctx.fillRect(Math.round(x),Math.round(y),i%3+2,2);}}}
  if(debug&&motion.path.length){ctx.beginPath();ctx.moveTo(p.x,p.y);for(const q of motion.path){const c=projectCell(q);ctx.lineTo(c.x,c.y);}ctx.strokeStyle='#e6c67a';ctx.lineWidth=1;ctx.stroke();}ctx.restore();
  $('map-player').setAttribute('cx',String(motion.location.u*100));$('map-player').setAttribute('cy',String(motion.location.v*100));$('status').textContent=motion.state==='running'?'Di corsa':motion.state==='walking'?'Un passo alla volta':motion.state==='braking'?'Rallento…':'In esplorazione';
  Object.assign(host.dataset,{motion:motion.state,walkable:String(walkable(motion.location)),u:motion.location.u.toFixed(5),v:motion.location.v.toFixed(5),pending:pending?.id??'',speed:motion.speed.toFixed(3)});
 }
 loading.remove();Object.assign(host.dataset,{ready:'true',room:'0.13.0',character:'Barnaby',background:'layered-2d'});requestAnimationFrame(tick);
}
