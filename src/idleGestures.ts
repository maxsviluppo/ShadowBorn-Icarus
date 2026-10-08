export type IdleGesture='waist'|'look';
const smooth=(x:number)=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export function idleGesturePose(kind:IdleGesture,time:number){
 const duration=kind==='waist'?4:4.8;
 // One second to rest the hand, two seconds held still, one second to lower it.
 const weight=smooth(time)*(1-smooth(time-(duration-1)));
 const waist=kind==='waist';
 const headYaw=waist?0:.32*(smooth(time/.9)-2*smooth((time-1.5)/1.4)+smooth((time-3.8)));
 return {weight,head:0,headYaw,
  armR:waist?.08*weight:0,forearmR:waist?-.6*weight:0,
  armRY:waist?-.45*weight:0,forearmRY:waist?.95*weight:0,
  armL:0,forearmL:0,armRZ:0,armLZ:0,forearmRZ:0,duration};
}
export class IdleGestures{
 private wait=0;private time=0;private gesture:IdleGesture|null=null;
 constructor(private random:()=>number=Math.random){this.interrupt();}
 interrupt(){this.gesture=null;this.time=0;this.wait=6+this.random()*7;}
 step(dt:number,available:boolean){
  if(!available){if(this.gesture||this.time)this.interrupt();return null;}
  if(!this.gesture){this.wait-=dt;if(this.wait>0)return null;this.gesture=this.random()<.5?'waist':'look';this.time=0;}
  this.time+=dt;const pose=idleGesturePose(this.gesture,this.time);
  if(this.time>=pose.duration){this.interrupt();return null;}
  return {kind:this.gesture,...pose};
 }
}
