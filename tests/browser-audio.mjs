(async()=>{
const $=id=>document.getElementById(id),canvas=document.querySelector('canvas'),pause=ms=>new Promise(r=>setTimeout(r,ms));
$('reset').click();if($('debug').getAttribute('aria-pressed')!=='true')$('debug').click();await pause(80);
const before={...$('game-container').dataset};const r=canvas.getBoundingClientRect();
const o={clientX:r.left+790*r.width/1024,clientY:r.top+(724-85)*r.height/880,bubbles:true,button:0,buttons:1};
canvas.dispatchEvent(new MouseEvent('mousemove',o));canvas.dispatchEvent(new MouseEvent('mousedown',o));canvas.dispatchEvent(new MouseEvent('mouseup',{...o,buttons:0}));
await pause(100);const turn={...$('game-container').dataset};
if(turn.motion!=='turning'||turn.stepCount!==before.stepCount)throw new Error('sound during stationary turn');
const samples=[];for(let i=0;i<20;i++){await pause(150);samples.push({...$('game-container').dataset});}
if(samples.some(x=>Number(x.actorAlpha)!==1))throw new Error('opacity blink');
if(Number(samples.at(-1).stepCount)<=Number(before.stepCount))throw new Error('no actual footsteps');
$('sound').click();const muted=Number($('game-container').dataset.stepCount);await pause(700);
if(Number($('game-container').dataset.stepCount)!==muted)throw new Error('mute does not work');
$('reset').click();const idle=Number($('game-container').dataset.stepCount);await pause(600);
if(Number($('game-container').dataset.stepCount)!==idle)throw new Error('sound while idle');
$('sound').click();$('debug').click();
return JSON.stringify({turnHasNoSound:true,constantOpacitySamples:samples.length,stepsPlayed:muted-Number(before.stepCount),audio:samples.at(-1).audioState,mute:true,idleSilent:true});
})()
