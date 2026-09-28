/** Reconstructed from the user's 80-frame walk/run reference; +Z faces forward. */
export type LegDimensions={upper:number;lower:number;stance:number;idleStance?:number};
const standard:LegDimensions={upper:.29,lower:.265,stance:.51};
export const STRIDE_METRES=1.10;
export const RUN_STRIDE_METRES=1.38;
export function bodyHeight(phase:number,blend:number,run=0,d:LegDimensions=standard){
  const total=d.upper+d.lower,scale=total/.66,duty=.54-.18*run;
  const reach=(STRIDE_METRES+(RUN_STRIDE_METRES-STRIDE_METRES)*run)*duty/2*scale;
  const extension=total-(.006+.016*run)*scale;
  const contactHeight=Math.sqrt(extension*extension-reach*reach);
  let height=contactHeight+(extension-contactHeight)*Math.sin(phase)**2;
  // Raise the pelvis over the support foot instead of holding a crouch all cycle.
  for(const offset of [0,.5]){
    const t=((phase/(Math.PI*2)+offset)%1+1)%1;
    const swing=t>=duty,p=swing?(t-duty)/(1-duty):t/duty;
    const z=swing?-reach+2*reach*p*p*(3-2*p):reach-2*reach*p;
    const lift=swing?Math.pow(Math.sin(p*Math.PI),1.1)*(.075+.20*run)*scale:0;
    height=Math.min(height,Math.sqrt(extension*extension-z*z)+lift);
  }
  return (d.idleStance??d.stance)*(1-blend)+height*blend;
}
export function solveLeg(phase:number,side:'L'|'R',blend:number,run=0,dimensions:LegDimensions=standard){
  const t=((phase/(Math.PI*2)+(side==='L'?0:.5))%1+1)%1;
  const duty=.54-.18*run,swing=t>=duty,p=swing?(t-duty)/(1-duty):t/duty;
  const scale=(dimensions.upper+dimensions.lower)/.66;
  const stride=STRIDE_METRES+(RUN_STRIDE_METRES-STRIDE_METRES)*run;
  const reach=stride*duty/2*scale;
  // Linear support phase matches backward ground travel; recovery eases into touchdown.
  const recovery=p*p*(3-2*p);
  const z=(swing?-reach+2*reach*recovery:reach-2*reach*p)*blend;
  const lift=(swing?Math.pow(Math.sin(p*Math.PI),1.1)*(.075+.20*run)*scale:0)*blend;
  const y=bodyHeight(phase,blend,run,dimensions)-lift;
  const a=dimensions.upper,b=dimensions.lower,d=Math.min(Math.hypot(y,z),a+b-.0001);
  const clamp=(x:number)=>Math.max(-1,Math.min(1,x));
  const knee=Math.PI-Math.acos(clamp((a*a+b*b-d*d)/(2*a*b)));
  const hip=-Math.atan2(z,y)-Math.acos(clamp((a*a+d*d-b*b)/(2*a*d)));
  return{hip,knee,ankle:-hip-knee,z,y,lift,swing};
}
export function upperBody(phase:number,blend:number,run=0){
  const left=Math.cos(phase),right=-left;
  return {lean:(.035+(.14+Math.PI/45)*run)*blend,sway:Math.sin(phase)*(.025+.025*run)*blend,
    twist:Math.cos(phase)*(.025+.055*run)*blend,
    armL:left*(.26+.35*run)*blend,armR:right*(.26+.35*run)*blend,
    elbowL:-.08-(.15+.95*run)*blend-Math.max(0,-left)*.12*run*blend,
    elbowR:-.08-(.15+.95*run)*blend-Math.max(0,-right)*.12*run*blend};
}
export function advanceGait(phase:number,distance:number,run=0){
  const next=phase+Math.max(0,distance)/(STRIDE_METRES+(RUN_STRIDE_METRES-STRIDE_METRES)*run)*Math.PI*2;
  return{phase:next,contacts:Math.floor(next/Math.PI)-Math.floor(phase/Math.PI)};
}
