from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
root=Path('art/knee-review');frames=[]
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20);small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
for i in range(12):
 sheet=Image.new('RGB',(640,506),(224,224,220));draw=ImageDraw.Draw(sheet)
 for x,label,name in [(0,'CAMMINATA','Walk'),(320,'CORSA','Run')]:
  sheet.paste(Image.open(root/f'{name}-{i:02}.png').convert('RGB'),(x,36));draw.text((x+160,8),label,font=font,anchor='mt',fill=(30,30,30))
 draw.text((320,484),'AVANTI  \u2190     |     Cicli rallentati - versione 0.9.1',font=small,anchor='mt',fill=(30,30,30))
 frames.append(sheet)
frames[0].save(root/'Gambe-corrette.gif',save_all=True,append_images=frames[1:],duration=100,loop=0,disposal=2)
frames[3].save(root/'Gambe-corrette.png')
