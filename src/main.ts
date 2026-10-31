import Phaser from 'phaser';
import './style.css';
import {GardenAudio} from './audio.ts';
import {publicUrl} from './urls.ts';
const BASE=publicUrl('');
import {World, type GameEvent} from './engine.ts';
import {PADS,TOWERS,WIDTH,HEIGHT,wavePressure, type TowerKind} from './config.ts';
import {GardenScene, type SceneBridge} from './scene.ts';
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const icon=(name:string)=>({pause:'Ⅱ',play:'▶',sound:'♪',help:'?',restart:'↻'}[name]??name);
let best=0,sound=true;try{best=Math.min(3,Math.max(0,Math.floor(Number(localStorage.getItem('naiwa-best-v2')??0)||0)));sound=localStorage.getItem('naiwa-audio-v2')!=='0';}catch{}
let chosen:TowerKind='laugh',started=false,manualPause=false,helpOpen=false,selectedPad:number|null=null,lastResult='',toastTimer:ReturnType<typeof setTimeout>;
let world=new World();world.paused=true;
const gameAudio=new GardenAudio();gameAudio.setEnabled(sound);
function syncAudio(){gameAudio.setActive(started&&!world.paused&&world.status==='playing'&&!document.hidden);}
function unlockAudio(){void gameAudio.unlock().then(ok=>{if(!ok&&sound)toast('声音未能启动，点击右上「声音」重试');});}
const card=(kind:TowerKind,index:number)=>`<button class="tower-card ${index===0?'chosen':''}" data-kind="${kind}" aria-pressed="${index===0}"><span class="card-number">0${index+1}</span><img src="${BASE}assets/${kind}1.png" alt="${TOWERS[kind].name}"/><span class="card-copy"><strong>${TOWERS[kind].name}</strong><small>${TOWERS[kind].tag}</small></span><span class="price"><img src="${BASE}assets/milk.png" alt=""/>${TOWERS[kind].cost[0]}</span></button>`;
$('app').innerHTML=`
<div class="app-shell">
 <header class="topbar"><a class="brand" href="./" aria-label="保卫奶蛙首页"><img src="${BASE}assets/logo.png" alt="保卫奶蛙"/><span class="brand-rule"></span><span class="brand-caption">一口奶香，一起守护。<small>A LITTLE GARDEN, A BIG HEART</small></span></a><div class="top-actions"><span class="best">挑战纪录 <b id="best">${best?'★'.repeat(best):'待点亮'}</b></span><button id="sound" class="sound-toggle" aria-label="切换音乐和音效" title="切换音乐和音效"></button><button id="help" class="icon-button" aria-label="玩法说明" title="玩法说明">?</button></div></header>
 <main><div class="level-heading"><div><span class="eyebrow">CHAPTER 01 / THE MILKY GARDEN</span><h1>奶香荷塘 <span>守护第一颗心</span></h1></div><div class="level-badge"><span class="live-dot"></span>进阶挑战 · 十波守护</div></div>
 <section class="game-layout" aria-label="塔防游戏">
 <div class="field-column"><div class="field-hud"><div class="stat"><img src="${BASE}assets/milk.png" alt=""/><div><small>可用奶量</small><strong id="milk">360</strong></div></div><span class="hud-divider"></span><div class="stat heart-stat"><img src="${BASE}assets/heart.png" alt=""/><div><small>奶蛙之心</small><strong><span id="health">12</span><em> / 12</em></strong></div></div><div class="wave-stat"><small id="phase">准备时间</small><strong><span id="wave">01</span><em> / 10 波</em></strong></div><button id="speed" class="pill-button" aria-label="切换游戏速度">1×</button><button id="pause" class="icon-button small" aria-label="暂停游戏">Ⅱ</button></div>
 <div class="field-frame"><div id="game" role="application" aria-label="奶香荷塘地图，选择右侧伙伴后点击荷叶建造。也可用下方荷叶选择器操作。"></div><div class="map-caption"><span>✿</span> 奶香荷塘 <b>01</b></div><div id="toast" class="toast" role="status" aria-live="polite"></div><div id="pause-shade" class="pause-shade" hidden><span>Ⅱ</span><h2>荷塘小憩</h2><p>伙伴们正在等你回来</p><button id="resume" class="primary-button">继续守护</button></div><div id="intro" class="intro-overlay"><div class="intro-card"><span class="intro-kicker">欢迎来到奶香荷塘</span><img class="intro-heart" src="${BASE}assets/heart.png" alt="奶蛙之心"/><h2>小小伙伴，<br/>守护大大的心。</h2><p>用奶量召集伙伴，在荷叶上建造炮塔。<br/>挡住十波捣蛋鬼，让奶蛙之心闪闪发光。</p><button id="start" class="primary-button">开始守护 <span>↗</span></button><small>先选伙伴，再点荷叶 · 开始后播放音乐</small></div></div><div id="result" class="result-overlay" hidden><div class="result-card"><span id="result-kicker" class="eyebrow"></span><div id="result-stars" class="result-stars"></div><img id="result-image" src="${BASE}assets/heart.png" alt=""/><h2 id="result-title"></h2><p id="result-copy"></p><button id="again" class="primary-button">再守护一次 ↻</button></div></div></div>
 <div class="field-footer"><span><i class="legend-leaf"></i>点击荷叶建造 <i class="legend-buff"></i>金边荷叶冷却缩短15%</span><button id="restart" class="text-button">↻ 重新开始</button></div>
 <div class="wave-strip"><div class="wave-label"><span class="eyebrow">THE NEXT LITTLE CHALLENGE</span><strong id="wave-message">先安排好你的小伙伴</strong></div><div id="wave-dots" class="wave-dots">${Array.from({length:10},(_,i)=>`<span data-wave="${i+1}">${i+1}</span>`).join('')}</div><button id="next-wave" class="secondary-button" disabled>提前开始 <span>→</span></button></div>
 </div>
 <aside class="sidebar"><div class="sidebar-heading"><div><span class="eyebrow">YOUR LITTLE GUARDIANS</span><h2>召集小伙伴</h2></div><span>4 位伙伴</span></div><div class="tower-list">${(Object.keys(TOWERS) as TowerKind[]).map(card).join('')}</div>
 <div class="detail-panel"><div class="detail-heading"><strong id="detail-name">大笑奶蛙</strong><span id="detail-level">Lv.1</span></div><p id="detail-copy">${TOWERS.laugh.description}</p><div class="detail-stats"><span>伤害 <b id="damage">27</b></span><span>射程 <b id="range">170</b></span><span>间隔 <b id="cooldown">1.45s</b></span></div><div id="build-hint" class="build-hint">选择地图上的空荷叶，即可建造</div><div id="tower-actions" class="tower-actions" hidden><button id="upgrade" class="primary-button"></button><button id="sell" class="text-button"></button></div></div>
 <button id="skill" class="skill-button" disabled><img src="${BASE}assets/energy.png" alt=""/><span><strong>奶潮守护 <small>SPACE</small></strong><em id="energy-copy">击败敌人，积攒守护能量</em><span class="energy-track"><span id="energy-fill"></span></span></span><b id="energy-number">0%</b></button>
 <div class="garden-note"><span>✦</span><p>每一种伙伴都有自己的拿手好戏，<br/>搭配建造，守护会更轻松。</p></div>
 </aside></section>
 <details class="accessible-controls"><summary>键盘 / 触控建造辅助</summary><p>先选伙伴，再选择荷叶。已有炮塔可升级或出售。</p><div class="pad-controls">${PADS.map(p=>`<button class="pad-button" data-pad="${p.id}">荷叶${p.id+1}${p.buff?' ✦':''}</button>`).join('')}</div></details>
 <footer class="page-footer"><span>保卫奶蛙 <i>·</i> 每一滴奶量，都有守护的力量。</span><span>本地试玩版 <i>✦</i> 01</span></footer></main>
</div>
<dialog id="help-dialog"><button id="close-help" class="dialog-close" aria-label="关闭说明">×</button><span class="eyebrow">A SMALL GUIDE</span><h2>一起守护奶蛙之心</h2><ol><li><b>召集伙伴：</b>右侧选择伙伴，再点击空荷叶，用奶量建造。</li><li><b>升级阵容：</b>点击已有伙伴，可以升到三级或出售；出售返还累计花费的60%。</li><li><b>善用地形：</b>金边荷叶让攻击与召唤冷却缩短15%。功夫伙伴适合靠近道路。</li><li><b>释放守护：</b>能量满100后点击「奶潮守护」或按空格，全场伤害并减速。</li><li><b>守住十波：</b>奶蛙之心初始12点生命。剩余12 / 6–11 / 1–5点生命分别获得3 / 2 / 1星。</li></ol><p>快捷键：1–4选择伙伴，P暂停，空格释放技能。<br/>点击开始后默认播放荷塘音乐与战斗音效；右上「声音」可静音。<br/>敌人逐波增强并加快出场，后半程请扩建防线，留意重装怪和Boss。</p><button id="got-it" class="primary-button">知道啦，继续守护</button></dialog>
<div class="rotate-hint">↻ <span>横过来，荷塘更宽敞</span><small>也可以继续竖屏浏览</small><button id="dismiss-rotate">继续</button></div>`;
function toast(text:string){$('toast').textContent=text;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2200);}
function syncPause(){world.paused=!started||manualPause||helpOpen;syncAudio();}
function selectKind(kind:TowerKind){chosen=kind;selectedPad=null;bridge.selectedKind=kind;bridge.selectedPad=null;renderUI();}
function onPad(pad:number){if(!started||world.status!=='playing'||world.paused)return;const existing=world.towers.find(t=>t.pad===pad);
 selectedPad=pad;bridge.selectedPad=pad;
 if(existing){chosen=existing.kind;bridge.selectedKind=chosen;}else{
  if(world.build(pad,chosen)){toast(`${TOWERS[chosen].name}加入守护！`);}else toast(`奶量不够，建造需要 ${TOWERS[chosen].cost[0]} 奶量`);
 }renderUI();}
