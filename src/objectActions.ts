import {icon} from './adventureUI';
let closeActive:(()=>void)|undefined;
export function objectActions(target:Element, choices:{label:string;icon:string;run:()=>void}[]){
 closeActive?.();
 const menu=document.createElement('div');menu.id='object-actions';menu.setAttribute('role','group');menu.setAttribute('aria-label','Azioni oggetto');
 for(const c of choices){const b=document.createElement('button');b.innerHTML=icon(c.icon);b.setAttribute('aria-label',c.label);b.title=c.label;b.onclick=()=>{close();c.run();};menu.append(b);}
 const close=()=>{menu.remove();document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',escape);closeActive=undefined;};
 const outside=(e:PointerEvent)=>{if(!menu.contains(e.target as Node))close();};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){close();(target as HTMLElement).focus();}};
 closeActive=close;document.body.append(menu);
 document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',escape);menu.querySelector('button')!.focus();
}
