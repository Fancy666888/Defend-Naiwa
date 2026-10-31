import fs from 'node:fs';
import assert from 'node:assert/strict';
const mapping=JSON.parse(fs.readFileSync(new URL('../src/assets.json',import.meta.url),'utf8'));
for(const [key,entry] of Object.entries(mapping)){
 for(const folder of ['public','dist']){
  const path=new URL(`../${folder}${entry.url}`,import.meta.url);
  const bytes=fs.readFileSync(path);
  assert.equal(bytes.subarray(1,4).toString(),'PNG',key);
  assert.equal(bytes.readUInt32BE(16),entry.size[0],`${key} width`);
  assert.equal(bytes.readUInt32BE(20),entry.size[1],`${key} height`);
 }
}
console.log(`Verified ${Object.keys(mapping).length} PNG assets in both public/ and dist/.`);
