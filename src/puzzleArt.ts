import type {CellPuzzle,Item} from './cellPuzzle';
export const puzzleArt:Record<Item,{file:string;crop:number[];label:string}>={
 jug:{file:'jug',crop:[375,85,280,380],label:'Brocca'},cup:{file:'cup',crop:[380,122,305,308],label:'Tazza'},
 eye:{file:'eye',crop:[310,90,445,380],label:'Occhio di cristallo'},grog:{file:'grog',crop:[365,40,300,475],label:'Bottiglia di grog'},
 bottle:{file:'bottle-empty',crop:[365,40,300,475],label:'Bottiglia vuota'},broken:{file:'broken',crop:[222,60,595,450],label:'Bottiglia rotta'},
 shard:{file:'shard',crop:[365,120,270,330],label:'Frammento tagliente'},jaw:{file:'jaw',crop:[110,100,775,365],label:'Strana maniglia'},
 rope:{file:'rope',crop:[310,220,425,210],label:'Pezzo di corda'}
};
export const puzzleUrl=(file:string)=>file==='rope'?'/assets/pixel/rope-piece.jpg':(file==='bottle-empty'||file.startsWith('cabinet'))?`/assets/pixel/puzzle/${file}.png`:`/assets/pixel/puzzle/${file}.jpg`;
export function inventoryArt(id:Item,label:string){const a=puzzleArt[id];return `<svg viewBox="${a.crop.join(' ')}" aria-hidden="true"><image href="${puzzleUrl(a.file)}" width="1024" height="559"/></svg>`;}
export async function loadPuzzleArt(){
 const images:Record<string,HTMLCanvasElement>={};
 await Promise.all(['jug','cup','eye','grog','bottle-empty','broken','shard','jaw','cabinet-open','cabinet-closed'].map(async file=>{
  const image=new Image();image.src=puzzleUrl(file);await image.decode();
  const c=document.createElement('canvas');c.width=1024;c.height=559;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0,1024,559);
  // Runtime sprite background key: original supplied JPEGs remain untouched.
  if(file.startsWith('cabinet')){
   // Preserve supplied alpha and colour; align both cutouts to the same tabletop.
   const raw=document.createElement('canvas');raw.width=image.naturalWidth;raw.height=image.naturalHeight;
   const r=raw.getContext('2d')!;r.drawImage(image,0,0);const data=r.getImageData(0,0,raw.width,raw.height).data;
   let left=raw.width,top=raw.height,right=0,bottom=0;
   for(let y=0;y<raw.height;y++)for(let x=0;x<raw.width;x++)if(data[(y*raw.width+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   ctx.clearRect(0,0,1024,559);ctx.imageSmoothingEnabled=false;
   const open=file==='cabinet-open';ctx.drawImage(image,left,top,right-left+1,bottom-top+1,open?293:378,137,open?354:269,333);
  }else{
   const pixels=ctx.getImageData(0,0,1024,559),d=pixels.data;const bg=[d[0],d[1],d[2]];
   for(let i=0;i<d.length;i+=4)if(Math.max(Math.abs(d[i]-bg[0]),Math.abs(d[i+1]-bg[1]),Math.abs(d[i+2]-bg[2]))<12)d[i+3]=0;
   ctx.putImageData(pixels,0,0);
  }
  images[file]=c;
 }));
 function sprite(ctx:CanvasRenderingContext2D,id:Item,x:number,y:number,w:number,h:number){const a=puzzleArt[id];ctx.drawImage(images[a.file],a.crop[0],a.crop[1],a.crop[2],a.crop[3],x,y,w,h);}
 return {drawHeld(ctx:CanvasRenderingContext2D,id:Item,x:number,y:number){const w=id==='eye'?12:id==='cup'?16:20,h=id==='eye'?11:id==='cup'?16:10;sprite(ctx,id,x-w/2,y-h/2,w,h);},drawBottle(ctx:CanvasRenderingContext2D,x:number,y:number,rotation:number){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);sprite(ctx,'bottle',-6,-16,12,24);ctx.restore();},draw(ctx:CanvasRenderingContext2D,s:CellPuzzle){
  const source=images[s.cabinetOpen?'cabinet-open':'cabinet-closed'];
  ctx.drawImage(source,376,158,409.6,223.6);
  // Cover the original tiny handle with neighbouring door wood, then place the supplied handle.
  const hx=s.cabinetOpen?506:560,hy=293;
  ctx.drawImage(source,s.cabinetOpen?347:494,335,30,50,hx,hy,12,20);
  if(!s.jawTaken)sprite(ctx,'jaw',hx-1,hy+4,16,9);
  if(!s.jugTaken)sprite(ctx,'jug',551,181,35,49);
  if(!s.cupTaken)sprite(ctx,'cup',600,214,23,24);
  if(s.cabinetOpen&&!s.grogTaken)sprite(ctx,'grog',565,277,19,31);
 },drawFragments(ctx:CanvasRenderingContext2D,s:CellPuzzle){if(s.bottleBroken){ctx.save();if(s.shardTaken){ctx.beginPath();ctx.rect(641,275,60,9);ctx.clip();}sprite(ctx,'broken',641,273,60,23);ctx.restore();}},drawSkull(ctx:CanvasRenderingContext2D,s:CellPuzzle){if(s.jawGiven)sprite(ctx,'jaw',265,313,29,14);if(s.eyeGiven)sprite(ctx,'eye',285,287,10,9);}};
}
