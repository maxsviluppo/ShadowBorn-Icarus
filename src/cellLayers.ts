// Original JPEGs are sampled directly; silhouettes only clip their background at render time.
export const elementUrl=(id:string)=>`/assets/pixel/elements/Gemini_Generated_Image_${id}.jpg`;
type Layer={cache?:HTMLCanvasElement;id:string;image:HTMLImageElement;x:number;y:number;scale:number;depth:number;poly:number[][]};
const cabinet=[[377,184],[433,155],[434,95],[445,78],[445,62],[465,56],[489,57],[501,65],[520,70],[534,82],[531,107],[519,119],[515,151],[529,158],[536,147],[556,141],[579,143],[585,154],[598,157],[601,184],[645,185],[650,202],[634,212],[638,445],[617,452],[615,469],[588,463],[583,447],[406,423],[391,424],[389,211],[377,204]];
const openCabinet=[...cabinet.slice(0,34),[401,422],[331,454],[293,435],[293,270],[377,224]];
export async function loadCellLayers(){
 const definitions=[
 {id:'cabinet',file:'ouinckouinckouin',x:376,y:158,scale:.40,depth:.52,poly:cabinet},
 {id:'cabinet-open',file:'i0gngxi0gngxi0gn',x:376,y:158,scale:.40,depth:.52,poly:openCabinet},
 {id:'barrel',file:'dr4bvydr4bvydr4b',x:521,y:242,scale:.29,depth:.82,poly:[[391,208],[397,170],[410,145],[426,128],[456,116],[486,113],[515,116],[554,115],[585,124],[605,142],[620,170],[627,208],[634,245],[635,293],[631,323],[632,365],[620,400],[597,423],[565,439],[529,443],[489,442],[447,430],[419,411],[400,384],[392,351],[386,305],[386,259]]},
 {id:'bed',file:'gz3m2dgz3m2dgz3m',x:176,y:197,scale:.47,depth:.89,poly:[[297,252],[306,248],[314,259],[314,285],[566,174],[586,189],[586,122],[595,118],[600,127],[598,146],[640,157],[690,177],[720,205],[720,180],[730,175],[735,188],[732,322],[724,329],[716,329],[716,310],[651,339],[628,398],[610,392],[587,416],[560,414],[543,405],[540,444],[531,454],[518,451],[519,426],[332,364],[310,369],[299,388],[292,385]]},
 {id:'mouse',file:'pylnipylnipylnip',x:636,y:309,scale:.14,depth:.94,poly:[[415,139],[427,119],[448,126],[473,173],[485,176],[512,169],[536,171],[559,150],[579,141],[598,145],[611,168],[610,190],[598,213],[580,225],[577,255],[600,280],[614,309],[618,354],[608,388],[594,401],[585,420],[560,433],[541,431],[541,414],[470,410],[446,404],[438,386],[450,377],[456,352],[438,333],[435,312],[425,293],[414,280],[415,257],[428,241],[434,212],[431,193],[417,172]]}
 ];
 return Promise.all(definitions.map(async d=>{const image=new Image();image.src=elementUrl(d.file);await image.decode();const layer={...d,image} as Layer;const cache=document.createElement('canvas');cache.width=1024;cache.height=559;const ctx=cache.getContext('2d')!;ctx.imageSmoothingEnabled=false;drawCellLayer(ctx,layer);layer.cache=cache;return layer;}));
}
export function drawCellLayer(ctx:CanvasRenderingContext2D,l:Layer){if(l.cache){ctx.drawImage(l.cache,0,0);return;}ctx.save();ctx.translate(l.x,l.y);ctx.scale(l.scale,l.scale);ctx.beginPath();l.poly.forEach((p,i)=>i?ctx.lineTo(...p as [number,number]):ctx.moveTo(...p as [number,number]));ctx.closePath();ctx.clip();ctx.drawImage(l.image,0,0,1024,559);ctx.restore();}
