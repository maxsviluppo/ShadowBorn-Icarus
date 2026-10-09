import {RoomAudio} from './roomAudio';

type PreparedGame={start:()=>void};
/** Home stays visible while the cell loads; its only start button owns the gesture. */
export function startHomeScreen(prepare:(audio:RoomAudio)=>Promise<PreparedGame>){
 const home=document.getElementById('home-screen')!;
 const start=document.getElementById('home-start') as HTMLButtonElement;
 const sound=document.getElementById('home-sound') as HTMLButtonElement;
 const status=document.getElementById('home-status')!;
 const video=document.getElementById('home-video') as HTMLVideoElement;
 const presentation=document.createElement('video');presentation.id='home-presentation';presentation.src='/assets/home/presentation.mp4';presentation.muted=true;presentation.playsInline=true;presentation.preload='auto';presentation.playbackRate=.8;presentation.setAttribute('aria-hidden','true');home.append(presentation);
 const skip=document.createElement('button');skip.className='cinematic-skip';skip.textContent='Salta ›';skip.hidden=true;home.append(skip);
 const shell=document.querySelector<HTMLElement>('.game-shell')!;shell.inert=true;
 const audio=new RoomAudio(),theme=new Audio('/assets/audio/home-theme.mp3');
 theme.loop=true;theme.preload='auto';theme.volume=.20;
 let context:AudioContext|undefined,gain:GainNode|undefined,starting=false,muted=false,disposed=false;
 const updateSound=()=>{sound.textContent=muted?'♫':'♪';sound.setAttribute('aria-label',muted?'Attiva la sigla':'Disattiva la sigla');sound.setAttribute('aria-pressed',String(!muted));};
 const playTheme=()=>{
  if(muted||disposed)return;
  // The GainNode also fades correctly on mobile browsers that ignore .volume.
  try{
   if(!context){context=new AudioContext();gain=context.createGain();gain.gain.value=.20;context.createMediaElementSource(theme).connect(gain);gain.connect(context.destination);theme.volume=1;}
   void context.resume().catch(()=>{});
  }catch{/* HTML media remains usable when Web Audio is unavailable. */}
  void theme.play().then(updateSound).catch(updateSound);
 };
 sound.onclick=()=>{muted=!muted;if(muted)theme.pause();else playTheme();updateSound();};
 updateSound();
 const firstTouch=(event:Event)=>{if(!(event.target instanceof Element)||!event.target.closest('#home-start,#home-sound'))playTheme();};
 home.addEventListener('pointerdown',firstTouch);
 const homeKey=(event:Event)=>{event.stopPropagation();firstTouch(event);};
 home.addEventListener('keydown',homeKey);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(!reduced)void video.play().catch(()=>{});else video.pause();
 // Autoplay is optional. If blocked, the illustrated home remains fully usable.
 void theme.play().then(updateSound).catch(updateSound);
 let ending=false,holding=false;let endingTimer:ReturnType<typeof setTimeout>|undefined;
 let failure:unknown;
 const prepared=prepare(audio).catch(error=>{failure=error;return null;});
 const visibility=()=>{if(document.hidden){video.pause();presentation.pause();theme.pause();}else if(!disposed&&!ending){if(starting&&!holding)void presentation.play().catch(()=>{});else if(!reduced)void video.play().catch(()=>{});if(!muted)playTheme();}};
 document.addEventListener('visibilitychange',visibility);
 const finish=async()=>{
  if(ending)return;ending=true;clearTimeout(endingTimer);skip.hidden=true;
  status.textContent='Preparazione dell’avventura…';
  const game=await prepared;
  if(!game){home.classList.remove('presenting');home.classList.remove('presentation-ready');presentation.pause();console.error(failure);audio.pause();status.textContent='La cella non si è caricata. Tocca di nuovo per riprovare.';start.disabled=false;start.removeAttribute('aria-busy');start.onclick=()=>location.reload();return;}
  status.textContent='';home.classList.add('leaving');
  if(context&&gain){gain.gain.cancelScheduledValues(context.currentTime);gain.gain.setValueAtTime(gain.gain.value,context.currentTime);gain.gain.linearRampToValueAtTime(0,context.currentTime+.9);}
  else{const initial=theme.volume,t=performance.now();const fade=()=>{theme.volume=initial*Math.max(0,1-(performance.now()-t)/900);if(performance.now()-t<900&&!disposed)requestAnimationFrame(fade);};fade();}
  await new Promise(resolve=>setTimeout(resolve,950));
  theme.pause();video.pause();presentation.pause();disposed=true;void context?.close().catch(()=>{});
  home.removeEventListener('pointerdown',firstTouch);home.removeEventListener('keydown',homeKey);document.removeEventListener('visibilitychange',visibility);
  document.body.classList.remove('home-active');shell.inert=false;
  audio.fadeInMusic(1.4);game.start();home.remove();
 };
 skip.onclick=()=>{void finish();};
 presentation.ontimeupdate=()=>{const lift=Math.max(0,Math.min(1,(presentation.currentTime-8.8)/1.15));presentation.style.filter=`brightness(${1+lift*.85})`;};
 presentation.onended=()=>{if(ending||holding)return;holding=true;home.classList.add('expression-hold');presentation.style.filter='brightness(1.85)';endingTimer=setTimeout(()=>{void finish();},2000);};
 presentation.onerror=()=>{if(starting)void finish();};
 start.onclick=(event)=>{
  if(starting)return;starting=true;start.disabled=true;start.setAttribute('aria-busy','true');
  audio.prepareMusicTransition();playTheme();home.classList.add('presenting');skip.hidden=false;if(event?.detail===0)skip.focus({preventScroll:true});
  presentation.onplaying=()=>{home.classList.add('presentation-ready');};
  void presentation.play().catch(()=>{void finish();});
 };
}
