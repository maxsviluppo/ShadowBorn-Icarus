export const THROW_RELEASE=.55,THROW_IMPACT=.98,THROW_DURATION=1.65;
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
/** In-place arm gesture; the room controller owns the one-time puzzle commit. */
export function throwPose(t:number){
 if(t<THROW_RELEASE){const w=smooth(t/THROW_RELEASE);return {arm:-1.9*w,forearm:-.8*w,torso:.12*w};}
 const follow=smooth((t-THROW_RELEASE)/.20),recover=1-smooth((t-THROW_IMPACT)/(THROW_DURATION-THROW_IMPACT));
 return {arm:(-1.9+3.0*follow)*recover,forearm:(-.8+.65*follow)*recover,torso:(.12-.24*follow)*recover};
}
export function bottleFlight(t:number,start:{x:number;y:number},end:{x:number;y:number}){
 const p=Math.max(0,Math.min(1,(t-THROW_RELEASE)/(THROW_IMPACT-THROW_RELEASE)));
 return {x:start.x+(end.x-start.x)*p,y:start.y+(end.y-start.y)*p-42*4*p*(1-p),rotation:p*Math.PI*1.6};
}
