import {elementUrl} from './cellLayers';
const $=(id:string)=>document.getElementById(id)!;
const art:Record<string,string>={
 bag:`<path fill="#70482e" d="M17 24V13L23 7H39L45 13V24H40V15L37 12H26L22 15V24Z"/><path fill="#98663d" d="M10 24L16 19H48L54 26V53L48 58H15L9 51Z"/><path fill="#b48350" d="M11 24H52V36L34 43H28L11 35Z"/><path fill="#dec487" d="M28 33H36V46H28Z"/><path fill="#513425" d="M30 36H34V42H30Z"/>`,
 bagOpen:`<path fill="#926039" d="M12 26L17 20H48L54 27V53L48 58H15L9 51Z"/><path fill="#37291f" d="M13 26H50V37H13Z"/><path fill="#b48350" d="M14 25L10 10L16 5H46L51 11L48 25Z"/><path fill="#dec487" d="M28 9H35V19H28Z"/><path fill="#70482e" d="M12 38L29 44H36L51 37V53H12Z"/>`,
 journal:`<path fill="#5b3928" d="M13 8L18 5H47L53 11V54L47 59H13Z"/><path fill="#e1c998" d="M18 10H48V53H18Z"/><path fill="#95633d" d="M12 6H44V56H12Z"/><path fill="#bd9058" d="M18 11H39V49H18Z"/><path fill="#65432f" d="M23 21H35V25H23ZM23 30H35V34H23Z"/><path fill="#deb56a" d="M38 27H53V36H38Z"/>`,
 lens:`<circle cx="25" cy="24" r="15" fill="#83a5a0"/><circle cx="25" cy="24" r="10" fill="#c7d8b2"/><path stroke="#d6b47d" stroke-width="9" d="M36 36L52 52"/>`,
 wrench:`<path fill="#c4b396" d="M12 7L25 20L34 12L25 3L39 7L45 17L42 29L29 36L15 55L5 47L23 29L16 25L9 17Z"/>`,
 hand:`<path fill="#e1c398" d="M22 34V10H29V28H34V23H40V28H46V32H51V44L41 56H25L12 39V33H18L22 39Z"/>`,
 talk:`<path fill="#dfc38f" d="M7 11H54V41H29L17 53V41H7Z"/><path stroke="#60432e" d="M15 21H44M15 29H37"/>`
};
const supplied:Record<string,[string,string]>={bag:['reo4fereo4fereo4','312 55 400 450'],bagOpen:['npru3lnpru3lnpru','259 82 482 425'],journal:['3xxpc3xxpc3xxpc3','370 147 308 276'],journalOpen:['jvgpfujvgpfujvgp','193 145 579 293']};
export const icon=(name:string)=> ['lens','wrench'].includes(name)?`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"><image href="/assets/pixel/puzzle/${name}.png" width="64" height="64" preserveAspectRatio="xMidYMid meet"/></svg>`:supplied[name]?`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${supplied[name][1]}" aria-hidden="true"><image href="${elementUrl(supplied[name][0])}" width="1024" height="559"/></svg>`:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" shape-rendering="crispEdges"><g stroke="#2b211b" stroke-width="3" stroke-linejoin="round">${art[name]}</g></svg>`;
export function cursor(name:string){if(['lens','wrench'].includes(name))return `url("/assets/pixel/puzzle/${name}-cursor.png") 10 10, pointer`;return `url("data:image/svg+xml,${encodeURIComponent(icon(name).replace('viewBox=', 'width="32" height="32" viewBox='))}") 12 12, pointer`;}
export function initAdventureUI(){
 document.body.classList.add('minimal-ui');
 const bag=document.createElement('button');bag.id='bag-toggle';bag.className='corner-icon';bag.setAttribute('aria-label','Apri inventario');bag.setAttribute('aria-expanded','false');bag.setAttribute('aria-controls','inventory-tray');bag.innerHTML=icon('bag');
 const inventory=document.querySelector<HTMLElement>('.inventory')!;inventory.id='inventory-tray';inventory.hidden=true;
 const diary=document.createElement('button');diary.id='settings-toggle';diary.className='corner-icon';diary.setAttribute('aria-label','Apri diario e impostazioni');diary.setAttribute('aria-haspopup','dialog');diary.innerHTML=icon('journal');
 const settings=document.createElement('dialog');settings.id='settings-dialog';settings.className='journal parchment-frame';settings.setAttribute('aria-labelledby','settings-title');settings.innerHTML='<button class="dismiss" aria-label="Chiudi impostazioni">×</button><span class="eyebrow">IL DIARIO DI BARNABY</span><h2 id="settings-title">Una pausa, per favore.</h2>';
 document.body.append(settings);
 const menu=document.querySelector('.game-menu')!;settings.append(menu);const journal=$('journal-toggle');journal.className='ornament-button';settings.append(journal);
 const verbs=document.querySelector<HTMLElement>('.verbs')!;settings.append(verbs);for(const [id,name] of [['interact','hand'],['examine','lens']]){$(id).insertAdjacentHTML('afterbegin',icon(name));}
 document.body.append(settings);document.querySelector('.game-shell')!.append(bag,diary);
 const toggleBag=()=>{inventory.hidden=!inventory.hidden;bag.innerHTML=icon(inventory.hidden?'bag':'bagOpen');bag.setAttribute('aria-expanded',String(!inventory.hidden));bag.setAttribute('aria-label',inventory.hidden?'Apri inventario':'Chiudi inventario');};bag.onclick=toggleBag;
 diary.onclick=()=>{diary.innerHTML=icon('journalOpen');settings.showModal();};settings.addEventListener('close',()=>{diary.innerHTML=icon('journal');});settings.querySelector('button')!.onclick=()=>settings.close();
 for(const id of ['help-toggle','journal-toggle','reset','interact','examine'])$(id).addEventListener('click',()=>settings.close());
 settings.addEventListener('click',e=>{if(e.target===settings){const r=settings.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)settings.close();}});
 window.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement||e.repeat)return;if(e.key.toLowerCase()==='i'&&!document.querySelector('dialog[open]'))toggleBag();if(e.key==='Escape'&&!inventory.hidden){inventory.hidden=true;bag.innerHTML=icon('bag');bag.setAttribute('aria-expanded','false');bag.setAttribute('aria-label','Apri inventario');}});
 $('empty-bag').textContent='La borsa è vuota.';
}
