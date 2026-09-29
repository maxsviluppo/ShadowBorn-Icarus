import type {Block,UV} from './navigation';
export const ROOM_METRES=5.6;
export const FLOOR_Y=.075;
export type Target='key'|'table'|'door'|'chest'|'cabinet'|'window'|'bed'|'jug'|'mouse'|'rope'|'skull'|'wall';
const uv=(x:number,z:number):UV=>({u:x/ROOM_METRES+.5,v:z/ROOM_METRES+.5});
export const targets:Record<Target,{goal:UV;aim:[number,number,number];description:string}>={
 key:{goal:uv(.75,1.15),aim:[.95,.12,1.60],description:'Una piccola chiave di ottone, vicino alla corda.'},
 door:{goal:uv(-1.85,1.03),aim:[-2.50,1.65,1.03],description:'Una porta di quercia, chiusa da una catena e da un teschio di ferro.'},
 skull:{goal:uv(-1.85,1.03),aim:[-2.38,1.20,.91],description:'Il teschio sul catenaccio sembra sul punto di parlare. Meglio ricordarselo.'},
 window:{goal:uv(-.85,-1.05),aim:[-2.63,2.22,-1.40],description:'Sbarre robuste. Dalla finestra entra una luce calda, e forse il profumo del mare.'},
 bed:{goal:uv(-.80,-.30),aim:[-1.80,.64,-1.10],description:'Paglia, una coperta logora e ben poco spazio per i sogni.'},
 cabinet:{goal:uv(0,-.98),aim:[0,.65,-1.74],description:'Un vecchio mobile di legno. Le due ante si possono aprire.'},
 table:{goal:uv(.35,-.98),aim:[.24,1.30,-1.92],description:'Un piccolo registro, accanto alla brocca.'},
 jug:{goal:uv(.35,-.98),aim:[-.20,1.50,-2.18],description:'Una brocca di terracotta e una tazza di metallo.'},
 chest:{goal:uv(1.55,-1.02),aim:[1.63,1.05,-2.02],description:'Un barile di legno. Posso sollevare il coperchio e richiuderlo.'},
 mouse:{goal:uv(2.12,-.86),aim:[2.21,.30,-1.27],description:'Un piccolo topo. Pare conoscere questa cella meglio di me.'},
 rope:{goal:uv(1.60,.64),aim:[1.40,.10,1.35],description:'Una corda abbandonata sul pavimento.'},
 wall:{goal:uv(0,.3),aim:[0,1.80,-2.64],description:'Pietra consumata, muschio nelle fughe e un silenzio poco rassicurante.'},
};
const block=(id:string,x:number,z:number,w:number,h:number):Block=>({id,u:x/ROOM_METRES+.5,v:z/ROOM_METRES+.5,w:w/ROOM_METRES,h:h/ROOM_METRES});
export const roomBlocks:Block[]=[
 block('west-wall',-2.8,-2.8,.27,5.6),block('rear-wall',-2.8,-2.8,5.6,.27),
 block('bed',-2.45,-2.24,1.35,2.19),
 block('cabinet-and-doors',-.64,-2.55,1.28,1.23),
 block('barrel',1.10,-2.56,1.05,1.08),
 block('mouse',2.05,-1.61,.35,.49),
];
