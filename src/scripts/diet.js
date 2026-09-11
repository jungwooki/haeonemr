/* ===================== 다이어트 (H-SCORE) 모듈 ===================== */
let dietCurrentStep = 1;
let dietCameFromSearch = false;
const dietFormData = {
  name:'', birthDate:'', gender:'여성', targetWeight:'', maritalStatus:'', dietReason:'',
  obesityTxHistory:'', familyHistory:[],
  caffeineSymptoms:[], stressLevel:'', workStyle:[],
  eatingHabits:[], appetitePattern:[],
  sleepTime:'', wakeTime:'', sleepHabits:[],
  sysLiver:[], sysHeart:[], sysSpleen:[], sysLung:[], sysKidney:[],
  periodCycle:'', periodFlow:'', periodPain:'', periodClots:''
};
window.updateDietData = function(key,val){ dietFormData[key]=val; };
window.updateDietCheck = function(cat,val,checked){
  if(checked){ if(!dietFormData[cat].includes(val)) dietFormData[cat].push(val); }
  else{ dietFormData[cat]=dietFormData[cat].filter(i=>i!==val); }
};
window.setDietSegmented = function(field,val,btnEl){
  dietFormData[field]=val;
  const parent=btnEl.parentElement;
  parent.querySelectorAll('button').forEach(b=>{ b.className="flex-1 py-2 text-[14px] font-medium rounded-[7px] text-[#8E8E93] transition-all duration-200"; });
  btnEl.className="flex-1 py-2 text-[14px] font-bold rounded-[7px] bg-white shadow-[0_3px_8px_rgba(0,0,0,0.12)] text-[#799bf4] transition-all duration-200";
  dietRenderProgress();
};
window.setDietRadio = function(field,val){ dietFormData[field]=val; refreshDietStep(); };

function dietGetTotalSteps(){ return dietFormData.gender==='여성' ? 5 : 4; }

const DietUI = {
  group:(c)=>`<div class="bg-white rounded-[10px] overflow-hidden border border-[#EDEEF1] w-full">${c}</div>`,
  inputRow:(label,field,placeholder,type="text",suffix="")=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white">
      <span class="text-[16px] font-semibold text-black">${label}</span>
      <div class="flex items-center gap-1">
        <input type="${type}" oninput="updateDietData('${field}', this.value)" value="${dietFormData[field]}" class="text-right text-[16px] text-[#8E8E93] font-medium outline-none w-40 placeholder:text-gray-300 bg-transparent" placeholder="${placeholder}">
        ${suffix?`<span class="text-[#8E8E93] font-medium text-[15px]">${suffix}</span>`:''}
      </div>
    </div>`,
  dateRow:(label,field)=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white">
      <span class="text-[16px] font-semibold text-black">${label}</span>
      <input type="date" onchange="updateDietData('${field}', this.value)" value="${dietFormData[field]}" class="text-right text-[16px] text-[#8E8E93] font-medium outline-none bg-transparent">
    </div>`,
  textarea:(field,placeholder)=>`
    <div class="bg-white rounded-[12px] p-5 shadow-sm border border-[#EDEEF1]">
      <textarea oninput="updateDietData('${field}', this.value)" class="w-full h-24 outline-none resize-none text-[16px] font-medium text-black placeholder:text-gray-300 bg-transparent" placeholder="${placeholder}">${dietFormData[field]}</textarea>
    </div>`,
  segmentedControl:(field,options)=>`
    <div class="flex bg-[#F2F2F7] rounded-[9px] p-[3px] w-full">
      ${options.map(opt=>`<button onclick="setDietSegmented('${field}', '${opt}', this)" class="flex-1 py-2 text-[14px] rounded-[7px] transition-all duration-200 ${dietFormData[field]===opt?'font-bold bg-white shadow-[0_3px_8px_rgba(0,0,0,0.12)] text-[#799bf4]':'font-medium text-[#8E8E93]'}">${opt}</button>`).join('')}
    </div>`,
  radioList:(field,options)=>SurveyUX.radioList('diet',field,options,dietFormData[field],'updateDietData'),
  checkRow:(label,category,value)=>`
    <label class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] bg-white cursor-pointer active:bg-gray-50 transition-colors">
      <span class="text-[15px] font-semibold text-black">${label}</span>
      <div class="relative flex items-center justify-center">
        <input type="checkbox" class="sr-only peer" onchange="updateDietCheck('${category}', '${value}', this.checked)" ${dietFormData[category].includes(value)?'checked':''}>
        <i data-lucide="check" class="w-6 h-6 text-[#799bf4] opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></i>
      </div>
    </label>`,
  checkGrid:(items,category)=>`<div class="md:grid md:grid-cols-2 md:divide-x md:divide-[#EDEEF1]">${items.map(v=>DietUI.checkRow(v,category,v)).join('')}</div>`,
  header:(t)=>`<h2 class="text-[26px] font-extrabold tracking-tight text-black mb-1.5 mt-5 px-2 first:mt-0">${t}</h2>`,
  subhead:(t)=>`<div class="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1.5 mt-4 px-4">${t}</div>`
};

