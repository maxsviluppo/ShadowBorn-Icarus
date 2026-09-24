/** Two-link leg solver; positions are metres in the character's sagittal plane. */
export function solveLeg(phase:number,side:'L'|'R',blend:number,run=0){
  const t=((phase/(Math.PI*2)+(side==='L'?0:.5))%1+1)%1;
  const swing=t>=.5,p=swing?(t-.5)*2:t*2;
  const reach=.20+.05*run;
  const z=(swing?-reach+2*reach*p*p*(3-2*p):reach-2*reach*p)*blend;
  const lift=(swing?Math.sin(p*Math.PI)*(.095+.065*run):0)*blend;
  const y=.51-.04*run-lift+Math.cos(phase*2)*(.005+.015*run)*blend;
  const a=.29,b=.265,d=Math.min(Math.hypot(y,z),a+b-.0001);
  const clamp=(x:number)=>Math.max(-1,Math.min(1,x));
  const knee=Math.PI-Math.acos(clamp((a*a+b*b-d*d)/(2*a*b)));
  const hip=-Math.atan2(z,y)+Math.acos(clamp((a*a+d*d-b*b)/(2*a*d)));
  return{hip,knee:-knee,ankle:-hip+knee,z,y,lift,swing};
}
export const STRIDE_METRES=.80;
export function advanceGait(phase:number,distance:number,run=0){
  const next=phase+Math.max(0,distance)/(STRIDE_METRES+.20*run)*Math.PI*2;
  return{phase:next,contacts:Math.floor(next/Math.PI)-Math.floor(phase/Math.PI)};
}
