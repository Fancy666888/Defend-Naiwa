import type {GameEvent} from './engine.ts';
import {publicUrl} from './urls.ts';

export const SOUND_NAMES = ['laugh','dog','punch','combo','summon','mouseHit','kill','build','upgrade','sell','leak','wave','clear','skill','win','lose','garden-loop'] as const;
type SoundName = typeof SOUND_NAMES[number];

export function eventSound(event:GameEvent):SoundName|null {
 if(event.type==='attack')return event.kind==='laugh'?'laugh':event.kind==='dog'?'dog':'punch';
 if(event.type==='end')return event.won?'win':'lose';
 return SOUND_NAMES.includes(event.type as SoundName)&&event.type!=='garden-loop'?event.type as SoundName:null;
}

/** Browser audio is unlocked by Start or the sound button, never by a timer. */
export class GardenAudio {
 enabled=true;
 active=false;
 context:AudioContext|null=null;
 master:GainNode|null=null;
 buffers=new Map<SoundName,AudioBuffer>();
 private music:AudioBufferSourceNode|null=null;
 private loading:Promise<void>|null=null;
 private lastPlayed=new Map<SoundName,number>();
 private voices=new Set<AudioBufferSourceNode>();

 async unlock():Promise<boolean>{
  if(!this.enabled)return true;
  try{
   if(!this.context){
    this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=.7;
    const limiter=this.context.createDynamicsCompressor();
    limiter.threshold.value=-12;limiter.knee.value=12;limiter.ratio.value=8;limiter.attack.value=.005;limiter.release.value=.12;
    this.master.connect(limiter);limiter.connect(this.context.destination);
   }
   const ctx=this.context;
   // Invoke resume synchronously in the user's input handler before any fetch.
   const resumed=ctx.resume();
   this.loading??=Promise.all(SOUND_NAMES.map(async name=>{
    const response=await fetch(publicUrl(`audio/${name}.wav`));
    if(!response.ok)throw new Error(`Audio unavailable: ${name}`);
    this.buffers.set(name,await ctx.decodeAudioData(await response.arrayBuffer()));
   })).then(()=>{}).catch(error=>{this.loading=null;throw error;});
   await Promise.all([resumed,this.loading]);
   if(ctx.state!=='running')return false;
   this.syncMusic();return true;
  }catch(error){console.warn('Could not start game audio',error);return false;}
 }
 setEnabled(enabled:boolean){
  this.enabled=enabled;
  if(this.context&&this.master)this.master.gain.setTargetAtTime(enabled?.7:0,this.context.currentTime,.02);
  if(!enabled){this.stopMusic();this.stopEffects();}else this.syncMusic();
 }
 setActive(active:boolean){
  if(this.active===active)return;
  this.active=active;
  if(!active){this.stopMusic();this.stopEffects();}else this.syncMusic();
 }
 private syncMusic(){
  if(!this.enabled||!this.active||this.music||!this.context||this.context.state!=='running')return;
  const buffer=this.buffers.get('garden-loop');if(!buffer)return;
  const source=this.context.createBufferSource(),gain=this.context.createGain();
  source.buffer=buffer;source.loop=true;gain.gain.value=.65;source.connect(gain);gain.connect(this.master!);
  source.onended=()=>{source.disconnect();gain.disconnect();};source.start();this.music=source;
 }
 private stopMusic(){if(this.music){this.music.stop();this.music=null;}}
 private stopEffects(){for(const voice of this.voices)voice.stop();this.voices.clear();this.lastPlayed.clear();}
 reset(){this.stopMusic();this.stopEffects();this.syncMusic();}
 playEvent(event:GameEvent){if(!this.active&&event.type!=='end')return;const name=eventSound(event);if(name)this.play(name);}
 play(name:SoundName){
  const ctx=this.context,buffer=this.buffers.get(name);
  if(!this.enabled||!ctx||ctx.state!=='running'||!buffer)return;
  const now=ctx.currentTime,limit=name==='mouseHit'?.11:name==='kill'?.07:['laugh','dog','punch'].includes(name)?.12:0;
  if(now-(this.lastPlayed.get(name)??-100)<limit)return;
  if(this.voices.size>=20&&!['win','lose','skill','leak'].includes(name))return;
  this.lastPlayed.set(name,now);
  const source=ctx.createBufferSource(),gain=ctx.createGain();
  source.buffer=buffer;gain.gain.value=['mouseHit','kill'].includes(name)?.4:.8;
  source.connect(gain);gain.connect(this.master!);this.voices.add(source);
  source.onended=()=>{this.voices.delete(source);source.disconnect();gain.disconnect();};source.start();
 }
}