function onEvent(event:GameEvent){if(event.type==='end')gameAudio.setActive(false);gameAudio.playEvent(event);if(event.type==='clear')toast(`第${event.wave}波守住了！奖励 ${40+5*Number(event.wave)} 奶量`);if(event.type==='wave')toast(`第 ${event.wave} 波捣蛋鬼来了！`);if(event.type==='skill')toast('奶潮守护！全场伤害 + 减速');if(event.type==='end')showResult();}
const bridge:SceneBridge={world,selectedPad,selectedKind:chosen,started,onPad,onTick:renderUI,onEvent};
new Phaser.Game({type:Phaser.AUTO,parent:'game',width:WIDTH,height:HEIGHT,backgroundColor:'#b8d583',transparent:false,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},render:{antialias:true,pixelArt:false},scene:[new GardenScene(bridge)],audio:{noAudio:true}});
function renderUI(){
 $('milk').textContent=String(world.milk);$('health').textContent=String(world.health);$('wave').textContent=String(Math.max(1,world.wave)).padStart(2,'0');$('phase').textContent=!started?'准备时间':world.active?'正在守护':`准备 ${Math.ceil(Math.max(0,world.prep))}s`;
 $('speed').textContent=world.speed+'×';$('pause').textContent=manualPause?icon('play'):icon('pause');$('pause').setAttribute('aria-label',manualPause?'继续游戏':'暂停游戏');
 ($('pause') as HTMLButtonElement).disabled=!started||world.status!=='playing';($('speed') as HTMLButtonElement).disabled=!started||world.status!=='playing';
 $('pause-shade').hidden=!manualPause||world.status!=='playing';
 document.querySelectorAll<HTMLButtonElement>('.tower-card').forEach(button=>{const kind=button.dataset.kind as TowerKind;button.classList.toggle('chosen',kind===chosen);button.classList.toggle('unaffordable',world.milk<TOWERS[kind].cost[0]);button.setAttribute('aria-pressed',String(kind===chosen));});
 const tower=world.towers.find(t=>t.pad===selectedPad),kind=tower?.kind??chosen,cfg=TOWERS[kind],level=tower?.level??1;
 $('detail-name').textContent=cfg.name;$('detail-level').textContent='Lv.'+level;$('detail-copy').textContent=cfg.description;$('damage').textContent=String(cfg.damage[level-1]);$('range').textContent=String(cfg.range[level-1]);$('cooldown').textContent=(cfg.cooldown[level-1]*(tower&&PADS[tower.pad].buff?.85:1)).toFixed(2)+'s';
 $('build-hint').hidden=!!tower;$('tower-actions').hidden=!tower;
 if(tower){const up=$<HTMLButtonElement>('upgrade');up.textContent=level===3?'已达最高等级':`升级到 Lv.${level+1} · ${cfg.cost[level]} 奶量`;up.disabled=level===3||world.milk<cfg.cost[level]||world.paused||world.status!=='playing';$('sell').textContent=`出售 · 返还 ${world.refund(tower)} 奶量`;($('sell') as HTMLButtonElement).disabled=world.paused||world.status!=='playing';}
 $('energy-fill').style.width=world.energy+'%';$('energy-number').textContent=world.energy+'%';$('energy-copy').textContent=world.energy>=100?'能量已满，点击释放守护':'击败敌人，积攒守护能量';($('skill') as HTMLButtonElement).disabled=world.energy<100||world.paused||world.status!=='playing';
 $('sound').textContent=sound?'♫ 声音开':'♫ 声音关';$('sound').setAttribute('aria-pressed',String(sound));$('sound').title=sound?'音乐和音效已开启，点击静音':'音乐和音效已关闭，点击开启';
 syncAudio();
 $('wave-message').textContent=!started?'进阶挑战 · 后半程需要扩建防线':world.active?`第 ${world.wave} 波 · 强度 ×${wavePressure(world.wave).hp} · 待来 ${world.queue.length}`:world.status==='won'?'十波全部守住了！':`第 ${Math.min(10,world.wave+1)} 波即将抵达 · ${Math.ceil(Math.max(0,world.prep))}s`;
 const next=$<HTMLButtonElement>('next-wave');next.disabled=!started||world.active||world.paused||world.status!=='playing';next.innerHTML=world.active?'抵挡中…':`提前开始 <span>→</span>`;
 document.querySelectorAll<HTMLElement>('[data-wave]').forEach(el=>{const n=Number(el.dataset.wave);el.classList.toggle('complete',n<world.wave||n===world.wave&&!world.active);el.classList.toggle('current',n===world.wave&&world.active);});
 document.querySelectorAll<HTMLButtonElement>('[data-pad]').forEach(el=>{const pad=Number(el.dataset.pad),t=world.towers.find(t=>t.pad===pad);el.textContent=`荷叶${pad+1}${PADS[pad].buff?' ✦':''}${t?' · '+TOWERS[t.kind].name+' '+t.level+'级':''}`;el.disabled=world.paused||world.status!=='playing';});
}
function showResult(){if(lastResult)return;lastResult=world.status;const won=world.status==='won';$('result').hidden=false;$('result-kicker').textContent=won?'THE GARDEN IS SAFE':'LET’S TRY AGAIN';$('result-stars').textContent=won?'★'.repeat(world.stars)+'☆'.repeat(3-world.stars):'♡';$('result-image').setAttribute('src',`${BASE}assets/${won?'heart':'heartBroken'}.png`);$('result-title').textContent=won?'奶香荷塘，守住啦！':'小小的心，需要你';$('result-copy').textContent=won?`击退 ${world.kills} 只捣蛋鬼，剩余 ${world.health} 点生命。`:`抵达第 ${world.wave} 波，击退 ${world.kills} 只捣蛋鬼。换个阵容再试试吧。`;
 if(world.stars>best){best=world.stars;try{localStorage.setItem('naiwa-best-v2',String(best));}catch{}$('best').textContent='★'.repeat(best);}renderUI();}
