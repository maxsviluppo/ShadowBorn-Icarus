export const REVEAL_FADE=.8,REVEAL_HOLD=4,REVEAL_DURATION=REVEAL_FADE*2+REVEAL_HOLD;
export function revealFrame(t:number){return {opacity:Math.max(0,Math.min(1,t/REVEAL_FADE,(REVEAL_DURATION-t)/REVEAL_FADE)),caption:t>=REVEAL_FADE&&t<REVEAL_FADE+REVEAL_HOLD,uncovered:t>=REVEAL_FADE,done:t>=REVEAL_DURATION};}
export const KNOCK_TIMES=[.6,1.45,2.3],KNOCK_DURATION=2.9;
export function knockPose(t:number){const weight=Math.max(0,Math.min(1,t/.35,(KNOCK_DURATION-t)/.35));const tap=KNOCK_TIMES.reduce((m,at)=>Math.max(m,Math.max(0,1-Math.abs(t-at)/.18)),0);return {arm:(-1.05-.12*tap)*weight,forearm:(-.45+.3*tap)*weight};}
