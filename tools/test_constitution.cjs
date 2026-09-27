const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..');
const context={window:{}};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'src/scripts/constitution-data.js'),'utf8'),context);
context.GrowthConstitutionData=context.window.GrowthConstitutionData;
vm.runInContext(fs.readFileSync(path.join(root,'src/scripts/constitution.js'),'utf8'),context);
const {QUESTIONS,ACTIVITY_QUESTIONS,CATEGORY_INFO}=context.GrowthConstitutionData;
assert.equal(QUESTIONS.length,30);assert.equal(ACTIVITY_QUESTIONS.length,8);assert.equal(Object.keys(CATEGORY_INFO).length,6);
for(const [answer,expected] of [[1,20],[3,60],[5,100]]){
 const results=context.window.GrowthConstitution.scores(Object.fromEntries(QUESTIONS.map(q=>[q.id,answer])));
 assert(results.every(r=>r.value===expected));
}
const answers=Object.fromEntries(QUESTIONS.map(q=>[q.id,1]));answers[1]=5;
assert.equal(context.window.GrowthConstitution.scores(answers)[0].value,41);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(html.indexOf('onclick="enterChildSurvey()"')<html.indexOf('onclick="enterSportsSurvey()"'));
assert(html.indexOf('onclick="enterSportsSurvey()"')<html.indexOf('onclick="GrowthConstitution.enter()"'));
assert(html.includes("cat === '유소년스포츠' || cat === '유소년선수(일반)'"));
console.log('Growth constitution: 38 questions, weighted scores, menu order and legacy route passed');
