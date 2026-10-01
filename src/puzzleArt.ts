import type {CellPuzzle,Item} from './cellPuzzle';
export const puzzleArt:Record<Item,{file:string;crop:number[];label:string}>={
 jug:{file:'jug',crop:[375,85,280,380],label:'Brocca'},cup:{file:'cup',crop:[380,122,305,308],label:'Tazza'},
 eye:{file:'eye',crop:[310,90,445,380],label:'Occhio di cristallo'},grog:{file:'grog',crop:[365,40,300,475],label:'Bottiglia di grog'},
 bottle:{file:'bottle-empty',crop:[365,40,300,475],label:'Bottiglia vuota'},broken:{file:'broken',crop:[222,60,595,450],label:'Bottiglia rotta'},
 shard:{file:'shard',crop:[365,120,270,330],label:'Frammento tagliente'},jaw:{file:'jaw',crop:[110,100,775,365],label:'Strana maniglia'},
 rope:{file:'rope',crop:[310,220,425,210],label:'Pezzo di corda'}
};
export const puzzleUrl=(file:string)=>file==='rope'?'/assets/pixel/rope-piece.jpg':file==='bottle-empty'?'/assets/pixel/puzzle/bottle-empty.png':`/assets/pixel/puzzle/${file}.jpg`;
export function inventoryArt(id:Item,label:string){const a=puzzleArt[id];return `<svg viewBox="${a.crop.join(' ')}" aria-hidden="true"><image href="${puzzleUrl(a.file)}" width="1024" height="559"/></svg>`;}
export async function loadPuzzleArt(){
 const images:Record<string,HTMLCanvasElement>={};
 await Promise.all(['jug','cup','eye','grog','bottle-empty','broken','shard','jaw','cabinet-open','cabinet-closed'].map(async file=>{
  const image=new Image();image.src=puzzleUrl(file);await image.decode();
  const c=document.createElement('canvas');c.width=1024;c.height=559;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0,1024,559);
  // Runtime sprite background key: original supplied JPEGs remain untouched.
  if(file.startsWith('cabinet')){
   const poly=file==='cabinet-open'?[[378,184],[432,137],[647,187],[639,213],[639,434],[619,450],[615,470],[586,459],[581,440],[406,420],[396,421],[392,401],[307,440],[298,435],[293,270],[379,226]]:[[378,184],[432,137],[647,187],[639,213],[639,434],[619,450],[615,470],[586,459],[581,440],[406,420],[392,424],[390,209],[378,202]];
   ctx.clearRect(0,0,1024,559);ctx.save();ctx.beginPath();poly.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip();ctx.drawImage(image,0,0,1024,559);ctx.restore();
  }else{
   const pixels=ctx.getImageData(0,0,1024,559),d=pixels.data;const bg=[d[0],d[1],d[2]];
   for(let i=0;i<d.length;i+=4)if(Math.max(Math.abs(d[i]-bg[0]),Math.abs(d[i+1]-bg[1]),Math.abs(d[i+2]-bg[2]))<12)d[i+3]=0;
   ctx.putImageData(pixels,0,0);
  }
  images[file]=c;
 }));
 function sprite(ctx:CanvasRenderingContext2D,id:Item,x:number,y:number,w:number,h:number){const a=puzzleArt[id];ctx.drawImage(images[a.file],a.crop[0],a.crop[1],a.crop[2],a.crop[3],x,y,w,h);}
 return {drawHeld(ctx:CanvasRenderingContext2D,id:Item,x:number,y:number){sprite(ctx,id,x-10,y-5,20,10);},drawBottle(ctx:CanvasRenderingContext2D,x:number,y:number,rotation:number){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);sprite(ctx,'bottle',-6,-16,12,24);ctx.restore();},draw(ctx:CanvasRenderingContext2D,s:CellPuzzle){
  const source=images[s.cabinetOpen?'cabinet-open':'cabinet-closed'];
  ctx.drawImage(source,376,158,409.6,223.6);
  // Cover the original tiny handle with neighbouring door wood, then place the supplied handle.
  const hx=s.cabinetOpen?506:560,hy=293;
  ctx.drawImage(source,s.cabinetOpen?347:494,335,30,50,hx,hy,12,20);
  if(!s.jawTaken)sprite(ctx,'jaw',hx-1,hy+4,16,9);
  if(!s.jugTaken)sprite(ctx,'jug',551,181,35,49);
  if(!s.cupTaken)sprite(ctx,'cup',600,214,23,24);
  if(s.cabinetOpen&&!s.grogTaken)sprite(ctx,'grog',565,277,19,31);
 },drawFragments(ctx:CanvasRenderingContext2D,s:CellPuzzle){if(s.bottleBroken){ctx.save();if(s.shardTaken){ctx.beginPath();ctx.rect(641,275,60,9);ctx.clip();}sprite(ctx,'broken',641,273,60,23);ctx.restore();}},drawSkull(ctx:CanvasRenderingContext2D,s:CellPuzzle){if(s.jawGiven)sprite(ctx,'jaw',265,313,29,14);}};
}
