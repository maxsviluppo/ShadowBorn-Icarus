import type {PropKind} from './propMotion';
/** Shared material sound library; every instance uses the same family of samples. */
export class RoomAudio{
  enabled=true;musicEnabled=true;played=0;last='';ready=false;
  private ctx:AudioContext|null=null;private master:GainNode|null=null;
  private music:HTMLAudioElement|null=null;private buffers=new Map<string,AudioBuffer>();
  private active=new Map<string,{source:AudioBufferSourceNode;gain:GainNode}>();
  private loading:Promise<void>|null=null;
  async unlock(){try{
    if(!this.ctx){this.ctx=new AudioContext({latencyHint:'interactive'});this.master=this.ctx.createGain();this.master.gain.value=this.enabled?.65:0;this.master.connect(this.ctx.destination);
      this.music=new Audio('/assets/audio/room-music.mp3');this.music.loop=true;this.music.volume=.16;
      this.loading=Promise.all([...['book','chest','cabinet','door'].flatMap(k=>['open','close'].map(a=>k+'-'+a)),'lock-open','bottle-broken'].map(async id=>{const r=await fetch('/assets/audio/'+id+(id==='bottle-broken'?'.mp3':'.wav'));if(!r.ok)throw Error(id);this.buffers.set(id,await this.ctx!.decodeAudioData(await r.arrayBuffer()));})).then(()=>{this.ready=true;}).catch(()=>{this.ready=false;});
    }
    if(this.ctx.state==='suspended')await this.ctx.resume();
    if(this.enabled&&this.musicEnabled&&this.music?.paused)void this.music.play().catch(()=>{});
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
  click(){
    if(!this.enabled||this.ctx?.state!=='running'||!this.master)return;
    const now=this.ctx.currentTime,osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type='triangle';osc.frequency.setValueAtTime(1700,now);osc.frequency.exponentialRampToValueAtTime(320,now+.055);gain.gain.setValueAtTime(.3,now);gain.gain.exponentialRampToValueAtTime(.0001,now+.075);osc.connect(gain);gain.connect(this.master);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(now);osc.stop(now+.08);
  }
  setEnabled(on:boolean){this.enabled=on;if(this.master&&this.ctx)this.master.gain.setTargetAtTime(on?.65:0,this.ctx.currentTime,.02);if(!on){this.stopAll();this.music?.pause();}else void this.unlock();}
  toggleMusic(){this.musicEnabled=!this.musicEnabled;if(!this.musicEnabled)this.music?.pause();else void this.unlock();return this.musicEnabled;}
  get musicPlaying(){return Boolean(this.music&&!this.music.paused);}
  pause(){this.stopAll();this.music?.pause();void this.ctx?.suspend();}
}