const DIET_OPT_LIVER = ['쉽게 피로함','어지럼/두통','짜증/화가 많음','근육통','눈 침침함'];
const DIET_OPT_HEART = ['안색 창백','가슴 두근거림','잘 놀람','자주 깸','손발 냉증'];
const DIET_OPT_SPLEEN = ['입맛 없음','건망증','멀미','복통/설사','잘 체함'];
const DIET_OPT_LUNG = ['잦은 감기','기침/가래','비염/천식','피부 건조'];
const DIET_OPT_KIDNEY = ['부종','다크서클','소변 이상','탈모/모발 약함'];

const dietSections = {
  2:{ navTitle:'다이어트 목표', html:()=>`
    ${DietUI.header('다이어트 목표')}
    ${DietUI.group(`
      ${DietUI.inputRow('성함','name','이름 입력')}
      ${DietUI.dateRow('생년월일','birthDate')}
      <div class="p-3 px-4 border-b border-[#EDEEF1] bg-white">${DietUI.segmentedControl('gender',['여성','남성'])}</div>
      ${DietUI.inputRow('희망 체중','targetWeight','0','number','kg')}
    `)}
    ${DietUI.subhead('결혼 유무')}
    ${DietUI.group(DietUI.radioList('maritalStatus',['미혼','기혼']))}
    ${DietUI.subhead('다이어트를 꼭 해야 하는 이유')}
    ${DietUI.textarea('dietReason','예: 건강 회복, 결혼 준비 등')}
    ${DietUI.subhead('비만 치료 경험')}
    ${DietUI.group(DietUI.radioList('obesityTxHistory',['없음','양약','한약','시술']))}
    ${DietUI.subhead('가족력 / 질환 (다중 선택)')}
    ${DietUI.group(DietUI.checkGrid(['고혈압','당뇨','고지혈증','신장질환','지방간'],'familyHistory'))}
    ${DietUI.subhead('카페인 반응 (커피/녹차, 다중 선택)')}
    ${DietUI.group(DietUI.checkGrid(['어지러움','불면','두통','손떨림','가슴 두근거림'],'caffeineSymptoms'))}
  `},
  3:{ navTitle:'생활 습관', html:()=>`
    ${DietUI.header('생활 및 스트레스')}
    ${DietUI.subhead('스트레스 정도')}
    ${DietUI.group(DietUI.radioList('stressLevel',['낮음','보통','심함','매우 심함']))}
    ${DietUI.subhead('근무/생활 스타일 (다중 선택)')}
    ${DietUI.group(DietUI.checkGrid(['출퇴근 자유','야근 잦음','회식 잦음','활동량 적음'],'workStyle'))}
    ${DietUI.header('식습관 분석')}
    ${DietUI.subhead('식습관 (다중 선택)')}
    ${DietUI.group(DietUI.checkGrid(['식사 즐거움','입이 짧음','편식 심함','과식/폭식','아침 거름','야식 즐김'],'eatingHabits'))}
    ${DietUI.subhead('식욕 패턴 (다중 선택)')}
    ${DietUI.group(DietUI.checkGrid(['배 불러도 먹음','배 고플 때만 먹음','스트레스로 먹음'],'appetitePattern'))}
    ${DietUI.header('수면 상태')}
    ${DietUI.group(`
      ${DietUI.inputRow('취침 시각','sleepTime','예: 23:00')}
      ${DietUI.inputRow('기상 시각','wakeTime','예: 07:00')}
    `)}
    ${DietUI.subhead('수면 습관 (다중 선택)')}
    ${DietUI.group(DietUI.checkGrid(['혼자 잠','함께 잠','코골이','꿈이 많음'],'sleepHabits'))}
  `},
  4:{ navTitle:'장부 체크', html:()=>`
    ${DietUI.header('장부(五臟) 체크')}
    ${DietUI.subhead('간(肝) — 피로')}
    ${DietUI.group(DietUI.checkGrid(DIET_OPT_LIVER,'sysLiver'))}
    ${DietUI.subhead('심(心) — 정신')}
    ${DietUI.group(DietUI.checkGrid(DIET_OPT_HEART,'sysHeart'))}
    ${DietUI.subhead('비(脾) — 소화')}
    ${DietUI.group(DietUI.checkGrid(DIET_OPT_SPLEEN,'sysSpleen'))}
    ${DietUI.subhead('폐(肺) — 호흡')}
    ${DietUI.group(DietUI.checkGrid(DIET_OPT_LUNG,'sysLung'))}
    ${DietUI.subhead('신(腎) — 비뇨')}
    ${DietUI.group(DietUI.checkGrid(DIET_OPT_KIDNEY,'sysKidney'))}
  `},
  5:{ navTitle:'여성 건강', html:()=>`
    ${DietUI.header('여성 건강 (해당자만)')}
    ${DietUI.subhead('월경 주기')}
    ${DietUI.group(DietUI.inputRow('주기','periodCycle','예: 28일'))}
    ${DietUI.subhead('월경량')}
    ${DietUI.group(DietUI.radioList('periodFlow',['적음','보통','많음']))}
    ${DietUI.subhead('월경통')}
    ${DietUI.group(DietUI.radioList('periodPain',['없음','약간','심함']))}
    ${DietUI.subhead('혈괴(덩어리)')}
    ${DietUI.group(DietUI.radioList('periodClots',['없음','약간','많음']))}
  `}
};

