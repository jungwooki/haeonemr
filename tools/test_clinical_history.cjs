const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/scripts/clinical-history.js'),'utf8');
const context={Intl,Date,Map,Number};vm.createContext(context);vm.runInContext(source,context);
const records=[
 {ts:'2026-10-03T10:00:00+09:00',category:'통증'},
 {ts:'2026-10-03T01:00:00Z',category:'MPS 멘탈'},
 {ts:'2026-10-03T10:00:01+09:00',category:'통증'},
 {ts:'2026-10-03T10:00:01.001+09:00',category:'통증'},
 {ts:'2026-09-30T10:00:00+09:00',category:'통증'},
 {ts:'2026-10-03T10:00:00+09:00',category:'통증'},
 {ts:'invalid',category:'통증'}, {ts:null,category:'통증'}
];
const before=JSON.stringify(records),groups=context.groupClinicalRecords(records);
assert.equal(groups.length,6);assert.equal(groups[0].number,4);assert.equal(groups[3].number,1);
assert.equal(groups[2].categories.size,2);assert.equal(groups[2].categories.get('통증').length,2);
assert.equal(groups[2].categories.get('통증')[1].index,5);assert.equal(groups[2].categories.get('MPS 멘탈')[0].index,1);
assert.equal(groups[4].number,undefined);assert.equal(groups[5].number,undefined);
assert.equal(JSON.stringify(records),before);assert.equal(context.groupClinicalRecords([]).length,0);
assert(context.clinicalRecordTime(new Date('2026-10-02T16:00:00Z').getTime()).includes('03'));
console.log('PASS: exact timestamps, timezone equivalents, seconds/milliseconds, categories, duplicates, original indexes, invalid dates and immutability');
