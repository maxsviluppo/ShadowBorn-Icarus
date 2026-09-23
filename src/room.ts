import Phaser from 'phaser';
import {blocks, findPath, project, unproject, walkable, type UV, type Point, type Block} from './navigation';
import {CharacterMotion} from './characterMotion';
import {CharacterRenderer,registerCleanWalkTextures} from './characterRenderer';
import {Footsteps} from './footsteps';

const dirs=['E','SE','S','SO','O','NO','N','NE'];
type ObjectId='key'|'door'|'table'|'chest';
type Mode='interact'|'examine';
const el=(id:string)=>document.getElementById(id)!;
const actionPoints:Record<ObjectId,UV>={key:{u:.74,v:.5},table:{u:.74,v:.5},door:{u:.43,v:.105},chest:{u:.60,v:.80}};

export class RoomScene extends Phaser.Scene {
  private player!:Phaser.GameObjects.Sprite;
  private actor!:CharacterRenderer;
  private motion=new CharacterMotion();
  private footsteps=new Footsteps();
  private location:UV={u:.70,v:.79};
  private path:UV[]=[];
  private afterArrival:(()=>void)|null=null;
  private arrivalFacing:number|null=null;
  private mode:Mode='interact';
  private hasKey=false;
  private keySelected=false;
  private doorOpen=false;
  private completed=false;
  private debug=false;
  private diagnostics!:Phaser.GameObjects.Graphics;
  private routeGraphic!:Phaser.GameObjects.Graphics;
  private doorGraphic!:Phaser.GameObjects.Graphics;
  private keyGraphic!:Phaser.GameObjects.Graphics;
  private targetMark!:Phaser.GameObjects.Ellipse;
  private hoverLabel!:Phaser.GameObjects.Text;
  private bubble!:Phaser.GameObjects.Text;
  private cleanup:(()=>void)[]=[];
  constructor(){super('Room');}
  preload(){
    this.load.image('room','assets/room.png');
    this.load.image('table-prop','assets/props/table.png');
    this.load.image('chest-prop','assets/props/chest.png');
    for(const dir of dirs)this.load.spritesheet(dir,`assets/character/${dir}.png`,{frameWidth:160,frameHeight:192});
    this.load.spritesheet('turn','assets/character/turn.png',{frameWidth:160,frameHeight:192});
    this.load.on('loaderror',()=>this.say('Una risorsa non è stata caricata. Ricarica la pagina.'));
  }
  create(){
    this.cameras.main.setScroll(0,85);
    this.add.image(512,512,'room').setDepth(0);
    this.drawTable();this.drawChest();
    this.doorGraphic=this.add.graphics().setDepth(580);this.drawDoor();
    this.keyGraphic=this.add.graphics().setDepth(706);this.drawKey();
    this.addOcclusion([[646,653],[651,686],[657,673],[663,649],[669,680],[680,667],[685,695],[699,685],[700,721],[687,744],[679,781],[692,798],[681,809],[662,804],[642,801],[644,789],[657,782],[657,751],[638,729],[632,700],[641,694]],798);
    this.addOcclusion([[147,568],[166,551],[181,566],[190,607],[206,622],[206,659],[191,676],[197,697],[183,706],[171,692],[151,702],[143,691],[158,671],[159,631],[140,612]],698);
    const p=project(this.location);
    registerCleanWalkTextures(this);
    this.actor=new CharacterRenderer(this);this.player=this.actor.body;
    this.actor.update(this.motion,p.x,p.y,1);
    this.targetMark=this.add.ellipse(0,0,18,9).setStrokeStyle(1.5,0xe6d394,.8).setDepth(2).setVisible(false);
    this.diagnostics=this.add.graphics().setDepth(1500).setVisible(false);
    this.routeGraphic=this.add.graphics().setDepth(1501).setVisible(false);
    this.hoverLabel=this.add.text(0,0,'',{fontFamily:'Georgia',fontSize:'18px',color:'#f8e7b5',backgroundColor:'#1e281de8',padding:{x:12,y:8}}).setOrigin(.5,1).setDepth(2000).setVisible(false);
    this.bubble=this.add.text(0,0,'',{fontFamily:'Georgia',fontSize:'16px',color:'#fff0c8',backgroundColor:'#192019e8',padding:{x:12,y:8}}).setOrigin(.5,1).setDepth(2001).setVisible(false);
    this.drawDebug();
    this.input.on('pointerdown',(pointer:Phaser.Input.Pointer)=>this.handleClick({x:pointer.worldX,y:pointer.worldY}));
    this.input.on('pointermove',(pointer:Phaser.Input.Pointer)=>{
      const hit=this.hitObject({x:pointer.worldX,y:pointer.worldY});
      const names={key:'Chiave di ottone',door:this.doorOpen?'Porta aperta':'Porta chiusa',table:'Tavolo del custode',chest:'Baule dimenticato'};
      this.hoverLabel.setVisible(!!hit&&!this.completed);
      if(hit)this.hoverLabel.setText(names[hit]).setPosition(pointer.worldX,pointer.worldY-18);
      this.input.setDefaultCursor(hit?'pointer':'default');
    });
    this.input.on('gameout',()=>this.hoverLabel.setVisible(false));
    const bind=(id:string,fn:()=>void)=>{const button=el(id);button.addEventListener('click',fn);this.cleanup.push(()=>button.removeEventListener('click',fn));};
    bind('interact',()=>this.setMode('interact'));bind('examine',()=>this.setMode('examine'));
    bind('debug',()=>this.toggleDebug());bind('reset',()=>this.resetRoom());
    bind('sound',()=>{this.footsteps.toggle();void this.footsteps.unlock().then(()=>this.syncSound());this.syncSound();});
    bind('key-item',()=>{if(this.completed)return;this.setMode('interact');this.keySelected=!this.keySelected;el('key-item').classList.toggle('selected',this.keySelected);this.say(this.keySelected?'«Una chiave. Adesso mi serve soltanto una serratura.»':'«La rimetto al sicuro. Più o meno.»');});
    this.input.keyboard?.on('keydown-ESC',()=>{this.cancel();this.keySelected=false;el('key-item').classList.remove('selected');this.say('«Un momento. Stavo pensando.»');});
    this.input.keyboard?.on('keydown-D',()=>this.toggleDebug());
    this.events.once('shutdown',()=>{this.cleanup.forEach(fn=>fn());this.footsteps.close();});
    this.syncUI();
  }
  private say(text:string){el('dialogue').textContent=text;}
  private setStatus(text:string){el('status').textContent=text;}
  private syncSound(){el('sound').textContent=this.footsteps.enabled?'Passi: attivi':'Passi: spenti';el('sound').setAttribute('aria-pressed',String(this.footsteps.enabled));}
  private setMode(mode:Mode){
    this.mode=mode;
    if(mode==='examine'){this.keySelected=false;el('key-item').classList.remove('selected');}
    for(const id of ['interact','examine']){el(id).classList.toggle('active',mode===id);el(id).setAttribute('aria-pressed',String(mode===id));}
  }
  private syncUI(){
    el('key-item').hidden=!this.hasKey;el('empty-bag').hidden=this.hasKey;
    el('goal-key').classList.toggle('done',this.hasKey);el('goal-door').classList.toggle('done',this.doorOpen);el('goal-exit').classList.toggle('done',this.completed);el('finish').hidden=!this.completed;
  }
  private hitObject(p:Point):ObjectId|null{
    if(!this.hasKey&&Math.hypot((p.x-538)/1.4,p.y-634)<24)return'key';
    if(Phaser.Geom.Polygon.Contains(new Phaser.Geom.Polygon([{x:650,y:401},{x:724,y:439},{x:724,y:593},{x:650,y:556}]),p.x,p.y))return'door';
    if(Phaser.Geom.Polygon.Contains(new Phaser.Geom.Polygon([{x:438,y:634},{x:521,y:589},{x:635,y:650},{x:554,y:707},{x:454,y:653}]),p.x,p.y))return'table';
    if(p.x>304&&p.x<440&&p.y>648&&p.y<773)return'chest';
    return null;
  }
  private handleClick(p:Point){
    void this.footsteps.unlock().then(()=>this.syncSound());
    if(this.completed)return;
    this.hoverLabel.setVisible(false);
    const hit=this.hitObject(p);
    if(hit){
      const requestedMode=this.mode;
      if(requestedMode==='examine'){
        this.cancel();
        this.say(({key:'«Una chiave sul tavolo. Quasi troppo facile. Mi insospettisce.»',door:this.doorOpen?'«Finalmente una porta con cui si può ragionare.»':'«Chiusa. La serratura ha il colore dell’ottone.»',table:'«Il custode è ordinato. Quella cosa lucida, invece, sembra fuori posto.»',chest:'«Un baule vissuto. Come me, ma con meno dubbi.»'})[hit]);
      }else{
        const faces:Record<ObjectId,Point>={key:{x:538,y:634},table:{x:538,y:640},door:{x:683,y:540},chest:{x:370,y:700}};
        this.goTo(actionPoints[hit],()=>this.interact(hit),faces[hit]);
      }
      return;
    }
    const target=unproject(p);
    if(target.u<0||target.u>1||target.v<0||target.v>1){this.say('«Meglio restare sul pavimento.»');return;}
    this.goTo(target);
  }
  private goTo(target:UV,done:(()=>void)|null=null,lookAt?:Point){
    const path=findPath(this.location,target);
    if(!path){this.cancel();this.say('«Da qui non riesco a passare.»');return;}
    this.path=path;this.afterArrival=done;
    const end=project(path[path.length-1]);this.targetMark.setPosition(end.x,end.y).setVisible(true);
    this.arrivalFacing=lookAt?Math.atan2(lookAt.y-end.y,lookAt.x-end.x):null;
    this.setStatus(done?'Mi avvicino…':'In cammino');this.bubble.setVisible(false);this.drawRoute();
  }
  private cancel(){this.path=[];this.afterArrival=null;this.arrivalFacing=null;this.motion.stop();this.targetMark.setVisible(false);this.setStatus(this.completed?'Prova completata':'In esplorazione');this.drawRoute();}
  private interact(id:ObjectId){
    if(id==='key'){
      if(this.hasKey)return;
      this.hasKey=true;this.keyGraphic.setVisible(false);this.say('«Una chiave! La metto nello zaino. Questa volta me lo ricorderò.»');this.shortBubble('Trovata!');
    }else if(id==='door'){
      if(this.doorOpen){this.completed=true;this.cancel();this.actor.setAlpha(.55);this.say('«Ecco, sono fuori. Ora… perché ero entrato?»');this.setStatus('Prova completata');}
      else if(this.hasKey){this.doorOpen=true;this.keySelected=false;el('key-item').classList.remove('selected');this.drawDoor();this.say('«Gira! Era proprio la chiave giusta. Clicco ancora sulla porta e vado.»');this.shortBubble('Clic.');}
      else{this.say('«Niente. Mi manca una chiave. O una buona scusa.»');this.shortBubble('È chiusa.');}
    }else if(id==='table')this.say('«Sul tavolo c’è una chiave.»'+(this.hasKey?' «C’era. È nel mio zaino, adesso.»':' «Meglio prenderla prima di distrarmi.»'));
    else this.say(this.keySelected?'«Questa chiave non entra. Il baule, però, era già aperto.»':'«Dentro ci sono soltanto calzini. Nessuno fa coppia. Mi sento capito.»');
    this.syncUI();
  }
  private shortBubble(text:string){this.bubble.setText(text).setVisible(true);this.time.delayedCall(2100,()=>this.bubble.setVisible(false));}
  private resetRoom(){
    this.hoverLabel.setVisible(false);this.input.setDefaultCursor('default');
    this.cancel();this.hasKey=false;this.doorOpen=false;this.completed=false;this.keySelected=false;this.location={u:.70,v:.79};this.motion.reset();
    this.actor.reset();this.keyGraphic.setVisible(true);this.bubble.setVisible(false);el('key-item').classList.remove('selected');this.setMode('interact');this.drawDoor();this.syncUI();this.setStatus('In esplorazione');this.say('«Dovevo ricordarmi qualcosa. Ah, sì. Uscire.»');
  }
  update(_time:number,delta:number){
    const dt=Math.min(delta,60)/1000;
    const wasMoving=this.path.length>0;
    if(this.path.length){
      const start=project(this.location),end=project(this.path[0]);
      const dx=end.x-start.x,dy=end.y-start.y,dist=Math.hypot(dx,dy);
      if(dist<.4){this.location=this.path.shift()!;this.motion.stop();}
      else{
        const step=this.motion.step(dt,Math.atan2(dy,dx),dist);
        const next=unproject({x:start.x+dx/dist*step,y:start.y+dy/dist*step});
        if(!walkable(next)){this.cancel();this.say('«Qui c’è un ostacolo.»');}
        else{
          this.location=next;this.footsteps.play(this.motion.advance(step));
          if(step>=dist-.001){this.location=this.path.shift()!;this.motion.stop();}
        }
      }
    }
    if(wasMoving&&!this.path.length){this.targetMark.setVisible(false);this.drawRoute();}
    if(!this.path.length){
      const facingDone=this.arrivalFacing===null||this.motion.face(dt,this.arrivalFacing);
      if(facingDone){
        this.arrivalFacing=null;this.motion.stop();
        if(wasMoving||this.afterArrival){this.setStatus(this.completed?'Prova completata':'In esplorazione');const callback=this.afterArrival;this.afterArrival=null;callback?.();}
      }
    }
    const p=project(this.location);this.actor.update(this.motion,p.x,p.y,dt);this.bubble.setPosition(p.x,p.y-138);
    if(this.debug){const data=el('game-container').dataset;data.motion=this.motion.state;data.facing=this.motion.facing.toFixed(3);data.playerX=p.x.toFixed(2);data.playerY=p.y.toFixed(2);data.actorAlpha=String(this.player.alpha);data.stepCount=String(this.footsteps.played);data.audioState=this.footsteps.state;}
    if(this.debug&&this.path.length)this.drawRoute();
  }
  private polygon(g:Phaser.GameObjects.Graphics,points:Point[],fill:number,line=0x392c20){g.fillStyle(fill,1).lineStyle(2,line,1);g.fillPoints(points,true);g.strokePoints(points,true);}
  private corners(b:Block,lift=0){return[{u:b.u,v:b.v},{u:b.u+b.w,v:b.v},{u:b.u+b.w,v:b.v+b.h},{u:b.u,v:b.v+b.h}].map(p=>{const q=project(p);return{x:q.x,y:q.y-lift};});}
  private drawTable(){
    this.add.image(435,588,'table-prop').setOrigin(0).setDisplaySize(208,172).setDepth(703);
  }
  private drawChest(){
    this.add.image(309,648,'chest-prop').setOrigin(0).setDisplaySize(133,125).setDepth(745);
  }
  private drawKey(){
    const g=this.keyGraphic;g.clear().lineStyle(4,0x3c2c16,.6).strokeCircle(529,632,7).lineBetween(535,636,550,644);
    g.lineStyle(3,0xffdf7d).strokeCircle(529,628,6).lineBetween(534,631,550,639).lineBetween(546,637,543,643).lineBetween(551,639,548,645);
    this.tweens.add({targets:g,alpha:.62,duration:1300,yoyo:true,repeat:-1});
  }
  private drawDoor(){
    const g=this.doorGraphic;g.clear();
    const a=project({u:.34,v:0}),b=project({u:.5,v:0});
    const points=[{x:a.x,y:a.y-154},{x:b.x,y:b.y-154},b,a];
    this.polygon(g,points,this.doorOpen?0x101910:0x56442d,0xbaa274);
    g.lineStyle(7,0x77644c).strokePoints(points,true);
    if(this.doorOpen){
      this.polygon(g,[points[1],{x:b.x+22,y:b.y-161},{x:b.x+22,y:b.y-7},b],0x746040);
      g.fillStyle(0xb6a16c,.1).fillTriangle(a.x,a.y,b.x,b.y,b.x-22,b.y+38);
    }else{
      for(let i=1;i<6;i++){const t=i/6,x=Phaser.Math.Linear(a.x,b.x,t),y=Phaser.Math.Linear(a.y,b.y,t);g.lineStyle(1,0x2e3121).lineBetween(x,y-150,x,y-4);}
      g.lineStyle(5,0x393e30).lineBetween(a.x+5,a.y-115,b.x-5,b.y-120).lineBetween(a.x+5,a.y-35,b.x-5,b.y-40);
      g.fillStyle(0xd4b169).fillCircle(b.x-13,b.y-65,4).fillRect(b.x-15,b.y-58,4,7);
    }
  }
  private addOcclusion(coords:number[][],depth:number){
    const mask=this.make.graphics({x:0,y:0});mask.fillStyle(0xffffff).fillPoints(coords.map(([x,y])=>({x,y})),true);
    this.add.image(512,512,'room').setDepth(depth).setMask(mask.createGeometryMask());
  }
  private toggleDebug(){this.debug=!this.debug;this.diagnostics.setVisible(this.debug);this.routeGraphic.setVisible(this.debug);el('debug').textContent=this.debug?'Nascondi percorsi':'Mostra percorsi';el('debug').setAttribute('aria-pressed',String(this.debug));this.drawRoute();}
  private drawDebug(){
    const g=this.diagnostics;g.clear();
    for(let u=.04;u<1;u+=.045)for(let v=.04;v<1;v+=.045){const p=project({u,v});g.fillStyle(walkable({u,v})?0x98ca91:0xe37f62,.6).fillCircle(p.x,p.y,2);}
    for(const b of blocks){g.lineStyle(2,0xff976e,.85).strokePoints(this.corners(b),true);}
  }
  private drawRoute(){const g=this.routeGraphic;g.clear();if(this.path.length){g.lineStyle(2,0xf4d88b,.95).strokePoints([project(this.location),...this.path.map(project)],false);for(const p of this.path){const q=project(p);g.fillStyle(0xf4d88b).fillCircle(q.x,q.y,4);}}}
}
