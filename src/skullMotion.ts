// One third fewer rattles: average interval 4.5 seconds, unchanged burst speed.
export function skullMotion(time:number){
 const block=Math.floor(time/9),local=time-block*9;
 const random=Math.sin((block+1)*12.9898)*43758.5453;
 const offset=.3+(random-Math.floor(random))*.9;
 const pulse=local-offset-(local>=offset+4.5?4.5:0);
 const duration=.85,active=pulse>=0&&pulse<duration;
 if(!active)return {active:false,x:0,y:0,angle:0};
 const envelope=active?Math.sin(Math.PI*pulse/duration)**2:0;
 return {active,x:Math.sin(pulse*42)*2.1*envelope,y:Math.sin(pulse*33)*.8*envelope,angle:Math.sin(pulse*38)*.045*envelope};
}
