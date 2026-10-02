/** A drag stays a drag even if the finger returns to its starting point. */
export class TouchIntent {
 moved=false;
 cancelled=false;
 constructor(readonly x:number,readonly y:number){}
 move(x:number,y:number){if(Math.hypot(x-this.x,y-this.y)>10)this.moved=true;}
 get tap(){return !this.moved&&!this.cancelled;}
}
export function installTouchExplore(room:HTMLElement,inventory:HTMLElement,callbacks:{
 hover:(target:Element|null,event:PointerEvent)=>void;hide:()=>void;
 tap:(target:Element,event:PointerEvent)=>void;hold:(target:Element)=>boolean;
}){
 let gesture:{id:number;intent:TouchIntent;target:Element;held:boolean}|undefined;
 let hold:ReturnType<typeof setTimeout>|undefined,hide:ReturnType<typeof setTimeout>|undefined;
 let suppressUntil=0;
 const fingers=new Set<number>();
 room.style.touchAction='none';inventory.style.touchAction='none';
 const scope=(target:Element)=>room.contains(target)||inventory.contains(target);
 document.addEventListener('pointerdown',e=>{
  if(e.pointerType!=='touch')return;
  fingers.add(e.pointerId);
  if(fingers.size>1){if(gesture)gesture.intent.cancelled=true;clearTimeout(hold);callbacks.hide();return;}
  const target=e.target as Element;if(!scope(target))return;
  clearTimeout(hide);gesture={id:e.pointerId,intent:new TouchIntent(e.clientX,e.clientY),target,held:false};
  callbacks.hover(document.elementFromPoint(e.clientX,e.clientY),e);
  hold=setTimeout(()=>{if(gesture?.intent.tap){gesture.held=callbacks.hold(gesture.target);if(gesture.held)callbacks.hide();}},550);
 },true);
 document.addEventListener('pointermove',e=>{
  if(!gesture||e.pointerId!==gesture.id)return;
  gesture.intent.move(e.clientX,e.clientY);
  if(gesture.intent.moved)clearTimeout(hold);
  if(!gesture.intent.cancelled&&!gesture.held)callbacks.hover(document.elementFromPoint(e.clientX,e.clientY),e);
 },true);
 const finish=(e:PointerEvent)=>{
  fingers.delete(e.pointerId);
  if(!gesture||e.pointerId!==gesture.id)return;
  clearTimeout(hold);const current=gesture;gesture=undefined;
  current.intent.move(e.clientX,e.clientY);
  if(e.type==='pointercancel')current.intent.cancelled=true;
  suppressUntil=performance.now()+900;
  if(e.cancelable)e.preventDefault();
  if(current.intent.tap&&!current.held){callbacks.hide();callbacks.tap(current.target,e);}
  else if(current.intent.cancelled)callbacks.hide();
  else hide=setTimeout(callbacks.hide,1200);
 };
 document.addEventListener('pointerup',finish,true);
 document.addEventListener('pointercancel',finish,true);
 // Keep keyboard/programmatic clicks; discard native compatibility clicks after touch.
 document.addEventListener('click',e=>{if(e.detail!==0&&performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
 document.addEventListener('contextmenu',e=>{if(gesture){e.preventDefault();e.stopImmediatePropagation();}},true);
 window.addEventListener('blur',()=>{if(gesture)gesture.intent.cancelled=true;clearTimeout(hold);callbacks.hide();fingers.clear();});
}
