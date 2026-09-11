const assert=require('node:assert/strict');
const {fixture}=require('./mental_server_fixture.cjs');
const {randomUUID}=require('node:crypto');
const f=fixture();
for(const input of [undefined,{}, {postData:{}}]){
  assert.equal(JSON.parse(f.ctx.doPost(input).text).ok,false);
}
assert.equal(JSON.parse(f.ctx.doGet().text).ok,false);
assert.equal(f.sheets.records,undefined);

const make=(name='테스트')=>({type:'mpsMental',requestId:randomUUID(),name,gender:'남',birthDate:'2010-01-01',formData:{sport:'soccer',answers:Object.fromEntries(Array.from({length:51},(_,i)=>[i+1,i%6+1]))}});
assert.equal(f.get({type:'mpsMental',op:'probe'}).protocol,'haeon-mental-v1');
const payload=make();assert.equal(f.post(payload).ok,true);assert.equal(f.post(payload).ok,true);
assert.equal(f.sheets.records.rows.length,1);
assert.equal(f.get({type:'mpsMental',op:'status',requestId:payload.requestId}).state,'complete');
// Simulate a failed receipt write after the original record committed.
f.sheets.mental_requests.rows.length=0;assert.equal(f.post(payload).ok,true);assert.equal(f.sheets.records.rows.length,1);
const invalid=make();delete invalid.formData.answers[51];assert.equal(f.post(invalid).ok,false);assert.equal(f.sheets.records.rows.length,1);
const records=f.get({q:'테스트'}).patients[0].records;assert.equal(records[0].category,'MPS 멘탈');assert.equal(JSON.parse(records[0].data).submissionId,payload.requestId);
const key=JSON.stringify(['record','테스트',records[0].ts,'MPS 멘탈']);
const image={type:'haeonImages',password:'1824',key,operation:'upload',requestId:randomUUID(),files:[{name:'test.png',mimeType:'image/png',data:'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg=='}]};
assert.equal(f.post(image).ok,true);assert.equal(f.post(image).ok,true);
const list=f.get({type:'haeonImages',password:'1824',key,op:'list'});assert.equal(list.images.length,1);
assert.equal(f.get({type:'haeonImages',password:'1824',key,op:'read',id:list.images[0].id}).data,image.files[0].data);
assert.equal(f.get({type:'haeonImages',password:'wrong',key,op:'list'}).ok,false);
const other=make('별도테스트');f.post(other);const otherRecord=f.get({q:'별도테스트'}).patients[0].records[0];
const otherKey=JSON.stringify(['record','별도테스트',otherRecord.ts,'MPS 멘탈']);
assert.equal(f.get({type:'haeonImages',password:'1824',key:otherKey,op:'list'}).images.length,0);
assert.equal(f.get({type:'haeonImages',password:'1824',key:otherKey,op:'read',id:list.images[0].id}).ok,false);
console.log('PASS: save, retry deduplication, interrupted receipt recovery, validation, EMR read, image save/read and record isolation');
assert.equal(Object.hasOwn(list.images[0],'ocr'),false);
for(const operation of ['ocr','review']) assert.equal(f.post({...image,operation,requestId:randomUUID(),id:list.images[0].id}).ok,false);
assert.equal(f.post({...image,operation:'delete',requestId:randomUUID(),id:list.images[0].id}).ok,true);
assert.equal(f.get({type:'haeonImages',password:'1824',key,op:'list'}).images.length,0);
console.log('PASS: OCR operations rejected; image deletion retained');
