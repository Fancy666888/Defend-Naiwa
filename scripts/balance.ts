/** Deterministic first-level smoke simulation. Uses ordinary costs and rewards. */
import {World} from '../src/engine.ts';
import type {TowerKind} from '../src/config.ts';
export function simulate(plan:[number,TowerKind][],upgradeFirst=false){
 const world=new World();let built=0;
 for(let frame=0;frame<30000&&world.status==='playing';frame++){
  if(frame%20===0){
   const upgrade=world.towers.filter(t=>t.level<3).sort((a,b)=>a.level-b.level)[0];
   if(upgradeFirst&&upgrade)world.upgrade(upgrade.id);
   else if(built<plan.length){const [pad,kind]=plan[built];if(world.build(pad,kind))built++;}
   else if(upgrade)world.upgrade(upgrade.id);
   if(world.energy>=100&&world.enemies.length>=3)world.skill();
  }
  world.update(.05);
 }
 return {status:world.status,wave:world.wave,health:world.health,kills:world.kills,seconds:Math.round(world.time),milk:world.milk,towers:world.towers.map(t=>({pad:t.pad,kind:t.kind,level:t.level}))};
}
export const strategies:{name:string;plan:[number,TowerKind][];upgradeFirst?:boolean}[]=[
 {name:'mixed',plan:[[1,'laugh'],[11,'kungfu'],[8,'dog'],[15,'mouse'],[2,'laugh'],[17,'dog'],[14,'mouse']]},
 {name:'laugh-only',plan:[[1,'laugh'],[11,'laugh'],[8,'laugh'],[15,'laugh'],[2,'laugh'],[17,'laugh'],[14,'laugh']]},
 {name:'upgrade-first',plan:[[1,'laugh'],[11,'kungfu'],[8,'dog'],[15,'mouse']],upgradeFirst:true}
];
if(process.argv[1]?.endsWith('balance.ts'))for(const s of strategies)console.log(s.name,JSON.stringify(simulate(s.plan,s.upgradeFirst)));
