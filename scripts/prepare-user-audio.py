"""Prepare user-supplied recordings. Trim, time-stretch without pitch shifts, fade and normalize."""
from pathlib import Path
import subprocess, imageio_ffmpeg, numpy as np, wave, json, shutil
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'art'/'audio-user';OUT=ROOT/'public'/'assets'/'audio'
SOURCE.mkdir(exist_ok=True);OUT.mkdir(exist_ok=True)
ff=imageio_ffmpeg.get_ffmpeg_exe()
files={'step':'passi_interni_pietra.mp3','book':'apri libro.mp3','chest':'apertura baule.mp3','door':'apertura porta.mp3','lock':'chiave apre porta.mp3'}
for name in files.values():
 dst=SOURCE/name
 if not dst.exists():shutil.copyfile(Path('C:/Users/Max/Downloads')/name,dst)
# Four separate impacts keep the foot contacts independent of the source cadence.
clips=[('step-0','step',.27,.50,.23),('step-1','step',.94,1.20,.23),('step-2','step',2.57,2.90,.23),('step-3','step',3.64,3.94,.23),
('book-open','book',.02,.85,.9),('book-close','book',.98,1.228,.30),
('chest-open','chest',.10,1.65,1.2),('chest-close','chest',2.38,3.10,.36),
('door-open','door',.015,1.30,1.5),('door-close','door',1.36,1.968,.40),
('cabinet-open','door',.03,.65,.9),('cabinet-close','door',1.64,1.968,.28),
('lock-open','lock',.10,1.72,1.1)]
manifest=[]
for name,kind,start,end,duration in clips:
 tempo=(end-start)/duration;filters=[f'atrim=start={start}:end={end}', 'asetpts=PTS-STARTPTS']
 while tempo>2:filters.append('atempo=2');tempo/=2
 while tempo<.5:filters.append('atempo=0.5');tempo/=.5
 filters.append(f'atempo={tempo}')
 raw=subprocess.run([ff,'-v','error','-i',str(SOURCE/files[kind]),'-af',','.join(filters),'-f','f32le','-ac','1','-ar','44100','-'],capture_output=True,check=True).stdout
 a=np.frombuffer(raw,dtype='<f4').copy();length=round(duration*44100)
 a=np.pad(a,(0,max(0,length-len(a))))[:length]
 fade=min(220,len(a)//2);a[:fade]*=np.linspace(0,1,fade);a[-fade:]*=np.linspace(1,0,fade)
 # Closing action: source's final impact starts near the visual contact point.
 if name.endswith('-close'):
  full={'book':.7,'chest':1,'door':1.3,'cabinet':.8}[kind if name!='cabinet-close' else 'cabinet'];impact={'book':.48,'chest':.74,'door':1.02,'cabinet':.60}[name.split('-')[0]]
  lead=round(impact*44100); a=np.concatenate([np.zeros(lead,dtype=np.float32),a]);length=round(full*44100);a=np.pad(a,(0,max(0,length-len(a))))[:length]
 fade=min(220,len(a)//2);a[:fade]*=np.linspace(0,1,fade);a[-fade:]*=np.linspace(1,0,fade)
 peak=float(np.max(np.abs(a)));a*= (.40 if kind=='step' else .56)/max(peak,1e-8)
 with wave.open(str(OUT/(name+'.wav')),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(44100);w.writeframes((np.clip(a,-1,1)*32767).astype('<i2').tobytes())
 manifest.append({'file':name+'.wav','source':files[kind],'source_segment':[start,end],'seconds':len(a)/44100,'adaptation':'closing impact extracted from supplied opening recording' if name.endswith('-close') else 'pitch-preserving time stretch'})
(OUT/'sources.json').write_text(json.dumps({'effects':'User supplied recordings; cabinet adapted from door. Closing cues derived from final source impacts.','clips':manifest},indent=2),encoding='utf8')
print('Prepared',len(clips),'recorded cues')