function dietRenderProgress(){
  SurveyUX.sync('diet-',dietCurrentStep,dietGetTotalSteps());
}
function refreshDietStep(){
  if(dietCurrentStep===1) return;
  const container=document.getElementById('diet-dynamic-container');
  container.innerHTML = dietSections[dietCurrentStep].html();
  if(window.lucide) lucide.createIcons();
  dietRenderProgress();
}
window.dietUpdateUI = function(){
  triggerFadeIn(document.getElementById('diet-dynamic-container'));
  document.querySelectorAll('.diet-step-content').forEach(s=>s.classList.remove('active'));
  const bottomAction=document.getElementById('diet-bottom-action'), nextBtn=document.getElementById('diet-next-btn'),
        backLabel=document.getElementById('diet-btn-back-label'), navTitle=document.getElementById('diet-nav-title'),
        scrollContainer=document.getElementById('diet-scroll-container');
  if(dietCurrentStep===1){
    document.getElementById('diet-step-1').classList.add('active');
    bottomAction.classList.add('hidden'); backLabel.innerText='메인으로'; navTitle.innerText='소개';
  } else {
    const config=dietSections[dietCurrentStep];
    const container=document.getElementById('diet-dynamic-container');
    container.innerHTML=config.html(); container.classList.add('active');
    bottomAction.classList.remove('hidden'); backLabel.innerText='이전'; navTitle.innerText=config.navTitle;
    nextBtn.innerText = (dietCurrentStep===dietGetTotalSteps()) ? '완료 및 리포트 생성' : '다음 단계';
  }
  dietRenderProgress(); if(window.lucide) lucide.createIcons();
  if(scrollContainer) scrollContainer.scrollTo(0,0);
};
window.dietNextStep = function(){ if(!SurveyUX.canAdvance('diet-',dietCurrentStep)) return; if(dietCurrentStep<dietGetTotalSteps()){ dietCurrentStep++; dietUpdateUI(); } else { saveDietRecordToSheet(); document.getElementById('diet-app-shell').style.display='none'; showCompletion(); } };
window.dietPrevStep = function(){ if(dietCurrentStep>1){ dietCurrentStep--; dietUpdateUI(); } else { document.getElementById('diet-app-shell').style.display='none'; returnToHub(); } };
window.enterDietSurvey = function(){
  document.getElementById('hub-view').style.display='none';
  const shell=document.getElementById('diet-app-shell'); shell.style.display='flex'; triggerFadeIn(shell);
  dietCurrentStep=1; dietUpdateUI();
};
window.dietBackToForm = function(){
  document.getElementById('diet-report-view').classList.remove('active');
  if(dietCameFromSearch){
    dietCameFromSearch=false;
    document.getElementById('search-view').style.display='flex';
  } else {
    document.getElementById('diet-app-shell').style.display='flex';
    dietCurrentStep=dietGetTotalSteps(); dietUpdateUI();
  }
};

