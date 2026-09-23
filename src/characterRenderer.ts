import Phaser from 'phaser';
import {CharacterMotion,DIRECTIONS,directionIndex,turnFrame} from './characterMotion';

/** Chroma-key the baked neutral-grey foot plate at render time, leaving source PNGs intact. */
export function registerCleanWalkTextures(scene:Phaser.Scene){
  for(const dir of DIRECTIONS){
    const source=scene.textures.get(dir).getSourceImage() as HTMLImageElement;
    const key=`clean-${dir}`;
    if(scene.textures.exists(key))continue;
    const canvas=scene.textures.createCanvas(key,source.width,source.height)!;
    const ctx=canvas.context;ctx.drawImage(source,0,0);
    const image=ctx.getImageData(0,0,source.width,source.height),pixels=image.data;
    for(let y=0;y<source.height;y++){
      if(y%192<145)continue;
      for(let x=0;x<source.width;x++){
        const i=(y*source.width+x)*4;
        const r=pixels[i],g=pixels[i+1],b=pixels[i+2];
        const light=Math.min(r,g,b),chroma=Math.max(r,g,b)-light;
        if(chroma<32&&light>92){
          const neutral=Phaser.Math.Clamp((32-chroma)/10,0,1);
          const bright=Phaser.Math.Clamp((light-92)/24,0,1);
          pixels[i+3]=Math.round(pixels[i+3]*(1-neutral*bright));
        }
      }
    }
    ctx.putImageData(image,0,0);
    // The old grey plate extended below the boots. Align real soles after keying it out.
    const cell=document.createElement('canvas');cell.width=160;cell.height=192;
    const cellContext=cell.getContext('2d')!;
    for(let frame=0;frame<24;frame++){
      const left=(frame%6)*160,top=Math.floor(frame/6)*192;
      let bottom=185;
      for(let y=191;y>=140;y--){
        let solid=0;for(let x=0;x<160;x++)if(pixels[((top+y)*source.width+left+x)*4+3]>96)solid++;
        if(solid>=3){bottom=y;break;}
      }
      const offset=185-bottom;
      if(offset){cellContext.clearRect(0,0,160,192);cellContext.drawImage(canvas.canvas,left,top,160,192,0,offset,160,192);ctx.clearRect(left,top,160,192);ctx.drawImage(cell,left,top);}
    }
    canvas.refresh();
    for(let frame=0;frame<24;frame++)canvas.add(frame,0,(frame%6)*160,Math.floor(frame/6)*192,160,192);
  }
}

/** One opaque actor: overlapping alpha fades made the old actor blink at every step. */
export class CharacterRenderer{
  readonly body:Phaser.GameObjects.Sprite;
  private alpha=1;
  private key='turn';
  private frame=2;
  constructor(scene:Phaser.Scene){this.body=scene.add.sprite(0,0,'turn',2).setOrigin(.5,186/192).setScale(.82);}
  setAlpha(alpha:number){this.alpha=alpha;this.body.setAlpha(alpha);}
  reset(){this.key='turn';this.frame=2;this.alpha=1;this.body.setTexture('turn',2).setAlpha(1);}
  update(motion:CharacterMotion,x:number,y:number,_dt:number){
    const key=motion.state==='walking'?`clean-${DIRECTIONS[directionIndex(motion.facing)]}`:'turn';
    const frame=motion.state==='walking'?Math.floor(motion.phase):turnFrame(motion.facing);
    if(key!==this.key||frame!==this.frame){this.body.setTexture(key,frame);this.key=key;this.frame=frame;}
    this.body.setPosition(x,y).setDepth(y).setAlpha(this.alpha);
  }
  snapshot(){return{texture:this.key,frame:this.frame,alpha:this.alpha,blending:false};}
}
