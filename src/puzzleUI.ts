import {CellPuzzle,type Item,type Verb} from './cellPuzzle';
import {objectActions} from './objectActions';
import {inventoryArt,puzzleArt} from './puzzleArt';
export function createPuzzleUI(s:CellPuzzle,say:(text:string)=>void,route:(target:string,verb:Verb,item?:Item)=>void){
 let selected:Item|undefined;
 const grid=document.querySelector<HTMLElement>('.inventory-grid')!;
 const tray=document.querySelector<HTMLElement>('.inventory')!;
 const label=(id:Item)=>id==='jaw'&&s.jawKnown?'Mandibola':puzzleArt[id].label;
 const describe=(id:string)=>{const message=s.act(id,'examine');if(message)say(message);};
 const actInBag=(id:Item,verb:Verb)=>{say(s.act(id,verb));selected=undefined;refresh();};
 const choose=(id:Item)=>{selected=selected===id?undefined:id;refresh();document.body.dataset.usingItem=selected??'';};
 function bagMenu(button:Element,id:Item){
  objectActions(button,[{label:'Esamina '+label(id),icon:'lens',run:()=>describe(id)},
   {label:'Usa '+label(id),icon:'hand',run:()=>choose(id)},
   ...(id==='jug'&&!s.eyeFound?[{label:'Estrai contenuto',icon:'wrench',run:()=>actInBag(id,'extract')}]:[]),
   
   ...(id==='broken'?[{label:'Prendi frammento',icon:'wrench',run:()=>actInBag(id,'extract')}]:[])]);
 }
 function refresh(){
  grid.replaceChildren();grid.style.gridTemplateColumns=`repeat(${Math.max(6,s.inventory.length)},minmax(36px,1fr))`;
  for(let i=0;i<Math.max(6,s.inventory.length);i++){
   const slot=document.createElement('div');slot.className='item-slot';grid.append(slot);const id=s.inventory[i];if(!id)continue;
   const b=document.createElement('button');b.className='puzzle-item';b.dataset.item=id;b.setAttribute('aria-label',label(id));b.title=label(id);b.setAttribute('aria-pressed',String(selected===id));b.innerHTML=inventoryArt(id,label(id));slot.append(b);
   // Inventory opens its choices on a single tap, equally on desktop and touch.
   b.onclick=()=>bagMenu(b,id);b.oncontextmenu=e=>{e.preventDefault();bagMenu(b,id);};
  }
  for(const path of document.querySelectorAll<SVGElement>('[data-object]')){
   const id=path.dataset.object!;path.style.display=s.visible(id)?'':'none';
   if(id==='handle'){path.setAttribute('aria-label',s.jawKnown?'Mandibola':'Strana maniglia');const x=s.cabinetOpen?501:555;path.setAttribute('d',`M${x},289h25v29h-25Z`);}
  }
  document.body.dataset.usingItem=selected??'';
 }
 const defaultVerb=(id:string):Verb=>['jug','cup','grog','handle','broken'].includes(id)?'take':id==='skull'?'talk':'interact';
 function worldMenu(target:Element,id:string,fallback:string){
  objectActions(target,[{label:'Esamina',icon:'lens',run:()=>say(s.act(id,'examine')||fallback)},
   {label:id==='cabinet'?(s.cabinetOpen?'Chiudi':'Apri'):id==='skull'?'Parla':defaultVerb(id)==='take'||id==='rope'?'Prendi':'Interagisci',icon:id==='skull'?'talk':'hand',run:()=>route(id,defaultVerb(id))},
   ...(selected?[{label:'Usa '+label(selected),icon:'wrench',run:()=>route(id,'interact',selected)}]:[]),
   ...(id==='rope'?[{label:'Taglia',icon:'wrench',run:()=>route(id,'cut')}]:[])]);
 }
 window.addEventListener('keydown',e=>{if(e.key==='Escape'){selected=undefined;refresh();}});
 refresh();
 return {refresh,worldMenu,defaultVerb,get selected(){return selected;},clear(){selected=undefined;refresh();},execute(id:string,verb:Verb,item?:Item){const result=s.act(id,verb,item);selected=undefined;refresh();return result;}};
}
