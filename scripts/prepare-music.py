# Short equal-power seam makes the Gemini track suitable for repeated background playback.
import subprocess, imageio_ffmpeg, sys
from pathlib import Path
ff=imageio_ffmpeg.get_ffmpeg_exe()
source=Path(sys.argv[1])
raw=subprocess.run([ff,'-v','error','-i',str(source),'-f','f32le','-ac','2','-ar','44100','-'],capture_output=True,check=True).stdout
end=len(raw)/8/44100
fade=1.5
filters=f'[0:a]asplit=3[a][b][c];[a]atrim=start={fade}:end={end-fade},asetpts=PTS-STARTPTS[mid];[b]atrim=start={end-fade},asetpts=PTS-STARTPTS[tail];[c]atrim=end={fade},asetpts=PTS-STARTPTS[head];[tail][head]acrossfade=d={fade}:c1=tri:c2=tri[seam];[mid][seam]concat=n=2:v=0:a=1,volume=0.8[out]'
subprocess.run([ff,'-y','-v','error','-i',str(source),'-filter_complex',filters,'-map','[out]','-codec:a','libmp3lame','-b:a','160k','public/assets/audio/room-music.mp3'],check=True)
print('Music loop prepared:',round(end-fade,2),'seconds')
