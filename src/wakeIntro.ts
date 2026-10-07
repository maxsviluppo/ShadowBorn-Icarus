export const WAKE_DURATION=23.2;
export const WAKE_START={u:.45,v:.69};
const smooth=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function wakeFrame(time:number){
 const sit=smooth((time-12)/4),stand=smooth((time-19.2)/3);
 // Lift the head first, brace with the hands, then swing the legs off the bed.
 const curl=smooth((time-10.4)/1.6)*(1-smooth((time-14)/2));
 const brace=smooth((time-11.4)/1.4)*(1-smooth((time-16)/1.2));
 const lean=smooth((time-18.2)/1)*(1-smooth((time-20.1)/1.7));
 const leftLeg=smooth((time-12.3)/3.3)*(1-stand);
 const rightLeg=smooth((time-12.7)/3.3)*(1-stand);
 const settle=smooth((time-21.6)/.4)*(1-smooth((time-22.4)/.6));
 const lines=[
  'Ohi... perché sono in una prigione? Avevo prenotato una stanza con vista.',
  'Ricordo un brindisi... un gabbiano in cravatta... e una torta che mi dava del capitano.',
  'Poi qualcuno gridava Al ladro! Forse ero io. Forse la torta.',
  'Ho vinto una gara contro una porta? No... quella era una discussione. E ho perso.',
  'Prima mi alzo. Poi cerco una via d’uscita. E un testimone che non sia una torta.'
 ];
 const index=Math.floor((time-3.2)/4);
 return {
  active:time<WAKE_DURATION,
  stage:time<1.2?'black':time<3.2?'fade':time<12?'waking':time<16?'sitting-up':time<19.2?'sitting':time<22.2?'standing-up':time<WAKE_DURATION?'settling':'playing',
  black:1-smooth((time-1.2)/2),
  line:time>=3.2&&time<WAKE_DURATION?lines[Math.min(lines.length-1,index)]:'',
  lie:1-sit,seated:sit*(1-stand),stand,
  head:.16*curl-.10*lean+Math.sin(time*1.5)*.035*smooth((time-5)/1)*(1-smooth((time-17.8)/1.4)),
  torso:.30*curl+.32*lean+.035*settle,
  arm:.28*brace+.18*lean,
  forearm:-.65*brace-.38*lean,
  leftLeg,rightLeg,
  ankle:.12*brace,
  drop:.035*lean+.008*settle
 };
}
