const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const code=fs.readFileSync('mps-emr/src/scripts/bootstrap.js','utf8');
async function run(hash,allowed){
 const elements=new Map(['staff-entry-status','entry-title','entry-subtitle','gateway-view'].map(id=>[id,{textContent:'',style:{}}]));let calls=0;
 const ctx={document:{body:{dataset:{}},getElementById:id=>elements.get(id)},EmrFirebase:{requireStaff:async()=>{calls++;if(!allowed)throw Error('로그인이 취소되었습니다.');}},location:{hash,reload(){}},addEventListener(){}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(code,ctx);ctx.onload();await new Promise(r=>setTimeout(r,0));return {ctx,calls,elements};
}
(async()=>{let result=await run('#patient',false);assert.equal(result.calls,0);assert.equal(result.ctx.document.body.dataset.audience,'patient');result=await run('#staff',false);assert.equal(result.calls,1);assert.equal(result.ctx.document.body.dataset.audience,'staff-locked');result=await run('#staff',true);assert.equal(result.ctx.document.body.dataset.audience,'staff');assert.equal(result.elements.get('entry-title').textContent,'MPS EMR');
const notes=fs.readFileSync('mps-emr/src/scripts/notes.js','utf8');assert(notes.includes('간호사 메모'));assert(notes.includes('주치의 치료플랜'));assert(notes.includes("interpretationNote:'interpretation-note'"));assert(notes.includes('EmrNoteAutosave.bind(prefix)'));
console.log('PASS: patient entry without auth, staff entry locked on cancel, staff title and unlock, existing note field identity and autosave preserved');})().catch(e=>{console.error(e);process.exitCode=1;});
