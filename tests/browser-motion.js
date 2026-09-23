(async()=>{
 const $=id=>document.getElementById(id),c=document.querySelector('canvas');
 $('reset').click();if($('debug').getAttribute('aria-pressed')!=='true')$('debug').click();
 const pause=ms=>new Promise(r=>setTimeout(r,ms));await pause(50);
 const start={...$('game-container').dataset};
 const r=c.getBoundingClientRect(),o={clientX:r.left+790*r.width/1024,clientY:r.top+(724-85)*r.height/880,bubbles:true,button:0,buttons:1};
 c.dispatchEvent(new MouseEvent('mousemove',o));c.dispatchEvent(new MouseEvent('mousedown',o));c.dispatchEvent(new MouseEvent('mouseup',{...o,buttons:0}));
 await pause(100);const turn={...$('game-container').dataset};
 if(turn.motion!=='turning'||Math.hypot(Number(turn.playerX)-Number(start.playerX),Number(turn.playerY)-Number(start.playerY))>.01)throw new Error('turn must stay planted');
 await pause(800);const walking={...$('game-container').dataset};
 if(walking.motion!=='walking')throw new Error('must walk after turn');
 $('debug').click();return JSON.stringify({start,turn,walking});
})()
