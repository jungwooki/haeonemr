const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx=vm.createContext({console,window:{},document:{getElementById(){}},Intl,Date});
vm.runInContext(fs.readFileSync('mps-emr/src/scripts/pdf-survey-data.js','utf8'),ctx);vm.runInContext(fs.readFileSync('mps-emr/src/scripts/paper-surveys.js','utf8'),ctx);
const specs=vm.runInContext('PaperSurveyData',ctx),forms=vm.runInContext('PaperSurveys',ctx),labels=JSON.parse(fs.readFileSync('mps-emr/src/data/survey-labels.json'));
for(const spec of Object.values(specs)){assert.equal(spec.steps.length,spec.category==='유산후'?8:5);const keys=spec.steps.flatMap(s=>s.fields.map(f=>f.key));assert.equal(keys.length,new Set(keys).size);for(const key of keys)assert(labels[key],key);assert(forms.validate({},spec,0));assert.equal(forms.validate({name:'테스트',birthDate:'2000-01-01',gender:'남'},spec,0),'');assert(forms.validate({name:'테스트',birthDate:'2026-02-31',gender:'남'},spec,0));assert(forms.validate({name:'테스트',birthDate:'2999-01-01',gender:'남'},spec,0));}
assert.equal(specs.traffic.steps[2].fields[0].options.length,8);
assert.equal(specs.cold.steps[1].fields.find(f=>f.key==='coldSymptoms').options.length,11);
const answers={coldSymptoms:['발열'],coldTemperature:'38.2',coldDiagnosisReceived:'아니오',coldDiagnosis:'이전 입력',coldNasalColor:['맑은 색']};const cleaned=forms.clean(answers,specs.cold);assert.equal(cleaned.coldTemperature,'38.2');assert(!('coldDiagnosis' in cleaned));assert(!('coldNasalColor' in cleaned));assert.equal(answers.coldDiagnosis,'이전 입력');
assert(forms.validate({},specs.traffic,4));assert.equal(forms.validate({trafficDisease:['없음'],trafficSignature:'작성자',trafficConfirmed:['위 사실이 틀림없음을 확인합니다.']},specs.traffic,4),'');
assert(forms.validate({trafficDisease:['기타'],trafficSignature:'작성자',trafficConfirmed:['확인']},specs.traffic,4));
console.log('PASS: PDF field catalog, required identity/date/signature, conditional details, optional unanswered values, source immutability');
const mis=specs.miscarriage;assert.equal(mis.steps.length,8);
for(let i=1;i<mis.steps.length;i++)assert.equal(forms.validate({},mis,i),'','Sensitive answers remain optional');
assert.equal(forms.clean({misPastMiscarriageCount:'0'},mis).misPastMiscarriageCount,'0');
const hub=fs.readFileSync('mps-emr/src/views/hub.html','utf8');const names=[...hub.matchAll(/<strong>(.*?)<\/strong>/g)].map(m=>m[1]);assert.deepEqual(names,['통증','교통사고','심층진료','소아청소년','소아감기','유소년선수 일반','유소년선수 성장체질','여성','다이어트','산후','유산후']);
assert(!fs.readFileSync('mps-emr/src/scripts/bootstrap.js','utf8').includes('showSurveyList=prepare')); 
console.log('PASS: miscarriage fields, optional sensitive answers, zero retention and exact six-row menu order');
