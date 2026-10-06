export const WAKE_DURATION=23.2;
export const WAKE_START={u:.45,v:.69};
const smooth=(t:number)=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function wakeFrame(time:number){
 const sit=smooth((time-12)/4),stand=smooth((time-19.2)/3);
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
  head:time>5&&time<19.2?Math.sin(time*1.5)*.06:0,
  arm:Math.sin(time*1.1)*.025*(1-stand)
 };
}
