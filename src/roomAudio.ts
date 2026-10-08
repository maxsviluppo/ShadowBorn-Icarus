import type {PropKind} from './propMotion';
/** Shared material sound library; every instance uses the same family of samples. */
export class RoomAudio{
  enabled=true;musicEnabled=true;private effectsVolume=1;private musicVolume=.02;
  constructor(){try{const raw=localStorage.getItem('shadowborn-music-volume');if(raw!==null&&raw.trim()!==''){const saved=Number(raw);if(Number.isFinite(saved))this.musicVolume=Math.max(0,Math.min(1,saved));}}catch{}}
  setEffectsVolume(v:number){this.effectsVolume=Math.max(0,Math.min(1,v));if(this.master&&this.ctx)this.master.gain.setTargetAtTime(this.enabled?.65*this.effectsVolume:0,this.ctx.currentTime,.02);}
  setMusicVolume(v:number){this.musicVolume=Math.max(0,Math.min(1,v));if(this.music)this.music.volume=this.musicVolume;try{localStorage.setItem('shadowborn-music-volume',String(this.musicVolume));}catch{}}
  getMusicVolume(){return this.musicVolume;}
  played=0;last='';ready=false;
  private ctx:AudioContext|null=null;private master:GainNode|null=null;
  private music:HTMLAudioElement|null=null;private buffers=new Map<string,AudioBuffer>();
  private active=new Map<string,{source:AudioBufferSourceNode;gain:GainNode}>();
  private loading:Promise<void>|null=null;
  async startMusic(){
    if(!this.musicEnabled)return true;
    if(!this.music){this.music=new Audio('/assets/audio/game-background.mp3');this.music.loop=true;this.music.volume=this.musicVolume;}
    try{await this.music.play();return true;}catch{return false;}
  }
  async unlock(){try{
    void this.startMusic();
    if(!this.ctx){this.ctx=new AudioContext({latencyHint:'interactive'});this.master=this.ctx.createGain();this.master.gain.value=this.enabled?.65*this.effectsVolume:0;this.master.connect(this.ctx.destination);
      this.loading=Promise.all([...['book','chest','cabinet','door'].flatMap(k=>['open','close'].map(a=>k+'-'+a)),'lock-open','bottle-broken','mouse-squeak','skull-rattle'].map(async id=>{const r=await fetch('/assets/audio/'+id+(['bottle-broken','skull-rattle'].includes(id)?'.mp3':'.wav'));if(!r.ok)throw Error(id);this.buffers.set(id,await this.ctx!.decodeAudioData(await r.arrayBuffer()));})).then(()=>{this.ready=true;}).catch(()=>{this.ready=false;});
    }
    if(this.ctx.state==='suspended')await this.ctx.resume();
    if(this.musicEnabled&&this.music?.paused)void this.music.play().catch(()=>{});
  }catch{this.ready=false;}}
  play(kind:PropKind|'lock',open:boolean,duration:number,instance=kind){
    this.stop(instance);if(!this.enabled||duration<.06||this.ctx?.state!=='running'||!this.master)return;
    const id=kind+'-'+(open?'open':'close'),buffer=this.buffers.get(id);if(!buffer)return;
    const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;
    source.playbackRate.value=buffer.duration/duration;source.connect(gain);gain.connect(this.master);
    const now=this.ctx.currentTime;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(1,now+Math.min(.012,duration*.1));gain.gain.setValueAtTime(1,now+duration-Math.min(.025,duration*.2));gain.gain.linearRampToValueAtTime(0,now+duration);
    this.active.set(instance,{source,gain});source.onended=()=>{source.disconnect();gain.disconnect();if(this.active.get(instance)?.source===source)this.active.delete(instance);};source.start();source.stop(now+duration);this.played++;this.last=id;
  }
  stop(instance:string){const old=this.active.get(instance);if(old&&this.ctx){const now=this.ctx.currentTime;old.gain.gain.cancelScheduledValues(now);old.gain.gain.setTargetAtTime(0,now,.008);try{old.source.stop(now+.03);}catch{}this.active.delete(instance);}}
  stopAll(){for(const id of [...this.active.keys()])this.stop(id);}
  glassBreak(){
    if(!this.enabled||this.ctx?.state!=='running'||!this.master)return;
    const buffer=this.buffers.get('bottle-broken');if(!buffer)return;
    const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;gain.gain.value=.85;source.connect(gain);gain.connect(this.master);
    this.stop('glass');this.active.set('glass',{source,gain});source.onended=()=>{source.disconnect();gain.disconnect();if(this.active.get('glass')?.source===source)this.active.delete('glass');};source.start(0,.06);this.played++;this.last='bottle-broken';
  }
  mouseSqueak(){
    if(!this.enabled||this.ctx?.state!=='running'||!this.master)return;
    const buffer=this.buffers.get('mouse-squeak');if(!buffer)return;
    this.stop('mouse');const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;gain.gain.value=.18;source.connect(gain);gain.connect(this.master);this.active.set('mouse',{source,gain});source.onended=()=>{source.disconnect();gain.disconnect();if(this.active.get('mouse')?.source===source)this.active.delete('mouse');};source.start();
  }
  click(){
    if(!this.enabled||this.ctx?.state!=='running'||!this.master)return;
    const now=this.ctx.currentTime,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(1700,now);osc.frequency.exponentialRampToValueAtTime(320,now+.055);gain.gain.setValueAtTime(.3,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.075);osc.connect(gain);gain.connect(this.master);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(now);osc.stop(now+.08);
  }
  skullRattle(duration=.85){
    if(!this.enabled||this.ctx?.state!=='running'||!this.master)return;
    const buffer=this.buffers.get('skull-rattle');if(!buffer)return;
    this.stop('skull');const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;
    const now=this.ctx.currentTime,offset=.10,length=Math.min(duration,buffer.duration-offset);
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.38,now+.025);gain.gain.setValueAtTime(.38,now+Math.max(.025,length-.08));gain.gain.linearRampToValueAtTime(0,now+length);
    source.connect(gain);gain.connect(this.master);this.active.set('skull',{source,gain});
    source.onended=()=>{source.disconnect();gain.disconnect();if(this.active.get('skull')?.source===source)this.active.delete('skull');};
    source.start(now,offset);source.stop(now+length);this.played++;this.last='skull-rattle';
  }
  setEnabled(on:boolean){this.enabled=on;if(this.master&&this.ctx)this.master.gain.setTargetAtTime(on?.65*this.effectsVolume:0,this.ctx.currentTime,.02);if(!on){this.stopAll();}else void this.unlock();}
  toggleMusic(){this.musicEnabled=!this.musicEnabled;if(!this.musicEnabled)this.music?.pause();else void this.unlock();return this.musicEnabled;}
  get musicPlaying(){return Boolean(this.music&&!this.music.paused);}
  pause(){this.stopAll();this.music?.pause();void this.ctx?.suspend();}
}
