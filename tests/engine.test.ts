import {test} from 'node:test';
import assert from 'node:assert/strict';
import {World,pointAt,PATH_LENGTH} from '../src/engine.ts';
import {PADS,WAVES,TOTAL_ENEMIES} from '../src/config.ts';
const idle=()=>{const w=new World();w.active=true;w.queue=['boss'];w.spawnClock=10000;return w;};
test('first level contains 134 enemies and an aligned path',()=>{assert.equal(TOTAL_ENEMIES,134);assert.equal(WAVES.length,10);assert.deepEqual(pointAt(-50),{x:40,y:200});assert.deepEqual(pointAt(PATH_LENGTH),{x:1080,y:120});assert.deepEqual(pointAt(400),{x:360,y:280});});
test('build, upgrade and sell preserve economy and reject duplicate builds',()=>{const w=new World();assert.ok(w.build(1,'laugh'));assert.equal(w.milk,250);assert.equal(w.build(1,'dog'),false);assert.ok(w.upgrade(w.towers[0].id));assert.equal(w.milk,170);assert.ok(w.upgrade(w.towers[0].id));assert.equal(w.milk,45);assert.equal(w.upgrade(w.towers[0].id),false);assert.ok(w.sell(w.towers[0].id));assert.equal(w.milk,234);assert.equal(w.towers.length,0);assert.equal(w.sell(2),false);});
test('death reward and energy settle once even with multiple simultaneous attackers',()=>{const w=new World();const e=w.spawn('feidudu');w.damage(e,100);w.damage(e,100);assert.equal(w.milk,372);assert.equal(w.energy,4);assert.equal(w.kills,1);});
test('pause freezes timers, movement, summons, preparation and economy',()=>{const w=idle();w.build(1,'mouse');const e=w.spawn('boss');e.progress=200;w.update(.1);w.paused=true;const before=JSON.stringify(w);w.update(20);assert.equal(JSON.stringify(w),before);assert.equal(w.build(2,'laugh'),false);assert.equal(w.sell(w.towers[0].id),false);assert.equal(w.startWave(),false);});
test('double speed advances the same simulation as two ordinary steps',()=>{const a=idle(),b=idle();a.spawn('niulai');b.spawn('niulai');b.speed=2;a.update(.1);a.update(.1);b.update(.1);assert.equal(a.enemies[0].progress,b.enemies[0].progress);assert.equal(a.time,b.time);});
test('laugh re-stun is blocked for four seconds',()=>{const w=idle();w.build(1,'laugh');const t=w.towers[0];const e=w.spawn('boss');e.progress=240;t.cooldown=0;w.update(.01);const first=e.stunUntil;assert.ok(first>w.time);assert.equal(e.stunReady,w.time+4);t.cooldown=0;w.update(.5);assert.equal(e.stunUntil,first);e.progress=240;w.time=4.1;t.cooldown=0;w.update(.01);assert.ok(e.stunUntil>w.time);});
test('dog knockback remains on path and does not damage behind the cone',()=>{const w=idle();w.build(0,'dog');const t=w.towers[0];const e=w.spawn('boss');e.progress=80;t.cooldown=0;w.update(.01);assert.ok(e.progress>=0);assert.ok(e.hp<e.maxHp);const p=pointAt(e.progress);assert.equal(p.y,200);});
test('kungfu third hit doubles damage with per-target counters',()=>{const w=idle();w.build(11,'kungfu');const t=w.towers[0];const e=w.spawn('boss');e.progress=400;
 for(let i=0;i<3;i++){t.cooldown=0;e.progress=400;w.update(.001);}assert.equal(e.hp,1400-60*4);const b=w.spawn('boss');b.progress=405;t.cooldown=0;w.update(.001);assert.equal(b.hp,1340);assert.equal(t.combos.get(e.id),0);assert.equal(t.combos.get(b.id),1);});
