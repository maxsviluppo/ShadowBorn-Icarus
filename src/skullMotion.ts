// One brief rattle roughly every 140 seconds of play, with small random pauses.
export function skullMotion(time:number){
 let pulse=-1;
 for(let cycle=Math.max(1,Math.floor(time/140));cycle<=Math.floor(time/140)+1;cycle++){
  const random=Math.sin((cycle+1)*12.9898)*43758.5453;
  const start=cycle*140-10+(random-Math.floor(random))*20;
  if(time>=start&&time<start+.85){pulse=time-start;break;}
 }
 const duration=.85,active=pulse>=0&&pulse<duration;
 if(!active)return {active:false,x:0,y:0,angle:0};
 const envelope=active?Math.sin(Math.PI*pulse/duration)**2:0;
 return {active,x:Math.sin(pulse*42)*2.1*envelope,y:Math.sin(pulse*33)*.8*envelope,angle:Math.sin(pulse*38)*.045*envelope};
}
