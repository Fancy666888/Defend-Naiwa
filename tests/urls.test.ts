import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicUrl} from '../src/urls.ts';

test('all public resources resolve inside root and project Pages deployments',()=>{
 for(const base of ['/','./','/save-naiwa/']){
  const page=new URL(`https://example.github.io${base==='/save-naiwa/'?base:'/'}`);
  for(const path of ['/assets/laugh1.png','assets/logo.png','/audio/garden-loop.wav']){
   const result=new URL(publicUrl(path,base),page);
   assert.equal(result.pathname,(base==='/save-naiwa/'?base:'/')+path.replace(/^\//,''));
  }
 }
 assert.equal(publicUrl('assets/milk.png','./'),'./assets/milk.png');
});
