// Offline composition for checking the Blender poses against the game's bed placement.
import sharp from 'sharp';import * as THREE from 'three';
const out='art/prisoner-character';
const mask=await sharp('public/assets/pixel/puzzle/bed-canva-alpha.png').resize(1024,559).png().toBuffer();
const bed=await sharp('public/assets/pixel/elements/Gemini_Generated_Image_gz3m2dgz3m2dgz3m.jpg').resize(1024,559).ensureAlpha().composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
const placedBed=await sharp(bed).resize(481,263,{kernel:'nearest'}).png().toBuffer();
const camera=new THREE.OrthographicCamera(-.9,.9,1.05,-1.05,.1,30);camera.position.set(6,5.7,6);camera.lookAt(0,.8,0);camera.updateMatrixWorld();
const anchor=new THREE.Vector3(0,0,0).project(camera),centre=new THREE.Vector3(0,.8,0).project(camera),height=219.3975,width=height*192/224,p={x:510+340*.45-335*.69,y:280+125*.45+145*.69};
const nx=p.x+(centre.x-anchor.x)*width/2,ny=p.y-(centre.y-anchor.y)*height/2;
for(const [name,x,y] of [['lying',420,318],['seated',408,330],['standing',nx,ny]]){
 const hero=await sharp(`${out}/wake-${name}.png`).resize(Math.round(width),Math.round(height),{kernel:'nearest'}).png().toBuffer();
 const left=Math.round(p.x+(x-nx)-(anchor.x+1)/2*width),top=Math.round(p.y+(y-ny)-(1-anchor.y)/2*height);
 await sharp({create:{width:1024,height:559,channels:4,background:'#000'}}).composite([{input:'public/assets/pixel/cell-transparent.png'},{input:placedBed,left:176,top:197},{input:hero,left,top}]).png().toFile(`${out}/wake-layout-${name}.png`);
}
