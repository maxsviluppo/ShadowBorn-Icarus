import {phaseLines,revelation,SkullTrial,type Line} from './skullDialogue';
import type {CellPuzzle} from './cellPuzzle';
export function createSkullDialogue(s:CellPuzzle,refresh:()=>void){
 const panel=document.createElement('dialog');panel.id='skull-conversation';panel.setAttribute('aria-label','Dialogo con il teschio');document.body.append(panel);
 let trial=new SkullTrial(s),next:(()=>void)|undefined;
 function button(label:string,action:()=>void){const el=document.createElement('button');el.textContent=label;el.onclick=action;panel.append(el);return el;}
 function title(text:string){const el=document.createElement('p');el.textContent=text;el.setAttribute('aria-live','polite');panel.append(el);}
 function lines(queue:Line[],done:()=>void){let i=0;const render=()=>{panel.replaceChildren();const line=queue[i];title(line.speaker+' · '+line.text);next=()=>{if(++i<queue.length)render();else done();};button('Continua',()=>next?.()).focus();button('Ne parliamo dopo',close);};render();}
 function close(){next=undefined;panel.close();refresh();}
 function question(){panel.replaceChildren();next=undefined;title('Teschio · Indovinello '+(trial.index+1)+' di 3. '+trial.current.question);trial.current.answers.forEach((a,i)=>button(String.fromCharCode(65+i)+') '+a,()=>{const error=trial.current.error;const result=trial.answer(i);if(result==='wrong')lines([{speaker:'Teschio',text:error}],question);else if(result==='correct')question();else if(result==='won')lines(revelation,()=>{s.secretRevealed=true;refresh();close();});}));button('Ne parliamo dopo',close);panel.querySelector('button')?.focus();}
 panel.addEventListener('cancel',()=>{next=undefined;refresh();});
 return {get active(){return panel.open;},open(delivery?:'eye'|'jaw'){
  if(panel.open)return;panel.showModal();
  if(s.riddlesPassed&&!s.secretRevealed){lines(revelation,()=>{s.secretRevealed=true;refresh();close();});return;}
  lines(phaseLines(s,delivery),()=>{refresh();if(trial.ready&&!s.riddlesPassed)question();else close();});
 },reset(){close();trial=new SkullTrial(s);}};
}
