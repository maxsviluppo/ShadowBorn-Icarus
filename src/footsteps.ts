/** Short, varied boot impacts synthesized for a dry stone floor. No looping timer. */
export function stoneStepSamples(rate:number,variant:number):Float32Array{
  const data=new Float32Array(Math.ceil(rate*.18));
  let random=947+variant*7919,low=0,band=0;
  const heel=105+variant*7;
  for(let i=0;i<data.length;i++){
    const t=i/rate;
    random=(Math.imul(random,1664525)+1013904223)>>>0;
    const noise=random/2147483648-1;
    low+=.18*(noise-low);band+=.60*(noise-band);
    const attack=Math.min(1,t/.0015);
    const sole=Math.sin(2*Math.PI*(heel*t-65*t*t))*Math.exp(-t*55)*.24;
    const click=(band-low)*Math.exp(-t*120)*.42;
    const scuff=low*Math.exp(-t*34)*.11;
    const toe=t>.023?Math.sin(2*Math.PI*280*(t-.023))*Math.exp(-(t-.023)*95)*.045:0;
    data[i]=(sole+click+scuff+toe)*attack;
  }
  return data;
}
export class Footsteps{
  enabled=true;
  private context:AudioContext|null=null;
  private gain:GainNode|null=null;
  private buffers:AudioBuffer[]=[];
  private sequence=0;
  private active=new Set<AudioBufferSourceNode>();
  played=0;
  sampled=false;
  async unlock(){
    try{
      if(!this.context){
        this.context=new AudioContext({latencyHint:'interactive'});
        this.gain=this.context.createGain();this.gain.gain.value=.50;this.gain.connect(this.context.destination);
        this.buffers=Array.from({length:4},(_,i)=>{const samples=stoneStepSamples(this.context!.sampleRate,i),buffer=this.context!.createBuffer(1,samples.length,this.context!.sampleRate);buffer.getChannelData(0).set(samples);return buffer;});
        void Promise.all(Array.from({length:4},async(_,i)=>{const r=await fetch('/assets/audio/step-'+i+'.wav');if(!r.ok)throw Error('step');return this.context!.decodeAudioData(await r.arrayBuffer());})).then(buffers=>{this.buffers=buffers;this.sampled=true;}).catch(()=>{});
      }
      if(this.context.state==='suspended')await this.context.resume();
    }catch{this.enabled=false;}
  }
  play(contacts:number){
    if(!this.enabled||this.context?.state!=='running'||!this.gain)return;
    for(let i=0;i<contacts;i++){
      const source=this.context.createBufferSource();source.buffer=this.buffers[this.sequence++%4];source.connect(this.gain);
      source.onended=()=>{source.disconnect();this.active.delete(source);};this.active.add(source);source.start();this.played++;
    }
  }
  toggle(){this.enabled=!this.enabled;if(!this.enabled)for(const source of this.active)source.stop();return this.enabled;}
  get state(){return this.context?.state??'locked';}
  close(){for(const source of this.active)source.stop();void this.context?.close();}
}
