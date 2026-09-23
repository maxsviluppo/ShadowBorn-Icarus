(async()=>{
const $=id=>document.getElementById(id);const c=document.querySelector('canvas');
const click=(x,y)=>{const r=c.getBoundingClientRect(),o={clientX:r.left+x*r.width/1024,clientY:r.top+(y-85)*r.height/880,bubbles:true,button:0,buttons:1};c.dispatchEvent(new MouseEvent('mousemove',o));c.dispatchEvent(new MouseEvent('mousedown',o));c.dispatchEvent(new MouseEvent('mouseup',{...o,buttons:0}));};
const pause=ms=>new Promise(r=>setTimeout(r,ms));const arrive=async()=>{await pause(100);const end=Date.now()+9000;while(/cammino|avvicino/.test($('status').textContent)&&Date.now()<end)await pause(80);};
const checks=[];const check=(name,ok)=>{checks.push({name,ok});if(!ok)throw new Error(name);};
$('reset').click();$('examine').click();click(538,634);await pause(100);check('examine does not take key',$('key-item').hidden&&$('dialogue').textContent.includes('chiave'));
$('interact').click();click(538,634);await pause(100);click(475,800);await arrive();check('new destination cancels queued pickup',$('key-item').hidden);
click(683,485);await arrive();check('door locked without key',!$('goal-door').classList.contains('done'));
click(538,634);await arrive();check('key pickup',!$('key-item').hidden);
$('key-item').click();click(683,485);await arrive();check('unlock door',$('goal-door').classList.contains('done'));
click(683,485);await arrive();check('finish',!$('finish').hidden);
$('reset').click();check('reset',$('finish').hidden&&$('key-item').hidden&&!$('goal-door').classList.contains('done'));
$('debug').click();check('debug enabled',$('debug').getAttribute('aria-pressed')==='true');$('debug').click();
return JSON.stringify(checks);
})()