/* ----- H-SCORE 스코어링 (증상강도 계산 후, 건강도=100-강도 로 환산) ----- */
function calcDietOrganHealth(){
  const f=dietFormData;
  return {
    '간': healthScore(f.sysLiver, DIET_OPT_LIVER.length),
    '심': healthScore(f.sysHeart, DIET_OPT_HEART.length),
    '비': healthScore(f.sysSpleen, DIET_OPT_SPLEEN.length),
    '폐': healthScore(f.sysLung, DIET_OPT_LUNG.length),
    '신': healthScore(f.sysKidney, DIET_OPT_KIDNEY.length)
  };
}
function calcDietQiBloodWater(){
  const f=dietFormData;
  const norm=(v)=>Math.max(8, 120-Math.min(100,Math.max(20,v)));
  const qiDef = 20 + ((f.sysLiver.includes('쉽게 피로함')?20:0) + (f.sysSpleen.includes('입맛 없음')||f.sysSpleen.includes('잘 체함')?20:0) + (f.sysLung.includes('잦은 감기')?20:0) + (f.sysHeart.includes('안색 창백')?20:0));
  const qiStag = 20 + ((f.stressLevel==='심함'||f.stressLevel==='매우 심함'?30:0) + (f.sysLiver.includes('짜증/화가 많음')?30:0));
  const qiRev = 20 + ((f.sysSpleen.includes('멀미')?30:0) + (f.sysHeart.includes('가슴 두근거림')?20:0) + (f.sysHeart.includes('잘 놀람')?20:0));
  const bloodDef = 20 + ((f.sysLiver.includes('어지럼/두통')?20:0) + (f.sysLiver.includes('눈 침침함')?20:0) + (f.sysHeart.includes('손발 냉증')?20:0) + (f.periodFlow==='적음'?20:0));
  const bloodStasis = 20 + ((f.sysLiver.includes('근육통')?20:0) + (f.sysKidney.includes('다크서클')?20:0) + (f.periodClots==='많음'?30:(f.periodClots==='약간'?10:0)) + (f.periodPain==='심함'?20:0));
  const fluid = 20 + ((f.sysKidney.includes('부종')?30:0) + (f.sysLung.includes('기침/가래')?20:0) + (f.sysSpleen.includes('복통/설사')?20:0));
  const yinDef = 20 + ((f.sysLung.includes('피부 건조')?20:0) + (f.sysKidney.includes('탈모/모발 약함')?20:0) + (f.sysSpleen.includes('건망증')?20:0));
  return { '기허':norm(qiDef), '기울':norm(qiStag), '기역':norm(qiRev), '혈허':norm(bloodDef), '어혈':norm(bloodStasis), '수체':norm(fluid), '음허':norm(yinDef) };
}