function reset(){world=new World();world.paused=false;started=true;manualPause=false;selectedPad=null;chosen='laugh';lastResult='';Object.assign(bridge,{world,started,selectedPad,selectedKind:chosen});$('intro').hidden=true;$('result').hidden=true;$('toast').classList.remove('visible');gameAudio.reset();syncAudio();unlockAudio();toast('进阶挑战：8秒后出发，记得持续扩建与升级');renderUI();}
$('start').onclick=reset;$('again').onclick=reset;
$('restart').onclick=()=>{if(!started||world.status!=='playing'){reset();return;}helpOpen=true;syncPause();const confirmed=window.confirm('重新开始本局？当前阵容与奶量将重置。');helpOpen=false;if(confirmed)reset();else{syncPause();renderUI();}};
$('pause').onclick=()=>{manualPause=!manualPause;syncPause();renderUI();};$('resume').onclick=()=>{manualPause=false;syncPause();renderUI();};
$('speed').onclick=()=>{world.speed=world.speed===1?2:1;renderUI();};$('next-wave').onclick=()=>{world.startWave();renderUI();};$('skill').onclick=()=>{world.skill();renderUI();};
$('upgrade').onclick=()=>{const tower=world.towers.find(t=>t.pad===selectedPad);if(tower&&world.upgrade(tower.id)){toast(`升级成功！${TOWERS[tower.kind].name} Lv.${tower.level}`);renderUI();}};
$('sell').onclick=()=>{const tower=world.towers.find(t=>t.pad===selectedPad);if(tower){world.sell(tower.id);selectedPad=null;bridge.selectedPad=null;toast('伙伴暂时休息，奶量已返还');renderUI();}};
$('sound').onclick=()=>{sound=!sound;gameAudio.setEnabled(sound);try{localStorage.setItem('naiwa-audio-v2',sound?'1':'0');}catch{}if(sound)void gameAudio.unlock().then(ok=>{if(ok)gameAudio.play('build');else toast('声音未能启动，请检查浏览器或系统音量');});renderUI();};
const dialog=$<HTMLDialogElement>('help-dialog');$('help').onclick=()=>{helpOpen=true;syncPause();dialog.showModal();renderUI();};const closeHelp=()=>{dialog.close();};$('close-help').onclick=closeHelp;$('got-it').onclick=closeHelp;dialog.addEventListener('close',()=>{helpOpen=false;syncPause();renderUI();});
$('dismiss-rotate').onclick=()=>document.querySelector('.rotate-hint')?.classList.add('dismissed');
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-kind]'))button.onclick=()=>selectKind(button.dataset.kind as TowerKind);
for(const button of document.querySelectorAll<HTMLButtonElement>('[data-pad]'))button.onclick=()=>onPad(Number(button.dataset.pad));
window.addEventListener('keydown',e=>{if(dialog.open||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;if(e.code==='Space'&&e.target instanceof HTMLButtonElement)return;if(['Space','KeyP','Digit1','Digit2','Digit3','Digit4'].includes(e.code))e.preventDefault();const kinds=Object.keys(TOWERS) as TowerKind[];if(/^Digit[1-4]$/.test(e.code))selectKind(kinds[Number(e.code.at(-1))-1]);if(!started||world.status!=='playing')return;if(e.code==='KeyP')$('pause').click();if(e.code==='Space')$('skill').click();});
renderUI();

document.addEventListener('visibilitychange',syncAudio);
