import {icon} from './adventureUI';
export function objectActions(target:Element, choices:{label:string;icon:string;run:()=>void}[]){
 document.getElementById('object-actions')?.remove();
 const menu=document.createElement('div');menu.id='object-actions';menu.setAttribute('role','group');menu.setAttribute('aria-label','Azioni oggetto');
 for(const c of choices){const b=document.createElement('button');b.innerHTML=icon(c.icon);b.append(document.createTextNode(c.label));b.onclick=()=>{close();c.run();};menu.append(b);}
 const close=()=>{menu.remove();document.removeEventListener('pointerdown',outside,true);document.removeEventListener('keydown',escape);};
 const outside=(e:PointerEvent)=>{if(!menu.contains(e.target as Node))close();};const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){close();(target as HTMLElement).focus();}};
 document.body.append(menu);const r=target.getBoundingClientRect();menu.style.left=`${Math.max(8,Math.min(innerWidth-menu.offsetWidth-8,r.x+r.width/2-menu.offsetWidth/2))}px`;menu.style.top=`${Math.max(8,Math.min(innerHeight-menu.offsetHeight-8,r.y+r.height/2))}px`;
 document.addEventListener('pointerdown',outside,true);document.addEventListener('keydown',escape);menu.querySelector('button')!.focus();
}
