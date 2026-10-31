import { PATH, PADS, TOWERS, ENEMIES, WAVES, BOSS_PRESSURE, wavePressure, type TowerKind, type EnemyKind } from './config.ts';
export type Point = {x:number;y:number};
export type Enemy = {id:number;kind:EnemyKind;hp:number;maxHp:number;speed:number;progress:number;stunUntil:number;stunReady:number;slowUntil:number;dead:boolean};
export type Tower = {id:number;pad:number;kind:TowerKind;level:number;spent:number;cooldown:number;combos:Map<number,number>};
export type Summon = {id:number;tower:number;level:number;x:number;y:number;expires:number;cooldown:number};
export type GameEvent = {type:string;[key:string]:unknown};
const segments=PATH.slice(1).map((p,i)=>Math.hypot(p.x-PATH[i].x,p.y-PATH[i].y));
export const PATH_LENGTH=segments.reduce((a,b)=>a+b,0);
export function pointAt(progress:number):Point {
 let p=Math.max(0,progress);
 for(let i=0;i<segments.length;i++) {if(p<=segments[i]){const t=p/segments[i];return{x:PATH[i].x+(PATH[i+1].x-PATH[i].x)*t,y:PATH[i].y+(PATH[i+1].y-PATH[i].y)*t};}p-=segments[i];}
 return {...PATH[PATH.length-1]};
}
const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export class World {
 milk=360;health=12;energy=0;wave=0;time=0;prep=8;speed=1;paused=false;
 status:'playing'|'won'|'lost'='playing';active=false;spawnClock=0;kills=0;
 enemies:Enemy[]=[];towers:Tower[]=[];summons:Summon[]=[];queue:EnemyKind[]=[];events:GameEvent[]=[];nextId=1;
 emit(type:string,data:Record<string,unknown>={}){this.events.push({type,...data});}
 drain(){return this.events.splice(0);}
 build(pad:number,kind:TowerKind){
  if(this.status!=='playing'||this.paused||!PADS[pad]||this.towers.some(t=>t.pad===pad)||this.milk<TOWERS[kind].cost[0])return false;
  const cost=TOWERS[kind].cost[0];this.milk-=cost;
  this.towers.push({id:this.nextId++,pad,kind,level:1,spent:cost,cooldown:.25,combos:new Map()});this.emit('build',{pad,kind});return true;
 }
 upgrade(id:number){const t=this.towers.find(t=>t.id===id);if(!t||t.level>=3||this.paused||this.status!=='playing')return false;
  const cost=TOWERS[t.kind].cost[t.level];if(this.milk<cost)return false;
  this.milk-=cost;t.spent+=cost;t.level++;this.emit('upgrade',{pad:t.pad});return true;
 }
 refund(t:Tower){return Math.floor(t.spent*.6);}
 sell(id:number){const t=this.towers.find(t=>t.id===id);if(!t||this.paused||this.status!=='playing')return false;
  this.milk+=this.refund(t);this.towers=this.towers.filter(x=>x.id!==id);this.summons=this.summons.filter(x=>x.tower!==id);this.emit('sell',{pad:t.pad});return true;
 }
 startWave(){if(this.active||this.status!=='playing'||this.paused||this.wave>=WAVES.length)return false;
  const counts=WAVES[this.wave];this.wave++;this.active=true;this.spawnClock=0;this.queue=[];
  // Interleave the three normal types, leaving the boss as a finale.
  const remaining=counts.slice();const kinds:EnemyKind[]=['feidudu','niulai','lulu'];
  while(remaining.slice(0,3).some(n=>n>0))for(let i=0;i<3;i++)if(remaining[i]>0){this.queue.push(kinds[i]);remaining[i]--;}
  if(remaining[3])this.queue.push('boss');this.emit('wave',{wave:this.wave});return true;
 }
 spawn(kind:EnemyKind){const config=ENEMIES[kind],pressure=kind==='boss'&&this.wave>0?BOSS_PRESSURE:wavePressure(this.wave),hp=Math.round(config.hp*pressure.hp);const e:Enemy={id:this.nextId++,kind,hp,maxHp:hp,speed:config.speed*pressure.speed,progress:0,stunUntil:0,stunReady:0,slowUntil:0,dead:false};this.enemies.push(e);return e;}
 damage(e:Enemy,amount:number){if(e.dead)return;e.hp-=amount;if(e.hp<=0){e.dead=true;this.milk+=ENEMIES[e.kind].reward;this.energy=Math.min(100,this.energy+4);this.kills++;this.emit('kill',{...pointAt(e.progress),kind:e.kind});for(const t of this.towers)t.combos.delete(e.id);}}
 skill(){if(this.energy<100||this.status!=='playing'||this.paused)return false;this.energy=0;
  for(const e of this.enemies)if(!e.dead){this.damage(e,60);e.slowUntil=this.time+2;}this.emit('skill');return true;
 }
 target(origin:Point,range:number){return this.enemies.filter(e=>!e.dead&&dist(origin,pointAt(e.progress))<=range).sort((a,b)=>b.progress-a.progress)[0];}
 update(realDt:number){
  if(this.paused||this.status!=='playing')return;
  const dt=realDt*this.speed;this.time+=dt;
  if(!this.active){this.prep-=dt;if(this.prep<=0)this.startWave();}
  if(this.active&&this.queue.length){this.spawnClock-=dt;while(this.spawnClock<=0&&this.queue.length){this.spawn(this.queue.shift()!);this.spawnClock+=wavePressure(this.wave).interval;}}
  for(const e of this.enemies){if(e.dead)continue;
   if(e.stunUntil<=this.time)e.progress+=e.speed*dt*(e.slowUntil>this.time?.6:1);
   if(e.progress>=PATH_LENGTH){e.dead=true;this.health=Math.max(0,this.health-ENEMIES[e.kind].leak);this.energy=Math.min(100,this.energy+6);this.emit('leak');for(const t of this.towers)t.combos.delete(e.id);}
  }
  if(this.health<=0){this.status='lost';this.emit('end',{won:false});return;}
  for(const t of this.towers){const cfg=TOWERS[t.kind],l=t.level-1,origin=PADS[t.pad];t.cooldown-=dt;
   if(t.cooldown>0)continue;const target=this.target(origin,cfg.range[l]);if(!target)continue;
   t.cooldown=cfg.cooldown[l]*(origin.buff?.85:1);
   if(t.kind==='mouse'){
    const max=[1,3,5][l],count=this.summons.filter(s=>s.tower===t.id&&s.expires>this.time).length;
    for(let i=count;i<max;i++)this.summons.push({id:this.nextId++,tower:t.id,level:t.level,x:origin.x+(i-max/2)*12,y:origin.y,expires:this.time+6,cooldown:0});
    if(count<max)this.emit('summon',{x:origin.x,y:origin.y});
   }else{
    const pos=pointAt(target.progress);this.emit('attack',{kind:t.kind,x:origin.x,y:origin.y,tx:pos.x,ty:pos.y});
    if(t.kind==='laugh'){
     for(const e of this.enemies)if(!e.dead&&dist(pointAt(e.progress),pos)<=[72,84,100][l]){this.damage(e,cfg.damage[l]);if(e.stunReady<=this.time){e.stunUntil=this.time+.38+l*.1;e.stunReady=this.time+4;}}
    }else if(t.kind==='dog'){
     const angle=Math.atan2(pos.y-origin.y,pos.x-origin.x);
     for(const e of this.enemies){const p=pointAt(e.progress);const a=Math.atan2(p.y-origin.y,p.x-origin.x);const delta=Math.atan2(Math.sin(a-angle),Math.cos(a-angle));
      if(!e.dead&&dist(origin,p)<=cfg.range[l]&&Math.abs(delta)<=Math.PI*35/180){this.damage(e,cfg.damage[l]);e.progress=Math.max(0,e.progress-(e.kind==='boss'?5:14+l*4));}}
    }else{
     const combo=(t.combos.get(target.id)??0)+1;t.combos.set(target.id,combo%3);this.damage(target,cfg.damage[l]*(combo%3===0?2:1));if(combo%3===0)this.emit('combo',{...pos});
    }
   }
  }
  for(const s of this.summons){if(s.expires<=this.time)continue;const tower=this.towers.find(t=>t.id===s.tower);if(!tower)continue;
   const origin=PADS[tower.pad],target=this.target(origin,TOWERS.mouse.range[s.level-1]+40);if(!target)continue;
   const p=pointAt(target.progress),distance=dist(s,p);if(distance>20){const travel=Math.min(distance,180*dt);s.x+=(p.x-s.x)/distance*travel;s.y+=(p.y-s.y)/distance*travel;}
   s.cooldown-=dt;if(dist(s,p)<32&&s.cooldown<=0){this.damage(target,TOWERS.mouse.damage[s.level-1]);s.cooldown=.6;this.emit('mouseHit',{x:p.x,y:p.y});}
  }
  this.summons=this.summons.filter(s=>s.expires>this.time&&this.towers.some(t=>t.id===s.tower));this.enemies=this.enemies.filter(e=>!e.dead);
  if(this.active&&!this.queue.length&&!this.enemies.length){this.active=false;this.milk+=40+5*this.wave;this.prep=8;this.emit('clear',{wave:this.wave});if(this.wave===WAVES.length){this.status='won';this.emit('end',{won:true});}}
 }
 get stars(){return this.status==='won'?(this.health===12?3:this.health>=6?2:1):0;}
}
