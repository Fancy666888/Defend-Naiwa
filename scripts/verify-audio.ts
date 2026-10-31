import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {SOUND_NAMES} from '../src/audio.ts';
for(const name of SOUND_NAMES){
 const source=readFileSync(new URL(`../public/audio/${name}.wav`,import.meta.url));
 const built=readFileSync(new URL(`../dist/audio/${name}.wav`,import.meta.url));
 assert.ok(source.equals(built),`${name}: deployed audio differs`);
 assert.equal(source.toString('ascii',0,4),'RIFF');assert.equal(source.toString('ascii',8,12),'WAVE');
 assert.equal(source.readUInt16LE(20),1);assert.equal(source.readUInt16LE(22),1);
 assert.equal(source.readUInt32LE(24),22050);assert.equal(source.readUInt16LE(34),16);
 let offset=12,data:Buffer|null=null;
 while(offset+8<=source.length){const id=source.toString('ascii',offset,offset+4),length=source.readUInt32LE(offset+4);if(id==='data')data=source.subarray(offset+8,offset+8+length);offset+=8+length+(length%2);}
 assert.ok(data&&data.length>0,name);
 let sum=0,peak=0;
 for(let i=0;i<data!.length;i+=2){const v=data!.readInt16LE(i)/32768;sum+=v*v;peak=Math.max(peak,Math.abs(v));}
 const rms=Math.sqrt(sum/(data!.length/2)),duration=data!.length/2/22050;
 assert.ok(rms>.003,`${name}: silent or too quiet`);assert.ok(peak<.95,`${name}: clipped`);
 if(name==='garden-loop')assert.ok(duration>15&&duration<16);
 console.log(`${name}: ${duration.toFixed(2)}s, RMS ${rms.toFixed(3)}, peak ${peak.toFixed(3)}`);
}
console.log('Verified all 17 non-silent WAV files and identical build copies.');
