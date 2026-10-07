// Offline Canvas rendering of the actual runtime artwork in all four gift states.
import fs from 'node:fs';import ts from 'typescript';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage,Path2D}=require(process.env.CANVAS_MODULE||'@napi-rs/canvas');
globalThis.Path2D=Path2D;globalThis.document={createElement:()=>createCanvas(1024,559)};
globalThis.qaLoad=url=>loadImage('public'+url);
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const motionUrl=moduleUrl(fs.readFileSync('src/skullMotion.ts','utf8'));
const {skullMotion}=await import(motionUrl);
const source=fs.readFileSync('src/puzzleArt.ts','utf8').replace("'./skullMotion'",JSON.stringify(motionUrl)).replace(/const (\w+)=new Image\(\);\1.src=([^;]+);await \1.decode\(\);/g,'const $1=await qaLoad($2);');
const {loadPuzzleArt}=await import(moduleUrl(source));
const art=await loadPuzzleArt(),door=await qaLoad('/assets/pixel/cell-transparent.png');
let peak=0;for(let t=0;t<3;t+=1/120)if(Math.abs(skullMotion(t).x)>Math.abs(skullMotion(peak).x))peak=t;
const sheet=createCanvas(4*240,2*260),out=sheet.getContext('2d');out.fillStyle='#151515';out.fillRect(0,0,960,520);out.imageSmoothingEnabled=false;
for(let i=0;i<4;i++)for(let j=0;j<2;j++){
 const canvas=createCanvas(1024,559),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.drawImage(door,0,0);art.drawSkull(ctx,{eyeGiven:!!(i&1),jawGiven:!!(i&2)},j?peak:0);
 out.drawImage(canvas,248,263,62,74,i*240+27,j*260+25,186,222);
 out.fillStyle='#fff';out.font='12px sans-serif';out.fillText(`${i&1?'occhio':'senza occhio'} / ${i&2?'mascella':'senza mascella'} / ${j?'movimento':'riposo'}`,i*240+4,j*260+15);
}
fs.writeFileSync('art/prisoner-character/skull-motion-review.png',sheet.toBuffer('image/png'));
console.log('Rendered four gift states at rest and peak motion',peak);
