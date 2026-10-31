export type TowerKind = 'laugh' | 'dog' | 'kungfu' | 'mouse';
export type EnemyKind = 'feidudu' | 'niulai' | 'lulu' | 'boss';
export const GRID = 80;
export const WIDTH = 1120;
export const HEIGHT = 640;
export const PATH = [[0,2],[4,2],[4,5],[9,5],[9,1],[13,1]].map(([x,y])=>({x:x*80+40,y:y*80+40}));
export const PADS = [[1,1],[3,1],[5,1],[7,1],[8,0],[10,0],[11,2],[12,2],[8,3],[10,3],[3,3],[5,3],[1,4],[3,6],[5,6],[7,6],[8,6],[10,6],[11,4]].map(([x,y],id)=>({id,x:x*80+40,y:y*80+40,buff:[3,11,15].includes(id)}));
export const TOWERS = {
 laugh: {name:'大笑奶蛙',tag:'范围 · 眩晕',description:'笑声同时命中附近敌人，短暂眩晕。',cost:[110,80,125],damage:[27,48,82],range:[170,185,205],cooldown:[1.45,1.25,1.05],color:0xf2c54d},
 dog: {name:'奶狗',tag:'扇形 · 击退',description:'朝前方狂吠，攻击扇形内的敌人并击退。',cost:[135,95,145],damage:[35,62,106],range:[185,205,225],cooldown:[1.25,1.1,.95],color:0x8bbfdf},
 kungfu: {name:'功夫奶蛙',tag:'近战 · 连击',description:'每个目标的第三次命中造成双倍伤害。',cost:[155,110,170],damage:[60,106,180],range:[125,140,155],cooldown:[.9,.78,.66],color:0xe5a387},
 mouse: {name:'奶鼠',tag:'召唤 · 鼠群',description:'召唤1 / 3 / 5只小鼠，持续追击附近的敌人。',cost:[125,95,150],damage:[17,24,34],range:[235,255,280],cooldown:[3,2.8,2.5],color:0xb5bb76}
} as const;
export const ENEMIES = {
 feidudu:{name:'肥嘟嘟',hp:95,speed:55,reward:12,leak:1,size:62},
 niulai:{name:'牛来',hp:270,speed:34,reward:24,leak:2,size:70},
 lulu:{name:'水豚噜噜',hp:75,speed:90,reward:15,leak:1,size:56},
 boss:{name:'肥嘟嘟大王',hp:1400,speed:25,reward:130,leak:4,size:108}
} as const;
export const WAVES = [[6,0,0,0],[8,0,0,0],[7,0,3,0],[6,3,0,0],[7,0,5,0],[4,4,5,0],[8,5,5,0],[5,6,6,0],[8,7,7,0],[4,6,8,1]];
// Keep the opening readable, then require investment across the whole route.
export const WAVE_PRESSURE = [
 {hp:1.15,speed:1,interval:1.05}, {hp:1.3,speed:1.02,interval:.95},
 {hp:1.8,speed:1.08,interval:.9}, {hp:2.4,speed:1.16,interval:.82},
 {hp:3.2,speed:1.24,interval:.75}, {hp:4.2,speed:1.32,interval:.68},
 {hp:5.4,speed:1.4,interval:.62}, {hp:6.8,speed:1.48,interval:.57},
 {hp:8.2,speed:1.56,interval:.52}, {hp:10,speed:1.64,interval:.48}
] as const;
export const wavePressure = (wave:number) => wave <= 0 ? {hp:1,speed:1,interval:1.2} : WAVE_PRESSURE[Math.min(wave,10)-1];
export const BOSS_PRESSURE = {hp:7,speed:1.35};
export const TOTAL_ENEMIES = WAVES.reduce((n,w)=>n+w.reduce((a,b)=>a+b,0),0);
