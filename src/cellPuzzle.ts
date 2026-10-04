export type Item='jug'|'cup'|'eye'|'grog'|'bottle'|'broken'|'shard'|'jaw'|'rope';
export type Verb='examine'|'take'|'interact'|'extract'|'break'|'cut'|'talk';
export class CellPuzzle {
 inventory:Item[]=[]; cabinetOpen=false; jugTaken=false; cupTaken=false; grogTaken=false;
 riddlesPassed=false; secretRevealed=false;
 eyeGiven=false; roomComplete=false;
 eyeFound=false; rustDissolved=false; jawTaken=false; jawKnown=false; jawGiven=false; ropeCut=false; bottleBroken=false; shardTaken=false;
 has(id:Item){return this.inventory.includes(id);}
 add(id:Item){if(!this.has(id))this.inventory.push(id);}
 remove(id:Item){this.inventory=this.inventory.filter(i=>i!==id);}
 visible(id:string){return id==='broken'?this.bottleBroken&&!this.shardTaken:id==='jug'?!this.jugTaken:id==='cup'?!this.cupTaken:id==='grog'?this.cabinetOpen&&!this.grogTaken:id==='handle'?!this.jawTaken:true;}
 exitHint():string {
  if(!this.jugTaken)return 'Aspetta... quella brocca sul mobile potrebbe tornarmi utile.';
  if(!this.eyeFound)return 'Nella brocca sentivo tintinnare qualcosa. Meglio controllare il fondo.';
  if(!this.cupTaken)return 'Meglio non lasciare qui la tazza: fuori potrei averne bisogno.';
  if(!this.grogTaken)return 'Non ho ancora controllato bene dentro il mobile.';
  if(!this.rustDissolved)return 'Quelle viti arrugginite... il liquido nella bottiglia potrebbe scioglierle.';
  if(!this.jawTaken)return 'La strana maniglia ora dovrebbe staccarsi. Torno a prenderla.';
  if(!this.jawGiven)return 'Al teschio manca ancora qualcosa per parlare.';
  if(!this.eyeGiven)return 'Il teschio sembra cercare qualcosa con la sua orbita vuota.';
  if(!this.bottleBroken)return 'La bottiglia vuota potrebbe darmi qualcosa di tagliente, contro la botte.';
  if(!this.shardTaken)return 'Tra i vetri sulla botte ho visto un frammento utile.';
  if(!this.ropeCut)return 'Quella corda inchiodata potrebbe servirmi. Ora ho qualcosa per tagliarla.';
  if(!this.riddlesPassed)return 'Il teschio mi deve ancora mettere alla prova con i suoi indovinelli.';
  if(!this.secretRevealed)return 'Devo ascoltare fino in fondo quello che il teschio ha da dirmi.';
  return '';
 }
 act(target:string,verb:Verb,used?:Item):string {
  if(used){
   if(!this.has(used))return 'Non ho più questo oggetto.';
   if(used==='cup'&&target==='wall-hole'){if(!this.secretRevealed)return 'Sento un suono vuoto, ma non conosco ancora il codice.';const hint=this.exitHint();if(hint)return hint;this.roomComplete=true;return 'Tre colpi lenti. Il passaggio segreto risponde con uno scatto. Ho completato la cella!';}
   if(used==='grog'&&target==='handle') {this.remove('grog');this.add('bottle');this.rustDissolved=true;return 'Il grog scioglie la ruggine! Ora posso staccare la strana maniglia.';}
   if(used==='grog')return 'Meglio di no! Questo grog è corrosivo: schizzerebbe ovunque e farebbe danni. Devo usarlo con attenzione.';
   if(used==='bottle'&&target==='barrel'){this.remove('bottle');this.bottleBroken=true;return 'La bottiglia vuota si rompe sulla botte. Tra i frammenti ce ne sono di taglienti.';}
   if(used==='eye'&&target==='skull'){this.remove('eye');this.eyeGiven=true;return 'Inserisco l’occhio di cristallo nell’orbita del teschio. Ora può guardarmi!';}
   if(used==='jaw'&&target==='skull'){this.remove('jaw');this.jawGiven=true;this.jawKnown=true;return 'Il teschio indossa la mandibola. «Finalmente posso parlare!»';}
   if(used==='shard'&&target==='rope')return this.act('rope','cut');
   return 'Non sembra una buona combinazione.';
  }
  if(verb==='examine'){
   if(target==='handle'||target==='jaw')return this.jawKnown?'È la mandibola che cerca il teschio.':this.rustDissolved?'Una maniglia davvero strana. Le viti sono finalmente libere.':'Una maniglia dalla forma strana. Le viti sono bloccate dalla ruggine.';
   if(target==='jug')return this.eyeFound?'Una brocca vuota, tutta crepata.':'Una brocca crepata. Muovendola sento qualcosa tintinnare sul fondo.';
   if(target==='cup')return 'Una tazza di metallo ammaccata. Posso portarla con me.';
   if(target==='rope')return this.ropeCut?'Ho già tagliato un pezzo. Il resto è ancora inchiodato.':'La corda è inchiodata e bloccata. A mani nude non riesco a liberarla.';
   if(target==='grog')return 'Grog verdastro. Ha un odore così forte da far arrugginire... o disarrugginire qualcosa.';
   if(target==='bottle')return 'La bottiglia è vuota. Il vetro sembra piuttosto fragile.';
   if(target==='broken')return 'Sopra la botte, tra i vetri rotti, c’è un frammento lungo e tagliente.';
   if(target==='wall-barrel')return 'Un muro di pietra robusto, proprio sopra la botte.';
   if(target==='shard')return 'Un frammento di vetro con un bordo molto affilato.';
   if(target==='eye')return 'Un occhio di cristallo, nascosto sul fondo della brocca.';
   if(target==='skull')return this.eyeGiven&&this.jawGiven?'Il teschio ha di nuovo occhio e mandibola. Ora mi guarda e può parlare.':this.eyeGiven?'L’occhio è al suo posto. Gli manca ancora la mandibola.':this.jawGiven?'Ora il teschio ha di nuovo la sua mandibola.':'Il teschio cerca di dirmi qualcosa, ma gli manca un pezzo.';
   if(target==='cabinet')return this.cabinetOpen?'Un vecchio mobile aperto.':'Un vecchio mobile con una maniglia decisamente strana.';
  }
  if(target==='door'&&verb!=='examine')return this.secretRevealed?'La porta principale è bloccata per sempre. Devo usare la tazza sul passaggio segreto.':this.exitHint()||'Il teschio sembra avere ancora qualcosa da dirmi.';
  if(target==='cabinet'){this.cabinetOpen=!this.cabinetOpen;return this.cabinetOpen?(this.grogTaken?'Il mobile è vuoto.':'Dentro c’è una bottiglia di grog.'):'Richiudo il mobile.';}
  if(target==='jug'&&verb==='take'){if(this.jugTaken)return 'La brocca è già nella borsa.';this.jugTaken=true;this.add('jug');return 'Prendo la brocca. Qualcosa tintinna dentro: posso estrarlo dalla borsa.';}
  if(target==='jug'&&verb==='extract'){if(!this.has('jug'))return 'Prima devo prendere la brocca.';if(this.eyeFound)return 'La brocca è ormai vuota.';this.eyeFound=true;this.add('eye');return 'Dalla brocca esce un occhio di cristallo! Tengo entrambi.';}
  if(target==='cup'&&verb==='take'){if(this.cupTaken)return 'Ho già preso la tazza.';this.cupTaken=true;this.add('cup');return 'Metto la tazza nella borsa.';}
  if(target==='grog'&&verb==='take'){if(!this.cabinetOpen)return 'Prima devo aprire il mobile.';if(this.grogTaken)return 'Ho già preso la bottiglia.';this.grogTaken=true;this.add('grog');return 'Prendo la bottiglia di grog.';}
  if(target==='handle'&&verb==='take'){if(this.jawTaken)return 'Ho già staccato la maniglia.';if(!this.rustDissolved)return 'Non si muove: le viti sono saldate dalla ruggine.';this.jawTaken=true;this.add('jaw');return this.jawKnown?'Recupero la mandibola del teschio.':'Stacco la strana maniglia e la metto nella borsa.';}
  if(target==='skull'){this.jawKnown=true;return this.jawGiven?'«Che sollievo! Ora possiamo parlare.»':'Il teschio borbotta e indica la bocca: gli serve la mandibola. Quella strana maniglia...';}
  if(target==='grog'&&verb==='break')return 'Meglio di no! Il grog è corrosivo: potrebbe schizzarmi addosso e fare danni.';
  if(target==='bottle'&&verb==='break')return 'Non nella borsa! Posso usare la bottiglia vuota sulla botte.';
  if(target==='broken'&&(verb==='take'||verb==='extract')&&this.bottleBroken&&!this.shardTaken){this.shardTaken=true;this.add('shard');return 'Recupero con attenzione un frammento tagliente dalla botte.';}
  if(target==='rope'){if(this.ropeCut)return 'Ho già un pezzo di corda.';if(verb!=='cut'||!this.has('shard'))return 'È inchiodata. Mi serve qualcosa di tagliente, non basta tirare.';this.ropeCut=true;this.add('rope');return 'Taglio un pezzo di corda con il vetro e lo metto nella borsa.';}
  return '';
 }
}
