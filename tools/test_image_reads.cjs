const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
module.exports=(async()=>{
  let calls=0;
  const ctx=vm.createContext({console,Date,Map,Set,Promise,URLSearchParams,AbortSignal,CONFIG:{SHEET_URL:'https://fixture.invalid'},document:{getElementById:()=>({addEventListener(){}})},fetch:async()=>{calls++;return {json:async()=>({ok:true,protocol:'haeon-images-v2',images:[{id:'fixture-image'}]})};}});
  for(const file of ['request-cache.js','images.js']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/scripts',file),'utf8'),ctx);
  vm.runInContext("emrImagePassword='test-password'",ctx);
  await Promise.all([ctx.readEmrImages('record-a'),ctx.readEmrImages('record-a')]);
  await ctx.readEmrImages('record-a');assert.equal(calls,1);
  await ctx.readEmrImages('record-b');assert.equal(calls,2);
  ctx.invalidateEmrReadCache('images:record-a');await ctx.readEmrImages('record-a');assert.equal(calls,3);
  ctx.clearEmrReadCache();await ctx.readEmrImages('record-a');assert.equal(calls,4);
  console.log('PASS: repeated and concurrent image list reads use one request; records remain isolated; refresh and exit clear cached reads');
})();