function generateDietReportAndShow(skipSave){
  const f=dietFormData, isFemale=f.gender==='여성', todayStr=new Date().toLocaleDateString('ko-KR');
  document.title = `${(f.name||'이름미상').replace(/\s+/g,'')}_다이어트_${new Date().toISOString().slice(0,10).replace(/-/g,'')}`;

  document.getElementById('diet-rp-name').innerText=f.name||'미입력';
  document.getElementById('diet-rp-gender').innerText=f.gender;
  document.getElementById('diet-rp-target').innerText=f.targetWeight?`${f.targetWeight}kg`:'-';
  document.getElementById('diet-rp-reason').innerText=f.dietReason||'-';
  document.getElementById('diet-rp-date').innerText=todayStr;
  document.getElementById('diet-rp-footer-1').innerText=`측정일: ${todayStr}`;
  document.getElementById('diet-rp-footer-2').innerText=`측정일: ${todayStr}`;
  document.getElementById('diet-badge-1').innerText='1 / 2';

  const organ=calcDietOrganHealth(), qhs=calcDietQiBloodWater();
  drawRadar(organ,'diet-rp-radar'); drawRadar(qhs,'diet-rp-qhs-radar');
  const organModern={'간':'피로회복·해독','심':'순환·정신','비':'소화·대사','폐':'호흡·면역','신':'생식·비뇨'};
  const qhsModern={'기허':'기운부족','기울':'스트레스','기역':'기운상충','혈허':'혈액부족','어혈':'혈액순환','수체':'부종·담음','음허':'진액부족'};
  renderLegend('diet-rp-organ-legend', organ, organModern);
  renderLegend('diet-rp-qhs-legend', qhs, qhsModern);

  const organAvg = Object.values(organ).reduce((a,b)=>a+b,0)/Object.values(organ).length;
  const qhsAvg = Object.values(qhs).reduce((a,b)=>a+b,0)/Object.values(qhs).length;
  const hscore = Math.round((organAvg+qhsAvg)/2);
  let grade='관찰필요', color='#dc2626';
  if(hscore>=80){ grade='우수'; color='#16a34a'; }
  else if(hscore>=60){ grade='양호'; color='#65a30d'; }
  else if(hscore>=40){ grade='보통'; color='#d97706'; }
  document.getElementById('diet-hscore-score').innerText=hscore;
  document.getElementById('diet-hscore-ring').style.background=`conic-gradient(${color} ${hscore}%, #EDEEF1 0)`;
  document.getElementById('diet-hscore-grade').innerText=`종합 건강 스코어 ${hscore}점 · ${grade}`;

  const lifestyleLines=[];
  if(f.stressLevel) lifestyleLines.push(`스트레스: ${f.stressLevel}`);
  if(f.eatingHabits.length) lifestyleLines.push(`식습관: ${f.eatingHabits.join(', ')}`);
  if(f.appetitePattern.length) lifestyleLines.push(`식욕 패턴: ${f.appetitePattern.join(', ')}`);
  if(f.sleepTime||f.wakeTime) lifestyleLines.push(`수면: 취침 ${f.sleepTime||'-'} · 기상 ${f.wakeTime||'-'}`);
  if(f.sleepHabits.length) lifestyleLines.push(`수면 습관: ${f.sleepHabits.join(', ')}`);
  if(f.caffeineSymptoms.length) lifestyleLines.push(`카페인 반응: ${f.caffeineSymptoms.join(', ')}`);
  document.getElementById('diet-rp-lifestyle').innerHTML = lifestyleLines.length ? lifestyleLines.map(l=>`<div class="mb-1.5">• ${l}</div>`).join('') : '<div>입력된 생활습관 정보가 없습니다.</div>';

  const womenCard=document.getElementById('diet-rp-women-card');
  if(isFemale && (f.periodCycle||f.periodFlow||f.periodPain||f.periodClots)){
    womenCard.style.display='block';
    document.getElementById('diet-rp-women').innerHTML = `
      <div class="mb-1.5">• 월경 주기: ${f.periodCycle||'-'} · 월경량: ${f.periodFlow||'-'}</div>
      <div>• 월경통: ${f.periodPain||'-'} · 혈괴: ${f.periodClots||'-'}</div>`;
  } else { womenCard.style.display='none'; }

  document.getElementById('diet-rp-history').innerHTML = `
    <div class="mb-1.5">• 비만 치료 경험: ${f.obesityTxHistory||'-'}</div>
    <div>• 가족력: ${f.familyHistory.length?f.familyHistory.join(', '):'해당 없음'}</div>`;

  document.getElementById('diet-rp-tips').innerHTML = [
    '초저칼로리·무리한 절식보다 단백질·채소 중심의 균형 잡힌 식사를 규칙적인 시간에 하는 것이 요요 없이 감량하는 데 도움이 됩니다.',
    '물을 충분히 섭취하고, 카페인·야식 습관을 서서히 줄여나가는 것이 체질 개선에 도움이 됩니다.',
    '유산소 운동과 근력 운동을 함께 병행하면 기초대사량 유지에 유리합니다.',
    '수면이 부족하면 식욕 조절 호르몬 균형이 무너지기 쉬우니, 규칙적인 수면 시간을 지켜주세요.'
  ].map(t=>`<div class="mb-1.5">• ${t}</div>`).join('');

  const weakestOrgan=Object.entries(organ).sort((a,b)=>a[1]-b[1])[0];
  const weakestQhs=Object.entries(qhs).sort((a,b)=>a[1]-b[1])[0];
  document.getElementById('diet-rp-overall').innerText =
    `"${f.dietReason||'다이어트 목표'}"를 위한 문진 응답을 종합하면 오장 중 ${weakestOrgan[0]}(${organModern[weakestOrgan[0]]}) 계통과, 변증상 ${weakestQhs[0]}(${qhsModern[weakestQhs[0]]}) 경향이 상대적으로 두드러집니다. 진료실에서 체질에 맞는 1:1 맞춤 감량 처방을 안내해 드리겠습니다.`;

  document.getElementById('diet-app-shell').style.display='none';
  const _rv=document.getElementById('diet-report-view'); _rv.classList.add('active'); triggerFadeIn(_rv.querySelector('.report-scroll'));
  if(window.lucide) lucide.createIcons();
  const statusEl=document.getElementById('diet-save-status'); if(statusEl) statusEl.innerText='';
    document.getElementById('diet-rp-doctor-note-slot').innerHTML = doctorNoteBoxHtml('diet-rp');
  document.getElementById('diet-rp-private-note-slot').innerHTML = privateNoteBoxHtml('diet-rp');
  fillNoteBoxes('diet-rp');
  if(window.lucide) lucide.createIcons();
if(!skipSave) saveDietRecordToSheet();
}

function saveDietRecordToSheet(){
  const statusEl=document.getElementById('diet-save-status');
  if(!isSheetConfigured()){ if(statusEl) statusEl.innerText='저장소 미설정'; return; }
  if(statusEl) statusEl.innerText='저장 중...';
  const payload = { category:'다이어트', name: dietFormData.name, birthDate: dietFormData.birthDate, gender: dietFormData.gender, ageGroup:'', formData: dietFormData };
  fetch(CONFIG.SHEET_URL, { method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(payload) })
    .then(()=>{ if(statusEl) statusEl.innerText='저장 요청 완료 ✓'; })
    .catch((err)=>{ console.error('저장 실패:',err); if(statusEl) statusEl.innerText='저장 실패 - 설정을 확인해 주세요'; });
}

