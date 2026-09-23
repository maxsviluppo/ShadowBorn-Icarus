import sharp from 'sharp';
const src='public/assets/props/furniture-source.png';
const {width,height}=await sharp(src).metadata();
for(const [index,name] of ['table','chest'].entries()){
 const half=await sharp(src).extract({left:index*Math.floor(width/2),top:0,width:Math.floor(width/2),height}).png().toBuffer();
 await sharp(half).trim({threshold:15}).resize({width:index===0?624:399}).png().toFile(`public/assets/props/${name}.png`);
 console.log(name);
}
