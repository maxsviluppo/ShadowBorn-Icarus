import {blocks} from './navigation';
const $=(id:string)=>document.getElementById(id)!;
export function initInterface(){
 for(const [button,name] of [['journal-toggle','journal-dialog'],['help-toggle','help-dialog']]){
  const dialog=$(name) as HTMLDialogElement;
  $(button).addEventListener('click',()=>dialog.showModal());
  dialog.querySelector('[data-dismiss]')!.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 }
 $('debug').addEventListener('click',()=>($('help-dialog') as HTMLDialogElement).close());
 const group=$('map-furniture');
 for(const b of blocks){const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');for(const [attr,value] of Object.entries({x:b.u*100,y:b.v*100,width:b.w*100,height:b.h*100,rx:1}))rect.setAttribute(attr,String(value));group.append(rect);}
 const finish=$('finish');new MutationObserver(()=>{if(!finish.hidden){$('journal-toggle').textContent='Diario ✓';($('journal-dialog') as HTMLDialogElement).showModal();}else $('journal-toggle').textContent='✧ Diario';}).observe(finish,{attributes:true,attributeFilter:['hidden']});
}
