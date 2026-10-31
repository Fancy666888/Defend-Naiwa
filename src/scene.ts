import Phaser from 'phaser';
import assets from './assets.json';
import {publicUrl} from './urls.ts';
import { World, pointAt, type GameEvent } from './engine.ts';
import { WIDTH, HEIGHT, PATH, PADS, TOWERS, ENEMIES } from './config.ts';
export type SceneBridge = {world:World;selectedPad:number|null;selectedKind:string;started:boolean;onPad:(pad:number)=>void;onTick:()=>void;onEvent:(event:GameEvent)=>void};
type Effect=GameEvent&{born:number;life:number};
export class GardenScene extends Phaser.Scene {
 bridge:SceneBridge;images=new Map<string,Phaser.GameObjects.Image>();fx:Effect[]=[];ground!:Phaser.GameObjects.Graphics;effects!:Phaser.GameObjects.Graphics;marks!:Phaser.GameObjects.Graphics;badges!:Phaser.GameObjects.Graphics;heart!:Phaser.GameObjects.Image;lastUi=0;
 constructor(bridge:SceneBridge){super('Garden');this.bridge=bridge;}
 preload(){for(const [key,asset] of Object.entries(assets))this.load.image(key,publicUrl(asset.url));this.load.on('loaderror',(file:Phaser.Loader.File)=>console.warn('Asset unavailable:',file.key));}
 art(key:string,x:number,y:number,width:number,depth=0){
  if(!this.textures.exists(key)){const g=this.make.graphics({x:0,y:0});g.fillStyle(0xf2cf6a);g.fillCircle(24,24,22);g.generateTexture(key,48,48);g.destroy();}
  const image=this.add.image(x,y,key);image.setScale(width/image.width).setDepth(depth);return image;
 }
 create(){
  const bg=this.art('grass',WIDTH/2,HEIGHT/2,WIDTH);bg.setDisplaySize(WIDTH,HEIGHT);
  const wash=this.add.graphics();wash.fillStyle(0xe9f2ce,.25);wash.fillRect(0,0,WIDTH,HEIGHT);
  this.ground=this.add.graphics();const g=this.ground;
  g.lineStyle(78,0x718c49,.2);g.beginPath();g.moveTo(PATH[0].x-50,PATH[0].y+5);for(const p of PATH.slice(1))g.lineTo(p.x,p.y+5);g.lineTo(WIDTH+10,PATH.at(-1)!.y+5);g.strokePath();
  this.road(g,70,0xd1b985,1);this.road(g,59,0xf1ddb1,1);this.road(g,43,0xf7e7c3,.6);
  // Small seeds and pebbles on the path, kept clear of tower pads.
  for(let p=80;p<2100;p+=49){const pos=pointAt(p);g.fillStyle(p%3?0xd3b883:0xfff2ce,.5);g.fillEllipse(pos.x+Math.sin(p)*18,pos.y+Math.cos(p)*16,5,3);}
  this.art('pond',110,536,205,1);this.art('mushroom',564,45,86,1);this.art('flowers',1029,539,124,1);this.art('rocks',1056,402,80,1);this.art('flower',690,580,68,1);this.art('flowers',177,40,80,1);this.art('mushroom',62,364,66,1);
  for(const pad of PADS){
   g.fillStyle(0x56783c,.14);g.fillEllipse(pad.x,pad.y+10,65,34);
   if(pad.buff){g.lineStyle(3,0xf9e5a1,.9);g.strokeCircle(pad.x,pad.y,34);}
   this.art('lotus',pad.x,pad.y,69,2).setAlpha(.9);
   this.add.text(pad.x,pad.y-2,pad.buff?'✦':'+',{fontFamily:'sans-serif',fontSize:pad.buff?'24px':'23px',color:pad.buff?'#fff0ae':'#eff3c3',fontStyle:'bold'}).setOrigin(.5).setDepth(3).setAlpha(.85).setName('pad-'+pad.id);
  }
  this.art('entrance',31,PATH[0].y-20,108,205);
  this.art('altar',1075,135,115,135);this.heart=this.art('heart',1075,104,70,220);
  this.add.text(53,254,'怪物入口',{fontSize:'13px',fontFamily:'sans-serif',color:'#6e7346',backgroundColor:'#eff1cf',padding:{x:7,y:4}}).setOrigin(.5).setDepth(230);
  this.add.text(1065,195,'奶蛙之心',{fontSize:'13px',fontFamily:'sans-serif',color:'#6e7346',backgroundColor:'#eff1cf',padding:{x:7,y:4}}).setOrigin(.5).setDepth(230);
  this.marks=this.add.graphics().setDepth(4);this.badges=this.add.graphics().setDepth(1900);this.effects=this.add.graphics().setDepth(2000);
  this.input.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{const pad=PADS.find(p=>Math.hypot(p.x-pointer.x,p.y-pointer.y)<39);if(pad)this.bridge.onPad(pad.id);});
  this.input.on('pointermove',(pointer:Phaser.Input.Pointer)=>{this.input.setDefaultCursor(PADS.some(p=>Math.hypot(p.x-pointer.x,p.y-pointer.y)<39)?'pointer':'default');});
  this.bridge.onTick();
 }
 road(g:Phaser.GameObjects.Graphics,width:number,color:number,alpha:number){g.lineStyle(width,color,alpha);g.beginPath();g.moveTo(-15,PATH[0].y);for(const p of PATH)g.lineTo(p.x,p.y);g.lineTo(WIDTH+15,PATH.at(-1)!.y);g.strokePath();g.fillStyle(color,alpha);for(const p of PATH)g.fillCircle(p.x,p.y,width/2);}
 update(_time:number,delta:number){
  const w=this.bridge.world;w.update(Math.min(delta/1000,.05));for(const event of w.drain()){this.fx.push({...event,born:w.time,life:event.type==='skill'?1.3:event.type==='kill'?.55:.5});this.bridge.onEvent(event);}
  const present=new Set<string>();this.marks.clear();this.badges.clear();
  if(this.bridge.selectedPad!==null){const p=PADS[this.bridge.selectedPad];const tower=w.towers.find(t=>t.pad===p.id);const kind=tower?.kind??this.bridge.selectedKind as keyof typeof TOWERS;const radius=TOWERS[kind].range[(tower?.level??1)-1];
   this.marks.fillStyle(TOWERS[kind].color,.12);this.marks.fillCircle(p.x,p.y,radius);this.marks.lineStyle(2,0xffffff,.75);this.marks.strokeCircle(p.x,p.y,radius);this.marks.lineStyle(3,0xfff1b3,1);this.marks.strokeCircle(p.x,p.y,37);
  }
  for(const p of PADS){const label=this.children.getByName('pad-'+p.id) as Phaser.GameObjects.Text | null;if(label)label.setVisible(!w.towers.some(t=>t.pad===p.id));}
  for(const tower of w.towers){const p=PADS[tower.pad],key='tower-'+tower.id,texture=tower.kind+tower.level;present.add(key);let im=this.images.get(key);
   if(!im){im=this.art(texture,p.x,p.y-20,92,p.y+40);this.images.set(key,im);}if(im.texture.key!==texture){im.setTexture(texture);im.setScale(92/im.width);}
   const puff=1+Math.sin(w.time*2+tower.id)*.018;im.setScale(92/im.width*puff);
   this.badges.fillStyle(0x3c674a,.95);this.badges.fillRoundedRect(p.x-19,p.y+27,38,16,8);
   for(let i=0;i<tower.level;i++){this.badges.fillStyle(0xffdf7c);this.badges.fillCircle(p.x+(i-(tower.level-1)/2)*9,p.y+35,2.7);}
  }
  for(const enemy of w.enemies){const key='enemy-'+enemy.id;present.add(key);const pos=pointAt(enemy.progress),cfg=ENEMIES[enemy.kind];let im=this.images.get(key);
   if(!im){im=this.art(enemy.kind,pos.x,pos.y-15,cfg.size,pos.y+20);this.images.set(key,im);}im.setPosition(pos.x,pos.y-16+Math.sin(w.time*9+enemy.id)*3).setDepth(pos.y+20);im.setAlpha(enemy.stunUntil>w.time?.74:1);
   const bar=enemy.kind==='boss'?74:40,y=pos.y-cfg.size*.85;this.badges.fillStyle(0x405b3e,.6);this.badges.fillRoundedRect(pos.x-bar/2,y,bar,5,2);this.badges.fillStyle(enemy.kind==='boss'?0xcc8d9d:0x94bd66);this.badges.fillRoundedRect(pos.x-bar/2,y,bar*Math.max(0,enemy.hp/enemy.maxHp),5,2);
  }
  for(const mouse of w.summons){const key='mouse-'+mouse.id;present.add(key);let im=this.images.get(key);if(!im){im=this.art('littleMouse',mouse.x,mouse.y,35,mouse.y+25);this.images.set(key,im);}im.setPosition(mouse.x,mouse.y-9+Math.sin(w.time*16+mouse.id)*2).setDepth(mouse.y+25).setAlpha(Math.min(1,(mouse.expires-w.time)*2));}
  for(const [key,im] of this.images)if(!present.has(key)){im.destroy();this.images.delete(key);}
  const heartKey=w.status==='lost'?'heartBroken':w.health<12?'heartHurt':'heart';if(this.heart.texture.key!==heartKey){this.heart.setTexture(heartKey);this.heart.setScale(70/this.heart.width);}this.heart.y=104+Math.sin(w.time*2)*3;
  if(w.health<=5&&w.status==='playing')this.heart.setAlpha(.65+Math.sin(w.time*5)*.3);else this.heart.setAlpha(1);
  this.drawEffects();if(_time-this.lastUi>90){this.lastUi=_time;this.bridge.onTick();}
 }
 drawEffects(){const w=this.bridge.world,g=this.effects;g.clear();this.fx=this.fx.filter(e=>w.time>=e.born&&w.time-e.born<e.life);
  for(const e of this.fx){const t=(w.time-e.born)/e.life,a=1-t,x=Number(e.x??0),y=Number(e.y??0),tx=Number(e.tx??x),ty=Number(e.ty??y);
   if(e.type==='attack'){
    const kind=e.kind as keyof typeof TOWERS,color=TOWERS[kind].color;
    if(kind==='laugh'){g.lineStyle(5*a,color,a);g.strokeCircle(tx,ty,20+t*80);g.lineStyle(2*a,0xfff5b7,a);g.strokeCircle(tx,ty,10+t*55);}
    else if(kind==='dog'){const angle=Math.atan2(ty-y,tx-x);g.fillStyle(color,.24*a);g.slice(x,y,25+t*175,angle-.61,angle+.61,false);g.fillPath();g.lineStyle(4,color,a);g.beginPath();g.arc(x,y,25+t*175,angle-.61,angle+.61);g.strokePath();}
    else {g.lineStyle(6,0xffeed0,a);g.lineBetween(x+(tx-x)*t,y+(ty-y)*t,tx,ty);g.fillStyle(color,a);g.fillCircle(tx,ty,12*a);}
   }else if(e.type==='skill'){g.lineStyle(18,0xfff3b4,a*.8);g.strokeCircle(1075,104,t*1400);g.fillStyle(0xfff6c9,a*.13);g.fillRect(0,0,WIDTH,HEIGHT);}
   else if(e.type==='kill'){for(let i=0;i<6;i++){g.fillStyle(i%2?0xfff5d7:0xffffff,a);g.fillCircle(x+Math.cos(i)*t*35,y+Math.sin(i)*t*35,5*a);}}
   else if(['build','upgrade','sell'].includes(e.type)){const p=PADS[Number(e.pad)];g.lineStyle(4,0xfff5ab,a);g.strokeCircle(p.x,p.y,15+t*40);}
   else if(e.type==='summon'){g.lineStyle(3,0xffe19b,a);g.strokeEllipse(x,y,30+t*80,18+t*40);}
   else if(e.type==='combo'||e.type==='mouseHit'){g.lineStyle(e.type==='combo'?5:2,0xfff6b8,a);for(let i=0;i<4;i++){const angle=i*Math.PI/2+.7;g.lineBetween(x+Math.cos(angle)*4,y+Math.sin(angle)*4,x+Math.cos(angle)*(8+t*25),y+Math.sin(angle)*(8+t*25));}}
   else if(e.type==='leak'){g.fillStyle(0xed9a86,a*.2);g.fillRect(0,0,WIDTH,HEIGHT);}
  }
 }
}
