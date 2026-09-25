export type Point = { x: number; y: number };
export type UV = { u: number; v: number };
export type Block = { u: number; v: number; w: number; h: number; id: string };
export const GRID = 56;
export const RADIUS = .026;
// Wall limits include shoulder/backpack clearance, beyond the foot radius.
export const blocks: Block[] = [
  { id: 'west-wall', u: 0, v: 0, w: .045, h: 1 },
  { id: 'rear-wall', u: 0, v: 0, w: 1, h: .045 },
  // Window sill and gathered curtains protrude into the room.
  { id: 'window', u: 0, v: .32, w: .11125, h: .40 },
  { id: 'table', u: .43, v: .41, w: .25, h: .18 },
  { id: 'back-table', u: .035, v: .125, w: .24, h: .13 },
  { id: 'cabinet', u: .60, v: .015, w: .15, h: .23 },
  { id: 'front-candle', u: .90, v: .52, w: .075, h: .075 },
  { id: 'left-candle', u: .04, v: .84, w: .07, h: .095 },
  { id: 'right-candle', u: .80, v: .015, w: .055, h: .07 },
  { id: 'chest', u: .37, v: .73, w: .16, h: .12 },
];
export function project({u,v}:UV):Point{return{x:512+(u-v)*410,y:485+(u+v)*207};}
export function unproject({x,y}:Point):UV{return{u:(y-485)/414+(x-512)/820,v:(y-485)/414-(x-512)/820};}
export function walkable(p:UV):boolean{return p.u>=RADIUS&&p.v>=RADIUS&&p.u<=1-RADIUS&&p.v<=1-RADIUS&&!blocks.some(b=>p.u>b.u-RADIUS&&p.u<b.u+b.w+RADIUS&&p.v>b.v-RADIUS&&p.v<b.v+b.h+RADIUS);}
export function clearSegment(a:UV,b:UV):boolean{
  if(!walkable(a)||!walkable(b))return false;
  // Exact segment/expanded-box intersection avoids cutting tiny obstacle corners.
  for(const block of blocks){
    let enter=0,exit=1;
    for(const [start,delta,min,max] of [
      [a.u,b.u-a.u,block.u-RADIUS-1e-7,block.u+block.w+RADIUS+1e-7],
      [a.v,b.v-a.v,block.v-RADIUS-1e-7,block.v+block.h+RADIUS+1e-7],
    ]){
      if(Math.abs(delta)<1e-12){if(start<min||start>max){enter=2;break;}}
      else{const t1=(min-start)/delta,t2=(max-start)/delta;enter=Math.max(enter,Math.min(t1,t2));exit=Math.min(exit,Math.max(t1,t2));}
    }
    if(enter<=exit)return false;
  }
  return true;
}
const uv=(id:number):UV=>({u:(id%GRID+.5)/GRID,v:(Math.floor(id/GRID)+.5)/GRID});
function nearest(p:UV):number{
  let best=-1,distance=Infinity;
  for(let id=0;id<GRID*GRID;id++){const q=uv(id);if(!walkable(q))continue;const d=(p.u-q.u)**2+(p.v-q.v)**2;if(d<distance&&(!walkable(p)||clearSegment(p,q))){best=id;distance=d;}}
  return best;
}
export function findPath(start:UV,target:UV):UV[]|null{
  if(target.u<0||target.v<0||target.u>1||target.v>1||!walkable(start))return null;
  const a=nearest(start),b=nearest(target);if(a<0||b<0)return null;
  const end=walkable(target)&&clearSegment(uv(b),target)?target:uv(b);
  if(clearSegment(start,end))return[end];
  const open=new Set([a]),cost=new Map([[a,0]]),prev=new Map<number,number>();
  const heuristic=(id:number)=>Math.hypot(uv(id).u-uv(b).u,uv(id).v-uv(b).v);
  while(open.size){
    let current=-1,score=Infinity;
    for(const id of open){const s=cost.get(id)!+heuristic(id);if(s<score){score=s;current=id;}}
    if(current===b){
      const raw:UV[]=[end];let id=b;
      while(id!==a){raw.unshift(uv(id));id=prev.get(id)!;}raw.unshift(start);
      const smooth:UV[]=[];let index=0;
      while(index<raw.length-1){let next=raw.length-1;while(next>index+1&&!clearSegment(raw[index],raw[next]))next--;smooth.push(raw[next]);index=next;}
      return smooth;
    }
    open.delete(current);const cx=current%GRID,cy=Math.floor(current/GRID);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;const x=cx+dx,y=cy+dy;if(x<0||y<0||x>=GRID||y>=GRID)continue;
      const id=y*GRID+x;if(!clearSegment(uv(current),uv(id)))continue;
      const next=cost.get(current)!+Math.hypot(dx,dy)/GRID;
      if(next<(cost.get(id)??Infinity)){cost.set(id,next);prev.set(id,current);open.add(id);}
    }
  }
  return null;
}
