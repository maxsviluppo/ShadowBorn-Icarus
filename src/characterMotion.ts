export const WALK_SPEED=84;
export const WALK_FRAME_DISTANCE=15;
export const TURN_RATE=230*Math.PI/180;
export const ACCELERATION=190;
export const DECELERATION=245;
export const DIRECTIONS=['E','SE','S','SO','O','NO','N','NE'];
const TAU=Math.PI*2;
export function angleDelta(from:number,to:number){return ((to-from+Math.PI)%TAU+TAU)%TAU-Math.PI;}
export function turnToward(from:number,to:number,max:number){const d=angleDelta(from,to);return from+Math.sign(d)*Math.min(Math.abs(d),max);}
export function directionIndex(angle:number){return ((Math.round(angle/(Math.PI/4))%8)+8)%8;}
// Generated cell 7 looks away instead of WSW: omit it from the turn sequence.
// The neighbouring left-profile pose bridges that sector without reversing the turn.
export function turnFrame(angle:number){const slot=((Math.round(angle/(Math.PI/8))%16)+16)%16;return [0,1,2,3,4,5,6,8,8,9,10,11,12,13,14,15][slot];}
export class CharacterMotion {
  facing=Math.PI/4;
  speed=0;
  phase=0;
  state:'idle'|'turning'|'walking'='idle';
  step(dt:number,targetAngle:number|null,distance:number):number{
    if(targetAngle===null){this.speed=0;this.state='idle';return 0;}
    const difference=Math.abs(angleDelta(this.facing,targetAngle));
    if(difference>.035&&(this.state==='turning'||difference>Math.PI/6)){
      this.speed=0;this.state='turning';
      this.facing=turnToward(this.facing,targetAngle,TURN_RATE*dt);
      return 0;
    }
    this.facing=turnToward(this.facing,targetAngle,TURN_RATE*dt);
    const targetSpeed=Math.min(WALK_SPEED,Math.sqrt(2*DECELERATION*Math.max(0,distance)));
    const change=(targetSpeed>this.speed?ACCELERATION:DECELERATION)*dt;
    this.speed+=Math.sign(targetSpeed-this.speed)*Math.min(Math.abs(targetSpeed-this.speed),change);
    this.state='walking';
    return Math.min(distance,this.speed*dt);
  }
  advance(distance:number):number{
    const end=this.phase+distance/WALK_FRAME_DISTANCE;
    // The repeated six-frame strides plant opposite feet at phases 2 and 5.
    const contacts=Math.floor((end-2)/3)-Math.floor((this.phase-2)/3);
    this.phase=end%24;
    return Math.max(0,contacts);
  }
  face(dt:number,target:number):boolean{
    this.speed=0;
    const difference=Math.abs(angleDelta(this.facing,target));
    this.facing=turnToward(this.facing,target,TURN_RATE*dt);
    this.state=difference>.035?'turning':'idle';
    return this.state==='idle';
  }
  stop(){this.speed=0;this.state='idle';}
  reset(){this.facing=Math.PI/4;this.phase=0;this.stop();}
}
