"""Pack supplied frames with consistent foot pivots, preserving their artwork."""
from pathlib import Path
from PIL import Image
import sys
source=Path(sys.argv[1])
target=Path(__file__).resolve().parents[1]/'public/assets/character'
target.mkdir(parents=True,exist_ok=True)
for direction in ['N','NE','E','SE','S','SO','O','NO']:
    original=Image.open(source/f'{direction}.png').convert('RGBA')
    atlas=Image.new('RGBA',(960,768))
    for frame in range(1,25):
        x,y=(frame%5)*1280,(frame//5)*720
        cell=original.crop((x,y,x+1280,y+720))
        box=cell.getchannel('A').point(lambda a:255 if a>30 else 0).getbbox()
        if not box: raise ValueError(f'Empty frame {direction}/{frame}')
        crop=cell.crop(box)
        crop=crop.resize((round(crop.width*.24),round(crop.height*.24)),Image.Resampling.LANCZOS)
        idx=frame-1
        atlas.alpha_composite(crop,((idx%6)*160+(160-crop.width)//2,(idx//6)*192+186-crop.height))
    atlas.save(target/f'{direction}.png',optimize=True)
    print(direction,atlas.size)
