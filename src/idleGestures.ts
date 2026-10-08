export type IdleGesture='hair'|'sleeve';
const smooth=(x:number)=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function idleGesturePose(kind:IdleGesture,time:number){
 const duration=kind==='hair'?3.6:3.2;
 const weight=smooth(time/.9)*(1-smooth((time-duration+.9)/.9));
 const touch=Math.sin(time*8)*.035*weight;
 return {weight,head:(kind==='hair'?-.08:.18)*weight,
  armR:(kind==='hair'?-2.05:-.95)*weight,
  forearmR:(kind==='hair'?-1.18:-.75)*weight+touch,
  armL:kind==='sleeve'?-.85*weight:0,
  forearmL:kind==='sleeve'?-.85*weight:0,
  armRZ:(kind==='hair'?-.78:-.9)*weight,
  armLZ:kind==='sleeve'?.55*weight:0,
  forearmRZ:(kind==='hair'?1.1:1.2)*weight,
  duration};
}
export class IdleGestures{
 private wait=0;private time=0;private gesture:IdleGesture|null=null;
 constructor(private random:()=>number=Math.random){this.interrupt();}
 interrupt(){this.gesture=null;this.time=0;this.wait=6+this.random()*7;}
 step(dt:number,available:boolean){
  if(!available){if(this.gesture||this.time)this.interrupt();return null;}
  if(!this.gesture){this.wait-=dt;if(this.wait>0)return null;this.gesture=this.random()<.5?'hair':'sleeve';this.time=0;}
  this.time+=dt;const pose=idleGesturePose(this.gesture,this.time);
  if(this.time>=pose.duration){this.interrupt();return null;}
  return {kind:this.gesture,...pose};
 }
}
