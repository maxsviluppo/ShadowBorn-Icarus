import {findPath,type UV} from './navigation';

export const WALK_SPEED=.65*1.10*2;
export const RUN_SPEED=1.35*2;
const ACCEL=3.3,BRAKE=4.8,JERK=24,EPS=.001;
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const distance=(a:UV,b:UV)=>Math.hypot(a.u-b.u,a.v-b.v)*8;
const heading=(a:UV,b:UV)=>Math.atan2(b.u-a.u,b.v-a.v);
const delta=(a:number,b:number)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export type MotionState='idle'|'turning'|'walking'|'running'|'braking';

/** Collision-safe route follower with distance-based braking and bounded acceleration.
 * New destinations during motion are replanned after a short, controlled stop on
 * the old safe route. A second click at the same destination upgrades to running.
 */
export class Locomotion3D{
  location:UV={u:.70,v:.79};
  path:UV[]=[];
  speed=0;
  acceleration=0;
  yaw=Math.PI/6;
  running=false;
  state:MotionState='idle';
  revision=0;
  private stopping=false;
  private queued:{point:UV;run:boolean}|null=null;
  private destination:UV|null=null;
  get arrived(){return !this.path.length&&!this.queued&&!this.stopping&&this.speed===0;}
  go(point:UV,run=false){
    const candidate=findPath(this.location,point);
    if(!candidate)return false;
    if(this.destination&&distance(this.destination,point)<.12&&!this.stopping){this.running=run;return true;}
    this.destination={...point};
    if(this.speed>.025){this.queued={point:{...point},run};this.stopping=true;}
    else{this.path=candidate;this.running=run;this.queued=null;this.stopping=false;this.revision++;}
    return true;
  }
  stop(){this.queued=null;this.destination=null;this.stopping=true;if(this.speed<.015)this.finishStop();}
  reset(){this.location={u:.70,v:.79};this.path=[];this.speed=0;this.acceleration=0;this.yaw=Math.PI/6;this.running=false;this.stopping=false;this.queued=null;this.destination=null;this.state='idle';this.revision++;}
  face(angle:number,dt:number){
    const d=delta(this.yaw,angle);
    this.yaw+=clamp(d*(1-Math.exp(-10*dt)),-3.1*dt,3.1*dt);
    this.state=Math.abs(d)>.025?'turning':'idle';
    return Math.abs(d)<.025;
  }
  private finishStop(){
    this.speed=0;this.acceleration=0;this.path=[];this.stopping=false;this.state='idle';this.revision++;
    if(this.queued){const q=this.queued;this.queued=null;this.path=findPath(this.location,q.point)??[];this.running=q.run;this.revision++;}
  }
  step(dt:number){
    let travelled=0;
    // Fixed upper integration step makes braking stable even on slower frames.
    for(let left=Math.min(dt,.15);left>1e-8;){const h=Math.min(left,1/120);left-=h;travelled+=this.integrate(h);}
    return travelled;
  }
  private integrate(dt:number){
    while(this.path.length&&distance(this.location,this.path[0])<EPS&&this.speed<.03){this.location={...this.path.shift()!};this.revision++;}
    if(!this.path.length){if(this.stopping)this.finishStop();else{this.speed=0;this.acceleration=0;this.state='idle';}return 0;}
    const target=this.path[0],d=distance(this.location,target),aim=heading(this.location,target),turn=delta(this.yaw,aim);
    if(this.speed<.025&&Math.abs(turn)>.10){this.speed=0;this.acceleration=0;this.face(aim,dt);return 0;}
    this.face(aim,dt);
    // Brake before a sharp corner as well as before the final destination.
    let available=d;
    for(let i=0;i<this.path.length-1;i++){
      const before=i===0?this.location:this.path[i-1];
      if(Math.abs(delta(heading(before,this.path[i]),heading(this.path[i],this.path[i+1])))>.22)break;
      available+=distance(this.path[i],this.path[i+1]);
    }
    // Reserve time for acceleration to settle: this avoids a last-frame hard stop.
    const allowance=BRAKE*.40;
    const safeSpeed=Math.sqrt(2*BRAKE*Math.max(0,available-EPS)+allowance*allowance)-allowance;
    const desired=this.stopping?0:Math.min(this.running?RUN_SPEED:WALK_SPEED,safeSpeed);
    const wanted=clamp((desired-this.speed)*8,-BRAKE,ACCEL);
    this.acceleration+=clamp(wanted-this.acceleration,-JERK*dt,JERK*dt);
    const previous=this.speed;
    this.speed=Math.max(0,this.speed+this.acceleration*dt);
    if(this.stopping&&this.speed<.015){this.finishStop();return 0;}
    const step=Math.min(d,(previous+this.speed)*.5*dt);
    if(d>1e-10){const factor=step/d;this.location={u:this.location.u+(target.u-this.location.u)*factor,v:this.location.v+(target.v-this.location.v)*factor};}
    if(step>=d-1e-10){this.location={...target};this.path.shift();this.revision++;if(!this.path.length){this.speed=0;this.acceleration=0;}}
    this.state=this.stopping||this.acceleration<-.10?'braking':this.speed>WALK_SPEED+.06?'running':'walking';
    return step;
  }
}
