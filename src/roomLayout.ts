import type {Block,UV} from './navigation';
export const ROOM_METRES=.7001*6.12;
const SCALE=ROOM_METRES/9;
export const FLOOR_Y=.075;
export type Target='key'|'table'|'door'|'chest'|'cabinet'|'fireplace'|'window'|'shield'|'banner'|'logs'|'bucket'|'candle'|'rug'|'stairs'|'wall';
const uv=(x:number,z:number):UV=>({u:x/9+.5,v:z/9+.5});
export const targets:Record<Target,{goal:UV;aim:[number,number,number];description:string}>={
 key:{goal:uv(-1.65,.65),aim:[-2.55,.84,1.38],description:'Una chiave di ottone, vicino alla legna.'},
 chest:{goal:uv(-1.70,2.55),aim:[-3.0,.55,2.58],description:'Un baule con coperchio ricurvo. Posso aprirlo e richiuderlo.'},
 cabinet:{goal:uv(.85,-.90),aim:[.88,1.05,-3.15],description:'Una libreria: libri sugli scaffali e due ante nella parte inferiore.'},
 table:{goal:uv(.65,-.90),aim:[.4,2.9,-3.25],description:'Un vecchio volume verde, sopra la libreria.'},
 door:{goal:uv(3.25,-3.68),aim:[3.25,1.9,-4.02],description:'Una porta ad arco in cima ai gradini. La serratura richiede una chiave.'},
 stairs:{goal:uv(3.25,-2.0),aim:[3.25,.45,-3],description:'Gradini di legno. Conducono alla porta rialzata.'},
 fireplace:{goal:uv(-.20,-.65),aim:[-2,1.1,-2.15],description:'Un camino di pietra. La legna è pronta, ma il fuoco è spento.'},
 window:{goal:uv(-1.7,2.15),aim:[-3.85,2.2,2.7],description:'La luce fredda filtra attraverso i vetri della finestra.'},
 shield:{goal:uv(-1.75,.55),aim:[-3.9,3.1,.7],description:'Uno scudo e armi da parete. Sembrano appartenere al vecchio custode.'},
 banner:{goal:uv(-.1,-.9),aim:[-.8,2.7,-4.05],description:'Un arazzo con uno stemma: forse il simbolo di questa casa.'},
 logs:{goal:uv(-1.65,.65),aim:[-2.9,.55,.52],description:'Legna asciutta nel cestino, accanto al camino.'},
 bucket:{goal:uv(-1.55,3.55),aim:[-3.1,.35,3.9],description:'Un piccolo recipiente per raccogliere la cenere.'},
 candle:{goal:uv(1.6,-.90),aim:[1.5,3,-3.4],description:'Un candeliere antico. La candela è consumata.'},
 rug:{goal:uv(.1,.4),aim:[-1,.12,1],description:'Un tappeto sbiadito interrompe le assi del pavimento.'},
 wall:{goal:uv(.1,.4),aim:[0,2,-4.1],description:'Muri di pietra, travi di legno e molti anni di silenzio.'},
};
const block=(id:string,x:number,z:number,w:number,h:number):Block=>({id,u:x/9+.5,v:z/9+.5,w:w/9,h:h/9});
export const roomBlocks:Block[]=[
 block('west-wall',-4.5,-4.5,.56,9),block('rear-wall',-4.5,-4.5,9,.43),
 block('chest',-3.83,1.36,1.60,2.44),
 block('logs',-3.87,-.45,1.50,1.88),
 block('fireplace',-4.0,-4.07,3.17,3.58),
 block('cabinet',-.49,-4.07,2.83,2.79),
 block('left-bucket',-3.92,3.63,1.04,.65),
 block('right-bucket',-1.12,-3.98,.73,1.15),
 block('stairs-left-rail',2.20,-4.04,.42,2.11),
 block('stairs-right-rail',3.96,-4.04,.33,2.11),
];

// Restore original OBJ proportions; keep approach clearance in real metres.
for(const target of Object.values(targets)){target.aim[0]*=SCALE;target.aim[2]*=SCALE;}
for(const id of ["cabinet","table","candle","banner"] as Target[])targets[id].goal.v=.5-.24/ROOM_METRES;
targets.door.goal.v=.5-1.64/ROOM_METRES;
