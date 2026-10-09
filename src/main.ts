import './style.css';
import './homeScreen.css';
import {startHomeScreen} from './homeScreen';
import {initInterface} from './interface';
initInterface();
const mode=new URLSearchParams(location.search).get('mode');
if(mode==='2d'||mode==='3d'){document.getElementById('home-screen')?.remove();document.body.classList.remove('home-active');}
// Safari gesture events bypass touch-action on older iOS releases.
for(const type of ['gesturestart','gesturechange','gestureend'])document.addEventListener(type,event=>event.preventDefault(),{passive:false});
document.addEventListener('touchmove',event=>{if(event.touches.length>1)event.preventDefault();},{passive:false});

if(new URLSearchParams(location.search).get('mode')==='2d'){
  document.getElementById('boot-cover')?.remove();
  document.querySelector('.map-panel')?.setAttribute('hidden','');
  for(const id of ['open','close','music'])document.getElementById(id)!.hidden=true;
  Promise.all([import('phaser'),import('./room')]).then(([{default:Phaser},{RoomScene}])=>new Phaser.Game({type:Phaser.AUTO,parent:'game-container',width:1024,height:880,transparent:true,antialias:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[RoomScene]}));
}else if(new URLSearchParams(location.search).get('mode')==='3d'){
  document.getElementById('boot-cover')?.remove();
  import('./room3d').then(({startRoom3D})=>startRoom3D()).catch(error=>{console.error(error);const host=document.getElementById('game-container')!;host.replaceChildren();const p=document.createElement('p');p.className='loading-3d';p.textContent='La scena 3D non è disponibile. ';const link=document.createElement('a');link.href='?mode=2d';link.textContent='Apri la versione 2D';p.append(link);host.append(p);});
}

else startHomeScreen(async audio=>{const {startPixelCell}=await import('./pixelCell');return startPixelCell({audio,deferStart:true});});
