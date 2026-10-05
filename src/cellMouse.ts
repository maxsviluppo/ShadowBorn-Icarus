export class CellMouse {
 phase:'idle'|'leaving'|'hidden'|'returning'='idle';
 time=0; wait:number;
 constructor(private random:()=>number=Math.random){this.wait=this.visibleDelay();}
 private visibleDelay(){return 12+this.random()*16;}
 flee(){if(this.phase==='idle'||this.phase==='returning'){const amount=this.amount;this.phase='leaving';this.time=(1-amount)*.45;}}
 reset(){this.phase='idle';this.time=0;this.wait=this.visibleDelay();}
 get selectable(){return this.phase==='idle';}
 get amount(){return this.phase==='idle'?1:this.phase==='hidden'?0:this.phase==='leaving'?1-Math.min(1,this.time/.45):Math.min(1,this.time/.6);}
 step(dt:number){this.time+=dt;if(this.phase==='idle'&&this.time>=this.wait){this.phase='leaving';this.time=0;}else if(this.phase==='leaving'&&this.time>=.45){this.phase='hidden';this.time=0;this.wait=10+this.random()*10;}else if(this.phase==='hidden'&&this.time>=this.wait){this.phase='returning';this.time=0;}else if(this.phase==='returning'&&this.time>=.6){this.phase='idle';this.time=0;this.wait=this.visibleDelay();}}
}
