import type {CellPuzzle} from './cellPuzzle';
export type Line={speaker:'Barnaby'|'Teschio';text:string};
const b=(text:string):Line=>({speaker:'Barnaby',text}),t=(text:string):Line=>({speaker:'Teschio',text});
export const riddles=[
 {id:'treasure',question:'Che cosa c’è che un vero pirata cerca per tutta la vita, spende una fortuna per ottenerlo, e alla fine scopre che gli fa venire solo un terribile mal di fegato?',answers:['Un baule colmo di lucenti dobloni d’oro zecchino!','Un barile di grog d’annata fatto in casa da un orango zoppo.','Una mappa del tesoro che indica esattamente dove si trova il bagno più sicuro.'],correct:1,error:'Ma sei serio, pivello?! I dobloni non ti fanno venire il mal di fegato, ti fanno solo venire la voglia di spenderli in bettole peggiori! Ritenta, idiota dei mari!'},
 {id:'ship',question:'Se il capitano ordina di abbandonare la nave che affonda, qual è la primissima cosa che un marinaio saggio deve fare prima di buttarsi in acqua?',answers:['Salvare il pappagallo del capitano e insegnargli a imprecare in sette lingue.','Rubare le chiavi della cambusa per portarsi via le scorte di formaggio marcio.','Accertarsi che le proprie tasche siano piene di pesanti palle di cannone per affondare prima degli squali.'],correct:2,error:'Ma che razza di pirata sei?! Salvare un pappagallo mentre affondi ti dà solo un compagno di sventura con cui urlare in preda al panico. Dovevi zavorrarti con le palle di cannone! Torniamo daccapo!'},
 {id:'golden',question:'Qual è il segreto assoluto per diventare il pirata più temuto e rispettato di tutti i Sette Mari?',answers:['Avere un cappello piumato così grande da non passare attraverso le porte della taverna.','Urlare Arrr! con molta convinzione mentre si inciampa nei propri stivali lindi.','Pagare sempre le tasse portuali in anticipo per evitare sanzioni amministrative.'],correct:1,error:'Pagare le tasse in anticipo?! Ma mi cascassero i denti... oh, aspetta, me li hai portati tu! Sei la vergogna dei sette mari. Ricominciamo la tiritera!'}
] as const;
export function phaseLines(s:CellPuzzle,delivery?:'eye'|'jaw'):Line[]{
 const lines:Line[]=[];
 if(delivery)lines.push(b(delivery==='eye'?'Ecco a te, pezzo di antiquariato. Contento adesso?':'Tieni, guardiano. Era questa la tua tanto desiderata mandibola?'));
 if(!s.jawGiven&&!s.eyeGiven)return [b('Ehi, tu! Muso di osso! Sbarri la via o sei solo un soprammobile particolarmente macabro?'),t('Bbl-bl-bbl... mmh... ghia...'),b('Non si capisce una parola. Ti manca chiaramente qualche pezzo fondamentale della tua mediocre esistenza.')];
 if(!s.jawGiven){s.jawKnown=true;return [...lines,t('Ohhh! Ci rivedo, ma... bl-bl-ghia... non posso masticare le risposte! Mi manca la mia mandibola! Gira voce che sia usata come maniglia su un mobiletto qui vicino...')];}
 if(!s.eyeGiven)return [...lines,t('Ahhh! Finalmente posso masticare le mie minacce con stile! Ma chi ha spento la luce? Prima trovami un occhio, pivello!')];
 if(s.secretRevealed)return [t('La porta principale resta bloccata, testadicavolo. Cerca il piccolo foro nella finta pietra sulla parete destra. Tazza di metallo, tre colpi lenti, e leva le tende!')];
 return [...lines,t('Ahhh! Finalmente posso masticare le mie minacce con stile! Ottimo lavoro, pivello. Ma prima di farti passare, la sacra legge dei pirati impone che tu superi i miei tre leggendari indovinelli!')];
}
export const revelation:Line[]=[t('Spettacolare! Hai risposto correttamente a tutto... ma la porta principale davanti a te è comunque sbarrata, arrugginita e bloccata per l’eternità con sette catene d’acciaio! Ahahah! Non si esce di qui!'),b('COSA?! Mi hai fatto fare un test di logica degno di un professore pazzo per nulla?!'),t('Esatto, pivello! Però... vedi, questa non è mai stata una prigione. Anni fa era la lussuosa camera da letto del padrone del bar, che veniva qui a russare lontano dalle risse. La vera via d’uscita è quella porta nascosta sotto la finta carta da parati di pietra sulla parete di fronte! Usa la tua tazza di metallo per bussare con il codice giusto e leva le tende!'),t('Cerca il piccolo foro sulla parete destra. Il codice è: tre colpi lenti. Persino tu dovresti riuscire a contarli.')];
export class SkullTrial{
 order=[0,1,2];index=0;
 constructor(private s:CellPuzzle,private random= Math.random){}
 get ready(){return this.s.eyeGiven&&this.s.jawGiven;}
 get current(){return riddles[this.order[this.index]];}
 answer(choice:number):'blocked'|'wrong'|'correct'|'won'{
  if(!this.ready||this.s.riddlesPassed||!Number.isInteger(choice)||choice<0||choice>2)return 'blocked';
  if(choice!==this.current.correct){const previous=this.order.join();for(let i=2;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.order[i],this.order[j]]=[this.order[j],this.order[i]];}if(this.order.join()===previous)this.order.push(this.order.shift()!);this.index=0;return 'wrong';}
  if(++this.index===3){this.s.riddlesPassed=true;return 'won';}return 'correct';
 }
}
