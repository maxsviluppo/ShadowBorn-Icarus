import type {UV,Point,Block} from './navigation';
export const CELL_METRES=5.6;
export const projectCell=({u,v}:UV):Point=>({x:510+340*u-335*v,y:280+125*u+145*v});
export const unprojectCell=({x,y}:Point):UV=>({u:((x-510)*145+(y-280)*335)/91175,v:((y-280)*340-(x-510)*125)/91175});
export function contains(p:Point,poly:number[][]){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [x,y]=poly[i],[a,b]=poly[j];if((y>p.y)!==(b>p.y)&&p.x<(a-x)*(p.y-y)/(b-y)+x)inside=!inside;}return inside;}
export const cellBlocks:Block[]=[
 {id:'west-wall',u:0,v:0,w:.035,h:1},{id:'rear-wall',u:0,v:0,w:1,h:.035},
 {id:'bed',u:.015,v:.19,w:.35,h:.50},
 {id:'cabinet',u:.18,v:.015,w:.25,h:.19},
 {id:'barrel',u:.44,v:.015,w:.24,h:.22},
 {id:'mouse',u:.68,v:.035,w:.075,h:.12},
];
export const cellObjects=[
 {id:'skull',name:'Teschio',poly:[[253,278],[276,264],[300,283],[303,320],[281,338],[255,321]],goal:{u:.21,v:.77},description:'Un teschio sul catenaccio. Ho la strana sensazione che mi stia ascoltando.'},
 {id:'door',name:'Porta',poly:[[197,235],[256,203],[296,216],[307,244],[307,384],[201,423]],goal:{u:.21,v:.77},description:'Una robusta porta di legno. La catena e quel teschio non promettono niente di buono.'},
 {id:'window',name:'Finestra',poly:[[393,116],[455,92],[465,101],[466,183],[397,216]],goal:{u:.45,v:.69},description:'La luce passa tra le sbarre. Fuori dev’essere una bella giornata.'},
 {id:'jug',name:'Brocca',poly:[[548,178],[589,178],[589,231],[548,231]],goal:{u:.49,v:.30},description:'Una brocca crepata.'},
 {id:'cup',name:'Tazza',poly:[[598,211],[626,211],[626,240],[598,240]],goal:{u:.49,v:.30},description:'Una tazza di metallo.'},
 {id:'handle',name:'Strana maniglia',poly:[[555,289],[580,289],[580,318],[555,318]],goal:{u:.49,v:.30},description:'Una strana maniglia con le viti arrugginite.'},
 {id:'grog',name:'Bottiglia di grog',poly:[[560,273],[587,273],[587,311],[560,311]],goal:{u:.49,v:.30},description:'Una bottiglia di grog.'},
 {id:'cabinet',name:'Mobile',poly:[[527,238],[581,218],[637,240],[636,326],[599,355],[532,323]],goal:{u:.49,v:.30},description:'Un mobile consumato dal tempo, con piccole ante e un ripiano.'},
 {id:'barrel',name:'Barile',poly:[[632,291],[650,276],[682,275],[703,290],[712,345],[700,365],[672,376],[636,359]],goal:{u:.72,v:.30},description:'Un barile di legno cerchiato di ferro. Chissà che cosa conteneva.'},
 {id:'mouse',name:'Topo',poly:[[686,328],[699,323],[709,337],[721,325],[732,332],[725,349],[731,364],[717,378],[695,374],[689,356]],goal:{u:.81,v:.22},description:'Il mio compagno di cella. Sembra molto più a suo agio di me.'},
 {id:'bed',name:'Letto',poly:[[315,325],[443,270],[447,254],[466,251],[520,276],[523,350],[394,408],[313,379]],goal:{u:.45,v:.69},description:'Un letto di paglia e una coperta logora. Ho dormito in posti peggiori. Credo.'},
 {id:'rope',name:'Corda',poly:[[546,483],[580,463],[640,458],[683,436],[733,422],[745,435],[694,458],[647,474],[588,482],[575,507],[551,514]],goal:{u:.76,v:.71},description:'Una corda sul pavimento. Potrebbe tornarmi utile.'},
] as const;
export type CellObject=typeof cellObjects[number];
// Foreground silhouettes are redrawn from the untouched painting, never recoloured.
export const occluders=[
 {depth:.52,poly:[[527,238],[550,226],[550,185],[578,181],[591,215],[621,216],[625,235],[637,240],[636,326],[599,355],[532,323]]},
 {depth:.82,poly:[[632,291],[650,276],[682,275],[703,290],[712,345],[700,365],[672,376],[636,359]]},
 {depth:.89,poly:[[315,325],[443,270],[447,254],[466,251],[520,276],[523,350],[394,408],[313,379]]},
] as const;

// A long prop must sort by its two ground edges, not by one centre-depth sum.
export function cellLayerOccludes(id:string,depth:number,p:UV){
 if(id==='bed'){const b=cellBlocks.find(b=>b.id==='bed')!;return p.u<b.u+b.w&&p.v<b.v+b.h;}
 return p.u+p.v<depth;
}
