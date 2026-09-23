import sharp from 'sharp';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'public/assets/character/turn-source.png');
const {width,height}=await sharp(source).metadata();
const w=Math.floor(width/4),h=Math.floor(height/4),layers=[];
for(let i=0;i<16;i++){
  const input=await sharp(source).extract({left:(i%4)*w,top:Math.floor(i/4)*h,width:w,height:h}).ensureAlpha().raw().toBuffer();
  let x0=w,y0=h,x1=0,y1=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(input[(y*w+x)*4+3]>32){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
  if(x1<=x0||y1<=y0)throw new Error(`Empty turn pose ${i}`);
  const outWidth=Math.round((x1-x0+1)*144/(y1-y0+1));
  const buffer=await sharp(input,{raw:{width:w,height:h,channels:4}}).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).resize(outWidth,144).png().toBuffer();
  layers.push({input:buffer,left:(i%4)*160+Math.floor((160-outWidth)/2),top:Math.floor(i/4)*192+42});
}
await sharp({create:{width:640,height:768,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(layers).png().toFile(path.join(root,'public/assets/character/turn.png'));
console.log('Packed 16 turn cells, 160×192, common 144px character height and foot pivot.');