test('mouse caps are 1/3/5 and selling removes all owned summons',()=>{for(const level of [1,2,3]){const w=idle();w.milk=1000;w.build(1,'mouse');const t=w.towers[0];while(t.level<level)w.upgrade(t.id);const e=w.spawn('boss');e.progress=240;t.cooldown=0;w.update(.01);assert.equal(w.summons.length,[1,3,5][level-1]);t.cooldown=0;w.update(.01);assert.equal(w.summons.length,[1,3,5][level-1]);w.sell(t.id);assert.equal(w.summons.length,0);}});
test('summons expire at six seconds while pause does not consume their life',()=>{const w=idle();w.build(1,'mouse');const e=w.spawn('boss');e.progress=240;w.towers[0].cooldown=0;w.update(.01);assert.equal(w.summons.length,1);const expires=w.summons[0].expires;w.towers[0].cooldown=99;w.time=expires;w.update(.01);assert.equal(w.summons.length,0);});
test('guard skill costs energy, damages once and applies two-second slow',()=>{const w=idle();const e=w.spawn('boss');assert.equal(w.skill(),false);w.energy=100;assert.equal(w.skill(),true);assert.equal(w.energy,0);assert.equal(e.hp,1340);assert.equal(e.slowUntil,2);assert.equal(w.skill(),false);w.update(.1);assert.equal(e.progress,1.5);});
test('leaks deduct configured health once and defeat stops simulation',()=>{const w=idle();w.health=4;const e=w.spawn('boss');e.progress=PATH_LENGTH;w.update(.01);assert.equal(w.health,0);assert.equal(w.status,'lost');const time=w.time;w.update(10);assert.equal(w.time,time);assert.equal(w.health,0);});
test('wave bonus occurs once and last wave resolves to correct stars',()=>{for(const [hp,stars] of [[12,3],[11,2],[6,2],[5,1],[1,1]]){const w=new World();w.wave=10;w.active=true;w.health=hp;w.update(.01);assert.equal(w.status,'won');assert.equal(w.stars,stars);assert.equal(w.milk,450);w.update(1);assert.equal(w.milk,450);}});
test('only legal road-adjacent build pads are defined',()=>{for(const p of PADS){assert.ok(p.x>0&&p.x<1120&&p.y>0&&p.y<640);for(let d=0;d<=PATH_LENGTH;d+=40)assert.ok(Math.hypot(p.x-pointAt(d).x,p.y-pointAt(d).y)>39);}});

test('gold-rimmed pads shorten attack cooldown by 15 percent',()=>{const w=idle();w.build(11,'kungfu');const t=w.towers[0];w.spawn('boss').progress=400;t.cooldown=0;w.update(.001);assert.equal(t.cooldown,.9*.85);});
test('dog cone excludes enemies behind its attack direction',()=>{const w=idle();w.build(10,'dog');const t=w.towers[0];const front=w.spawn('boss');front.progress=240;const back=w.spawn('boss');back.progress=480;t.cooldown=0;w.update(.001);assert.equal(back.hp,1365);assert.equal(front.hp,1400);});
test('no-tower play reaches defeat without granting leak rewards',()=>{const w=new World();for(let i=0;i<12000&&w.status==='playing';i++)w.update(.05);assert.equal(w.status,'lost');assert.equal(w.kills,0);assert.equal(w.health,0);});

test('challenge rewards mixed defenses and punishes stopping at four towers',async()=>{
 const {simulate,strategies}=await import('../scripts/balance.ts');
 const [mixed,laugh,sparse]=strategies.map(strategy=>simulate(strategy.plan,strategy.upgradeFirst));
 assert.equal(mixed.status,'won');assert.equal(mixed.health,12);assert.equal(mixed.kills,134);
 assert.equal(laugh.status,'won');assert.ok(laugh.health<mixed.health);assert.ok(laugh.kills<134);
 assert.equal(sparse.status,'lost');assert.equal(sparse.wave,10);assert.equal(sparse.health,0);
});

test('later waves scale enemy health, movement and density while boss has its own profile',async()=>{
 const {wavePressure}=await import('../src/config.ts');
 const w=new World();w.wave=1;const first=w.spawn('feidudu');w.wave=10;const last=w.spawn('feidudu'),boss=w.spawn('boss');
 assert.equal(first.maxHp,109);assert.equal(last.maxHp,950);assert.ok(last.speed>first.speed);
 assert.equal(boss.maxHp,9800);assert.equal(boss.speed,33.75);
 assert.ok(wavePressure(10).interval<wavePressure(1).interval);
 assert.deepEqual(wavePressure(100),wavePressure(10));
});
