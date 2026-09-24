import './style.css';
if(new URLSearchParams(location.search).get('mode')==='2d'){
  for(const id of ['open','close','music'])document.getElementById(id)!.hidden=true;
  Promise.all([import('phaser'),import('./room')]).then(([{default:Phaser},{RoomScene}])=>new Phaser.Game({type:Phaser.AUTO,parent:'game-container',width:1024,height:880,transparent:true,antialias:true,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[RoomScene]}));
}else{
  import('./room3d').then(({startRoom3D})=>startRoom3D()).catch(error=>{console.error(error);const host=document.getElementById('game-container')!;host.replaceChildren();const p=document.createElement('p');p.className='loading-3d';p.textContent='La scena 3D non è disponibile. ';const link=document.createElement('a');link.href='?mode=2d';link.textContent='Apri la versione 2D';p.append(link);host.append(p);});
}
