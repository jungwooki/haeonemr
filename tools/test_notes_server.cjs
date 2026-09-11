const assert=require('node:assert/strict');
const {fixture}=require('./mental_server_fixture.cjs');
const f=fixture();
f.post({name:'메모테스트',category:'소아',birthDate:'2010-01-01',formData:{}});
const ts=f.get({q:'메모테스트'}).patients[0].records[0].ts;
f.sheets.records.rows.push([new Date(ts),'MPS 멘탈','메모테스트','','남','2010-01-01','{}','{}','타기록 안내','타기록 비공개']);
assert.equal(f.get({type:'noteCapabilities'}).protocol,'haeon-notes-v2');
for(const [field,value] of Object.entries({doctorNote:'환자 안내\n둘째 줄',privateNote:'비공개 메모',interpretationNote:'판독 메모'})){
  assert.equal(f.post({type:'updateNote',ts,name:'메모테스트',category:'소아',field,value}).ok,true);
}
const records=f.get({q:'메모테스트'}).patients[0].records;
const target=records.find(r=>r.category==='소아');
assert.equal(target.doctorNote,'환자 안내\n둘째 줄');assert.equal(target.privateNote,'비공개 메모');assert.equal(target.interpretationNote,'판독 메모');
assert.equal(records.find(r=>r.category==='MPS 멘탈').doctorNote,'타기록 안내');
assert.equal(f.post({type:'updateNote',ts,name:'메모테스트',field:'unknown',value:'wrong'}).ok,false);
assert.equal(f.sheets.records.rows[0][8],'환자 안내\n둘째 줄');
console.log('PASS: three note fields persist separately; same-time categories isolated; unknown fields rejected');
const small=f.get({type:'noteRead',q:'메모테스트',ts,category:'소아',field:'doctorNote'});
assert.equal(small.patients[0].records.length,1);
assert.deepEqual(Object.keys(small.patients[0].records[0]).sort(),['category','doctorNote','ts']);
assert.equal(small.patients[0].records[0].doctorNote,target.doctorNote);
assert.equal(f.get({type:'noteRead',q:'메모테스트',ts,category:'없는종류',field:'doctorNote'}).patients.length,0);
assert.equal(f.get({type:'noteRead',q:'메모테스트',ts,category:'소아',field:'unknown'}).ok,false);
console.log('PASS: lightweight note confirmation returns only the exact record and requested field');
