export type InteractionKind='sit'|'cabinet'|'cut'|'give';
const smooth=(x:number)=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
export const interactionDuration={sit:4.8,cabinet:2.2,cut:3.2,give:2.4};
export const interactionContact={sit:1.2,cabinet:1.05,cut:2.2,give:1.15};
export function interactionPose(kind:InteractionKind,time:number,legs={upper:.325,lower:.310}){
 const duration=interactionDuration[kind];
 const weight=smooth(time/.8)*(1-smooth((time-(duration-.8))/.8));
 const thigh=(kind==='sit'?-1.40:kind==='cut'?-.95:kind==='give'?0:-.35)*weight;
 const knee=(kind==='sit'?1.40:kind==='cut'?1.90:kind==='give'?0:.70)*weight;
 const drop=legs.upper*(1-Math.cos(thigh))+legs.lower*(1-Math.cos(thigh+knee));
 const working=kind==='cut'&&time>.8&&time<2.3;
 return {weight,thigh,knee,ankle:-thigh-knee,drop,
 torso:(kind==='sit'?.08:kind==='cut'?.38:kind==='give'?.06:.48)*weight,
 arm:(kind==='sit'?-.20:kind==='give'?-1.35:-.85)*weight+(working?.13*Math.sin((time-.8)*18):0),
 forearm:(kind==='sit'?-.75:kind==='give'?-.25:-.6)*weight};
}
