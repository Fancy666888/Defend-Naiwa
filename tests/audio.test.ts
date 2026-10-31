import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GardenAudio,eventSound,SOUND_NAMES} from '../src/audio.ts';

class Param {value=0;setTargetAtTime(value:number){this.value=value;}}
class Node {gain=new Param();threshold=new Param();knee=new Param();ratio=new Param();attack=new Param();release=new Param();connect(){}disconnect(){}}
class Source extends Node {buffer:unknown;loop=false;onended:(()=>void)|null=null;started=0;stopped=0;start(){this.started++;}stop(){this.stopped++;this.onended?.();}}
class Context {
 state='suspended';currentTime=0;destination={};sources:Source[]=[];
 resume(){this.state='running';return Promise.resolve();}
 createGain(){return new Node();}
 createDynamicsCompressor(){return new Node();}
 createBufferSource(){const s=new Source();this.sources.push(s);return s;}
 decodeAudioData(){return Promise.resolve({duration:.3});}
}

test('every battle event has the expected distinct sound',()=>{
 assert.equal(eventSound({type:'attack',kind:'laugh'}),'laugh');
 assert.equal(eventSound({type:'attack',kind:'dog'}),'dog');
 assert.equal(eventSound({type:'attack',kind:'kungfu'}),'punch');
 assert.equal(eventSound({type:'summon'}),'summon');assert.equal(eventSound({type:'combo'}),'combo');
 assert.equal(eventSound({type:'end',won:true}),'win');assert.equal(eventSound({type:'end',won:false}),'lose');
 assert.equal(eventSound({type:'not-a-sound'}),null);assert.equal(SOUND_NAMES.length,17);
});

test('audio unlocks on input, loops music, pauses, mutes and limits attack polyphony',async()=>{
 const oldContext=globalThis.AudioContext,oldFetch=globalThis.fetch;
 globalThis.AudioContext=Context as unknown as typeof AudioContext;
 globalThis.fetch=async()=>new Response(new Uint8Array([1,2]));
 try{
  const audio=new GardenAudio();assert.equal(audio.enabled,true);assert.equal(audio.context,null);
  audio.setActive(true);assert.equal(await audio.unlock(),true);assert.equal(audio.buffers.size,17);
  const ctx=audio.context as unknown as Context;
  assert.equal(ctx.sources.filter(s=>s.loop&&s.started&&!s.stopped).length,1);
  audio.playEvent({type:'attack',kind:'dog'});const count=ctx.sources.length;
  for(let i=0;i<20;i++)audio.playEvent({type:'attack',kind:'dog'});
  assert.equal(ctx.sources.length,count,'same-frame attacks are rate-limited');
  ctx.currentTime+=.2;audio.playEvent({type:'attack',kind:'dog'});assert.equal(ctx.sources.length,count+1);
  audio.setActive(false);assert.ok(ctx.sources.every(s=>s.stopped===1));
  audio.playEvent({type:'attack',kind:'dog'});assert.equal(ctx.sources.length,count+1);
  audio.playEvent({type:'end',won:true});assert.equal(ctx.sources.at(-1)!.started,1);
  audio.setEnabled(false);assert.ok(ctx.sources.every(s=>s.stopped===1));const muted=ctx.sources.length;
  audio.play('build');assert.equal(ctx.sources.length,muted);
  audio.setEnabled(true);audio.setActive(true);assert.equal(ctx.sources.filter(s=>s.loop&&!s.stopped).length,1);
  audio.reset();assert.equal(ctx.sources.filter(s=>s.loop&&!s.stopped).length,1,'restart replaces the loop without overlap');
  audio.setActive(false);
 }finally{globalThis.AudioContext=oldContext;globalThis.fetch=oldFetch;}
});

test('failed audio downloads surface failure and can be retried',async()=>{
 const oldContext=globalThis.AudioContext,oldFetch=globalThis.fetch,oldWarn=console.warn;
 globalThis.AudioContext=Context as unknown as typeof AudioContext;console.warn=()=>{};
 try{
  const audio=new GardenAudio();globalThis.fetch=async()=>new Response(null,{status:404});assert.equal(await audio.unlock(),false);
  globalThis.fetch=async()=>new Response(new Uint8Array([1,2]));assert.equal(await audio.unlock(),true);
  audio.setEnabled(false);
 }finally{globalThis.AudioContext=oldContext;globalThis.fetch=oldFetch;console.warn=oldWarn;}
});
