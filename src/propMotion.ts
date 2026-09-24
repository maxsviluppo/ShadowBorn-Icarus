export type PropKind='book'|'chest'|'cabinet'|'door';
export const PROP_SECONDS:Record<PropKind,[number,number]>={book:[.9,.7],chest:[1.2,1],cabinet:[.9,.8],door:[1.5,1.3]};
/** Finite smooth timeline shared by the visible hinge and its sound. */
export class PropMotion{
  value=0;private from=0;private to=0;private elapsed=0;private duration=0;
  constructor(readonly kind:PropKind){}
  set(open:boolean){const to=open?1:0;if(to===this.to)return 0;this.from=this.value;this.to=to;this.elapsed=0;this.duration=PROP_SECONDS[this.kind][open?0:1]*Math.abs(to-this.value);return this.duration;}
  step(dt:number){if(this.duration<=0)return this.value;this.elapsed=Math.min(this.duration,this.elapsed+dt);const impact={book:.48/.7,chest:.74,cabinet:.60/.8,door:1.02/1.3}[this.kind];const t=Math.min(1,this.elapsed/(this.duration*(this.to===0?impact:1)));this.value=this.from+(this.to-this.from)*t*t*(3-2*t);return this.value;}
  reset(){this.value=this.from=this.to=this.elapsed=this.duration=0;}
}
