/* ===================== 산후 모듈 ===================== */
let postpartumCurrentStep = 1;
let postpartumCameFromSearch = false;
const postpartumTotalSteps = 6;
const postpartumFormData = {
  name:'', birthDate:'', treatmentHistory:'',
  careCenterDuration:'', hospitalDuration:'', helpers:[],
  symptoms:[], recoverySpeed:'', immediateState:'', pregnancyComplications:[],
  deliveryDate:'', deliveryMethod:'', babyWeight:'', weightBefore:'', weightFullTerm:'', weightCurrent:'', child1Age:'', child2Age:'',
  breastfeedingPlan:'', breastMilkAmount:'', sweatChange:'', edemaState:'', stoolState:'', urineState:'', digestionState:'', appetiteState:'', thirstState:'',
  miscarriageCount:'', uterineDisease:'', periodCycleDays:'', periodDuration:'', periodFlowDay:'', periodPain:'', pms:[], discharge:'',
  medicalHistory:[], surgeryHistory:'', eatingHabits:[], sleepTime:'', wakeTime:'', sleepWakeCount:'', exercise:'',
  additionalInfo:''
};
window.updatePostpartumData = function(key,val){ postpartumFormData[key]=val; };
window.updatePostpartumCheck = function(cat,val,checked){
  if(checked){ if(!postpartumFormData[cat].includes(val)) postpartumFormData[cat].push(val); }
  else{ postpartumFormData[cat]=postpartumFormData[cat].filter(i=>i!==val); }
};
window.setPostpartumRadio = function(field,val){ postpartumFormData[field]=val; refreshPostpartumStep(); };

const PostpartumUI = {
  group:(c)=>`<div class="bg-white rounded-[10px] overflow-hidden border border-[#EDEEF1] w-full">${c}</div>`,
  inputRow:(label,field,placeholder,type="text",suffix="")=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white">
      <span class="text-[16px] font-semibold text-black">${label}</span>
      <div class="flex items-center gap-1">
        <input type="${type}" oninput="updatePostpartumData('${field}', this.value)" value="${postpartumFormData[field]}" class="text-right text-[16px] text-[#8E8E93] font-medium outline-none w-32 placeholder:text-gray-300 bg-transparent" placeholder="${placeholder}">
        ${suffix?`<span class="text-[#8E8E93] font-medium text-[15px]">${suffix}</span>`:''}
      </div>
    </div>`,
  dateRow:(label,field)=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white">
      <span class="text-[16px] font-semibold text-black">${label}</span>
      <input type="date" onchange="updatePostpartumData('${field}', this.value)" value="${postpartumFormData[field]}" class="text-right text-[16px] text-[#8E8E93] font-medium outline-none bg-transparent">
    </div>`,
  textarea:(field,placeholder)=>`
    <div class="bg-white rounded-[12px] p-5 shadow-sm border border-[#EDEEF1]">
      <textarea oninput="updatePostpartumData('${field}', this.value)" class="w-full h-24 outline-none resize-none text-[16px] font-medium text-black placeholder:text-gray-300 bg-transparent" placeholder="${placeholder}">${postpartumFormData[field]}</textarea>
    </div>`,
  selectRow:(label,field,options)=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white gap-3">
      <span class="text-[15px] font-semibold text-black shrink-0">${label}</span>
      <select onchange="updatePostpartumData('${field}', this.value)" class="text-right text-[14px] text-[#8E8E93] font-medium outline-none bg-transparent flex-1">
        <option value="">선택</option>
        ${options.map(o=>`<option value="${o}" ${postpartumFormData[field]===o?'selected':''}>${o}</option>`).join('')}
      </select>
    </div>`,
  radioList:(field,options)=>`<div>${options.map(opt=>`
    <label class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white cursor-pointer active:bg-gray-50" onclick="setPostpartumRadio('${field}','${opt.replace(/'/g,"\\'")}')">
      <span class="text-[15px] font-semibold text-black">${opt}</span>
      <div class="w-5 h-5 rounded-full border-2 ${postpartumFormData[field]===opt?'border-[#bca988] bg-[#bca988]':'border-gray-300'} flex items-center justify-center shrink-0">
        ${postpartumFormData[field]===opt?'<div class="w-2 h-2 bg-white rounded-full"></div>':''}
      </div>
    </label>`).join('')}</div>`,
  checkRow:(label,category,value)=>`
    <label class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] bg-white cursor-pointer active:bg-gray-50 transition-colors">
      <span class="text-[15px] font-semibold text-black">${label}</span>
      <div class="relative flex items-center justify-center">
        <input type="checkbox" class="sr-only peer" onchange="updatePostpartumCheck('${category}', '${value}', this.checked)" ${postpartumFormData[category].includes(value)?'checked':''}>
        <i data-lucide="check" class="w-6 h-6 text-[#bca988] opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></i>
      </div>
    </label>`,
  checkGrid:(items,category)=>`<div class="md:grid md:grid-cols-2 md:divide-x md:divide-[#EDEEF1]">${items.map(v=>PostpartumUI.checkRow(v,category,v)).join('')}</div>`,
  header:(t)=>`<h2 class="text-[26px] font-extrabold tracking-tight text-black mb-1.5 mt-5 px-2 first:mt-0">${t}</h2>`,
  subhead:(t)=>`<div class="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1.5 mt-4 px-4">${t}</div>`
};

const postpartumSections = {
  2:{ navTitle:'기본 정보', html:()=>`
    ${PostpartumUI.header('기본 정보')}
    ${PostpartumUI.group(`
      ${PostpartumUI.inputRow('성함','name','이름 입력')}
      ${PostpartumUI.dateRow('생년월일','birthDate')}
      ${PostpartumUI.inputRow('어딘가 불편한 부분','treatmentHistory','예: 손목 시림, 식은땀, 피로감')}
    `)}
    ${PostpartumUI.subhead('조리 환경')}
    ${PostpartumUI.group(`
      ${PostpartumUI.inputRow('조리원 기간','careCenterDuration','0','number','일')}
      ${PostpartumUI.inputRow('병원 입원 기간','hospitalDuration','0','number','일')}
    `)}
    ${PostpartumUI.subhead('주로 도와주시는 분 (다중 선택)')}
    ${PostpartumUI.group(PostpartumUI.checkGrid(['친정어머니','시부모님','남편','산후도우미','기타'],'helpers'))}
  `},
  3:{ navTitle:'정서·출산', html:()=>`
    ${PostpartumUI.header('정서 및 신체 상태')}
    ${PostpartumUI.subhead('현재 상태 체크 (다중 선택)')}
    ${PostpartumUI.group(PostpartumUI.checkGrid(['관절/근육이 차고 시리며 아프다','몸이 안좋고 예민해져 있다','아이 보는 것이 너무 힘들다','가족들이 상황을 이해해주고 잘 돕는다','우울감이 심해 모두가 밉고 짜증난다','실신, 현기증이 심했다'],'symptoms'))}
    ${PostpartumUI.subhead('평소 상처 회복 속도')}
    ${PostpartumUI.group(PostpartumUI.radioList('recoverySpeed',['보통','느리다(멍/붓기)','자주 다치고 만성']))}
    ${PostpartumUI.subhead('출산 직후 상태')}
    ${PostpartumUI.group(PostpartumUI.radioList('immediateState',['잘 회복됨','임신 후유증 심함']))}
    ${PostpartumUI.subhead('임신 중 합병증')}
    ${PostpartumUI.group(PostpartumUI.checkGrid(['정상','임신 중 고혈압','임신 중 당뇨'],'pregnancyComplications'))}

    ${PostpartumUI.header('출산 및 체중')}
    ${PostpartumUI.group(`
      ${PostpartumUI.dateRow('출산일','deliveryDate')}
    `)}
    ${PostpartumUI.subhead('분만 형태')}
    ${PostpartumUI.group(PostpartumUI.radioList('deliveryMethod',['자연분만','제왕절개']))}
    ${PostpartumUI.subhead('체중 변화 (kg)')}
    ${PostpartumUI.group(`
      ${PostpartumUI.inputRow('임신 전','weightBefore','0','number','kg')}
      ${PostpartumUI.inputRow('만삭 시','weightFullTerm','0','number','kg')}
      ${PostpartumUI.inputRow('현재','weightCurrent','0','number','kg')}
      ${PostpartumUI.inputRow('아기 체중','babyWeight','0','number','kg')}
    `)}
    ${PostpartumUI.subhead('자녀 현황 (개월 수)')}
    ${PostpartumUI.group(`
      ${PostpartumUI.inputRow('첫째','child1Age','예: 24개월')}
      ${PostpartumUI.inputRow('둘째','child2Age','해당 시 입력')}
    `)}
  `},
  4:{ navTitle:'수유·대사', html:()=>`
    ${PostpartumUI.header('수유 및 대사 상태')}
    ${PostpartumUI.subhead('모유 수유 계획')}
    ${PostpartumUI.group(PostpartumUI.radioList('breastfeedingPlan',['3개월 이내','6개월 정도','1년 이상']))}
    ${PostpartumUI.subhead('모유량')}
    ${PostpartumUI.group(PostpartumUI.radioList('breastMilkAmount',['충분','부족','혼합수유','유축기사용']))}
    ${PostpartumUI.subhead('출산 후 땀 / 붓기')}
    ${PostpartumUI.group(`
      ${PostpartumUI.selectRow('땀','sweatChange',['보통','많이 줄었다','많이 늘었다'])}
      ${PostpartumUI.selectRow('붓기','edemaState',['보통','전신 부종','부분 부종'])}
    `)}
    ${PostpartumUI.subhead('대변 / 소변')}
    ${PostpartumUI.group(`
      ${PostpartumUI.selectRow('대변','stoolState',['보통','변비','시원찮음','설사'])}
      ${PostpartumUI.selectRow('소변','urineState',['보통','자주봄','시원찮음','적게봄'])}
    `)}
    ${PostpartumUI.subhead('소화 / 입맛 / 갈증')}
    ${PostpartumUI.group(`
      ${PostpartumUI.selectRow('소화','digestionState',['보통','임신전보다 안됨','원래 안됨','체함'])}
      ${PostpartumUI.selectRow('입맛','appetiteState',['보통','좋음(증가)','없음'])}
      ${PostpartumUI.selectRow('갈증','thirstState',['보통','갈증 있음','아주 심함'])}
    `)}
  `},
  5:{ navTitle:'부인과 과거력', html:()=>`
    ${PostpartumUI.header('과거력 (임신 전 상태)')}
    ${PostpartumUI.group(`
      ${PostpartumUI.inputRow('유산 횟수','miscarriageCount','0','number','회')}
      ${PostpartumUI.inputRow('자궁 질환','uterineDisease','예: 근종, 내막증 (없으면 공란)')}
    `)}
    ${PostpartumUI.subhead('월경 양상 (임신 전 기준)')}
    ${PostpartumUI.group(`
      ${PostpartumUI.inputRow('주기','periodCycleDays','약 28일')}
      ${PostpartumUI.inputRow('기간','periodDuration','약 5일')}
      ${PostpartumUI.inputRow('양 많은 날','periodFlowDay','예: 2~3일째')}
    `)}
    ${PostpartumUI.subhead('생리통')}
    ${PostpartumUI.group(PostpartumUI.radioList('periodPain',['약간/없음','심한편','일상불가']))}
    ${PostpartumUI.subhead('PMS (다중 선택)')}
    ${PostpartumUI.group(PostpartumUI.checkGrid(['소화불량/변비','예민/가슴통증','없음'],'pms'))}
    ${PostpartumUI.subhead('냉/대하')}
    ${PostpartumUI.group(PostpartumUI.radioList('discharge',['없음','간혹 질염','있는 편']))}
  `},
  6:{ navTitle:'병력·생활습관', html:()=>`
    ${PostpartumUI.header('전신 병력 및 생활습관')}
    ${PostpartumUI.subhead('보유 질환 (다중 선택)')}
    ${PostpartumUI.group(PostpartumUI.checkGrid(['고혈압','심장질환','빈혈','당뇨','간염/간기능','신장질환','알레르기'],'medicalHistory'))}
    ${PostpartumUI.subhead('수술 이력')}
    ${PostpartumUI.group(PostpartumUI.radioList('surgeryHistory',['없음','있음']))}
    ${PostpartumUI.subhead('식사 습관 (다중 선택)')}
    ${PostpartumUI.group(PostpartumUI.checkGrid(['3끼 규칙적','불규칙','아침 거름'],'eatingHabits'))}
    ${PostpartumUI.subhead('운동 습관')}
    ${PostpartumUI.group(PostpartumUI.radioList('exercise',['규칙적','불규칙','안함']))}
    ${PostpartumUI.subhead('수면 패턴')}
    ${PostpartumUI.group(`
      ${PostpartumUI.inputRow('취침 시각','sleepTime','예: 23:00')}
      ${PostpartumUI.inputRow('기상 시각','wakeTime','예: 07:00')}
      ${PostpartumUI.inputRow('도중 깨는 횟수','sleepWakeCount','0','number','회')}
    `)}
    ${PostpartumUI.subhead('추가 문의사항 (진료받고 싶은 부분)')}
    ${PostpartumUI.textarea('additionalInfo','궁금하신 점을 자유롭게 적어주세요.')}
  `}
};

function postpartumRenderProgress(){
  const fill=document.getElementById('postpartum-progress-fill');
  const pct = postpartumCurrentStep<=1 ? 0 : ((postpartumCurrentStep-1)/postpartumTotalSteps)*100;
  fill.style.width=pct+'%';
}
function refreshPostpartumStep(){
  if(postpartumCurrentStep===1) return;
  const container=document.getElementById('postpartum-dynamic-container');
  container.innerHTML = postpartumSections[postpartumCurrentStep].html();
  if(window.lucide) lucide.createIcons();
  postpartumRenderProgress();
}
window.postpartumUpdateUI = function(){
  triggerFadeIn(document.getElementById('postpartum-dynamic-container'));
  document.querySelectorAll('.postpartum-step-content').forEach(s=>s.classList.remove('active'));
  const bottomAction=document.getElementById('postpartum-bottom-action'), nextBtn=document.getElementById('postpartum-next-btn'),
        backLabel=document.getElementById('postpartum-btn-back-label'), navTitle=document.getElementById('postpartum-nav-title'),
        scrollContainer=document.getElementById('postpartum-scroll-container');
  if(postpartumCurrentStep===1){
    document.getElementById('postpartum-step-1').classList.add('active');
    bottomAction.classList.add('hidden'); backLabel.innerText='메인으로'; navTitle.innerText='소개';
  } else {
    const config=postpartumSections[postpartumCurrentStep];
    const container=document.getElementById('postpartum-dynamic-container');
    container.innerHTML=config.html(); container.classList.add('active');
    bottomAction.classList.remove('hidden'); backLabel.innerText='이전'; navTitle.innerText=config.navTitle;
    nextBtn.innerText = (postpartumCurrentStep===postpartumTotalSteps) ? '작성 완료하기' : '다음 단계';
  }
  postpartumRenderProgress(); if(window.lucide) lucide.createIcons();
  if(scrollContainer) scrollContainer.scrollTo(0,0);
};
window.postpartumNextStep = function(){
  if(postpartumCurrentStep<postpartumTotalSteps){ postpartumCurrentStep++; postpartumUpdateUI(); }
  else { savePostpartumRecordToSheet(); document.getElementById('postpartum-app-shell').style.display='none'; showCompletion(); }
};
window.postpartumPrevStep = function(){ if(postpartumCurrentStep>1){ postpartumCurrentStep--; postpartumUpdateUI(); } else { document.getElementById('postpartum-app-shell').style.display='none'; returnToHub(); } };
window.enterPostpartumSurvey = function(){
  document.getElementById('hub-view').style.display='none';
  const shell=document.getElementById('postpartum-app-shell'); shell.style.display='flex'; triggerFadeIn(shell);
  postpartumCurrentStep=1; postpartumUpdateUI();
};
window.postpartumBackToForm = function(){
  document.getElementById('postpartum-report-view').classList.remove('active');
  if(postpartumCameFromSearch){
    postpartumCameFromSearch=false;
    document.getElementById('search-view').style.display='flex';
  } else {
    document.getElementById('postpartum-app-shell').style.display='flex';
    postpartumCurrentStep=postpartumTotalSteps; postpartumUpdateUI();
  }
};

/* ----- 기혈수 7변증 스코어링 (증상강도 계산 후, 건강도=100-강도 로 환산) ----- */
function calcPostpartumQiBloodWater(){
  const f=postpartumFormData;
  let s={qiDef:30,qiStag:20,qiCounter:20,bloodDef:30,bloodStasis:20,waterRet:20,yinDef:20};
  if(f.symptoms.includes('몸이 안좋고 예민해져 있다')) s.qiDef+=20;
  if(f.recoverySpeed==='느리다(멍/붓기)') s.qiDef+=15;
  if(f.sweatChange==='많이 늘었다') s.qiDef+=15;
  if(f.eatingHabits.includes('아침 거름')) s.qiDef+=10;
  if(f.digestionState==='원래 안됨'||f.digestionState==='임신전보다 안됨') s.qiDef+=10;

  if(f.symptoms.includes('우울감이 심해 모두가 밉고 짜증난다')) s.qiStag+=30;
  if(f.symptoms.includes('아이 보는 것이 너무 힘들다')) s.qiStag+=15;
  if(f.pms.includes('예민/가슴통증')) s.qiStag+=20;
  if(f.sleepWakeCount && parseInt(f.sleepWakeCount)>=3) s.qiStag+=15;

  if(f.digestionState==='체함') s.qiCounter+=30;
  if(f.symptoms.includes('실신, 현기증이 심했다')) s.qiCounter+=15;
  if(f.treatmentHistory && (f.treatmentHistory.indexOf('위')!==-1 || f.treatmentHistory.indexOf('역류')!==-1)) s.qiCounter+=25;

  if(f.symptoms.includes('실신, 현기증이 심했다')) s.bloodDef+=20;
  if(f.medicalHistory.includes('빈혈')) s.bloodDef+=25;
  if(f.breastMilkAmount==='부족') s.bloodDef+=15;
  if(f.immediateState==='임신 후유증 심함') s.bloodDef+=10;

  if(f.symptoms.includes('관절/근육이 차고 시리며 아프다')) s.bloodStasis+=25;
  if(f.periodPain==='심한편'||f.periodPain==='일상불가') s.bloodStasis+=20;
  if(f.surgeryHistory==='있음') s.bloodStasis+=15;
  if(f.uterineDisease) s.bloodStasis+=10;

  if(f.edemaState==='전신 부종') s.waterRet+=35;
  else if(f.edemaState==='부분 부종') s.waterRet+=20;
  if(f.urineState==='시원찮음'||f.urineState==='적게봄') s.waterRet+=20;
  if(f.medicalHistory.includes('신장질환')) s.waterRet+=15;

  if(f.thirstState==='아주 심함') s.yinDef+=30;
  else if(f.thirstState==='갈증 있음') s.yinDef+=15;
  if(f.stoolState==='변비') s.yinDef+=20;
  if(f.sweatChange==='많이 늘었다') s.yinDef+=10;

  Object.keys(s).forEach(k=>{ if(s[k]>100) s[k]=100; if(s[k]<30) s[k]=30; });
  return {
    '기허':Math.max(8,120-s.qiDef), '기울':Math.max(8,120-s.qiStag), '기역':Math.max(8,120-s.qiCounter),
    '혈허':Math.max(8,120-s.bloodDef), '어혈':Math.max(8,120-s.bloodStasis), '수체':Math.max(8,120-s.waterRet), '음허':Math.max(8,120-s.yinDef)
  };
}

function generatePostpartumReportAndShow(skipSave){
  const f=postpartumFormData, todayStr=new Date().toLocaleDateString('ko-KR');
  document.title = `${(f.name||'이름미상').replace(/\s+/g,'')}_산후_${new Date().toISOString().slice(0,10).replace(/-/g,'')}`;

  document.getElementById('postpartum-rp-name').innerText=f.name||'미입력';
  document.getElementById('postpartum-rp-delivery').innerText=`${f.deliveryDate||'-'} (${f.deliveryMethod||'-'})`;
  document.getElementById('postpartum-rp-weight').innerText=`${f.weightBefore||'-'}→${f.weightFullTerm||'-'}→${f.weightCurrent||'-'}kg`;
  document.getElementById('postpartum-rp-feeding').innerText=`${f.breastfeedingPlan||'-'} · ${f.breastMilkAmount||'-'}`;
  document.getElementById('postpartum-rp-date').innerText=todayStr;
  document.getElementById('postpartum-rp-complaint').innerText=f.treatmentHistory||'특이사항 없음';
  document.getElementById('postpartum-rp-footer-1').innerText=`측정일: ${todayStr}`;
  document.getElementById('postpartum-rp-footer-2').innerText=`측정일: ${todayStr}`;

  const qhs=calcPostpartumQiBloodWater();
  drawRadar(qhs,'postpartum-rp-radar');
  const qhsModern={'기허':'기운부족','기울':'스트레스','기역':'소화·순환','혈허':'혈액부족','어혈':'통증·회복','수체':'부종·독소','음허':'진액부족'};
  renderLegend('postpartum-rp-legend', qhs, qhsModern);

  const qhsAvg = Object.values(qhs).reduce((a,b)=>a+b,0)/Object.values(qhs).length;
  const hscaleScore = Math.round(qhsAvg);
  let grade='관찰필요', color='#dc2626';
  if(hscaleScore>=80){ grade='우수'; color='#16a34a'; }
  else if(hscaleScore>=60){ grade='양호'; color='#65a30d'; }
  else if(hscaleScore>=40){ grade='보통'; color='#d97706'; }
  document.getElementById('postpartum-hscale-score').innerText=hscaleScore;
  document.getElementById('postpartum-hscale-ring').style.background=`conic-gradient(${color} ${hscaleScore}%, #EDEEF1 0)`;
  document.getElementById('postpartum-hscale-grade').innerText=`종합 회복 스코어 ${hscaleScore}점 · ${grade}`;

  document.getElementById('postpartum-rp-care').innerHTML = `
    <div class="mb-1.5">• 조리환경: 조리원 ${f.careCenterDuration||0}일 · 병원 ${f.hospitalDuration||0}일 · 조력자: ${f.helpers.length?f.helpers.join(', '):'-'}</div>
    <div class="mb-1.5">• 현재 상태: ${f.symptoms.length?f.symptoms.join(', '):'해당 없음'}</div>
    <div>• 회복속도: ${f.recoverySpeed||'-'} · 직후상태: ${f.immediateState||'-'} · 임신중 합병증: ${f.pregnancyComplications.length?f.pregnancyComplications.join(', '):'-'}</div>`;

  document.getElementById('postpartum-rp-metabolic').innerHTML = `
    <div class="mb-1.5">• 땀: ${f.sweatChange||'-'} · 붓기: ${f.edemaState||'-'}</div>
    <div class="mb-1.5">• 대변: ${f.stoolState||'-'} · 소변: ${f.urineState||'-'}</div>
    <div>• 소화: ${f.digestionState||'-'} · 입맛: ${f.appetiteState||'-'} · 갈증: ${f.thirstState||'-'}</div>`;

  document.getElementById('postpartum-rp-gyn').innerHTML = `
    <div class="mb-1.5">• 유산: ${f.miscarriageCount||0}회 · 자궁질환: ${f.uterineDisease||'없음'}</div>
    <div class="mb-1.5">• 생리 주기 ${f.periodCycleDays||'-'} · 기간 ${f.periodDuration||'-'} · 생리통: ${f.periodPain||'-'}</div>
    <div>• PMS: ${f.pms.length?f.pms.join(', '):'-'} · 냉/대하: ${f.discharge||'-'}</div>`;

  document.getElementById('postpartum-rp-history').innerHTML = `
    <div class="mb-1.5">• 보유 질환: ${f.medicalHistory.length?f.medicalHistory.join(', '):'해당 없음'} · 수술이력: ${f.surgeryHistory||'없음'}</div>
    <div class="mb-1.5">• 식습관: ${f.eatingHabits.length?f.eatingHabits.join(', '):'-'} · 운동: ${f.exercise||'-'}</div>
    <div>• 수면: ${f.sleepTime||'-'} 취침 ~ ${f.wakeTime||'-'} 기상 (도중 ${f.sleepWakeCount||0}회 깸)</div>`;

  const weakest=Object.entries(qhs).sort((a,b)=>a[1]-b[1])[0];
  document.getElementById('postpartum-rp-overall').innerText =
    `${f.additionalInfo?('추가 문의: "'+f.additionalInfo+'". '):''}문진 응답을 종합하면 ${weakest[0]}(${qhsModern[weakest[0]]}) 경향이 상대적으로 두드러집니다. 진료실에서 산모 체질과 회복 속도에 맞춘 한방 관리 계획을 안내해 드리겠습니다.`;

  document.getElementById('postpartum-app-shell').style.display='none';
  const _rv=document.getElementById('postpartum-report-view'); _rv.classList.add('active'); triggerFadeIn(_rv.querySelector('.report-scroll'));
  if(window.lucide) lucide.createIcons();
  const statusEl=document.getElementById('postpartum-save-status'); if(statusEl) statusEl.innerText='';
    document.getElementById('postpartum-rp-doctor-note-slot').innerHTML = doctorNoteBoxHtml('postpartum-rp');
  document.getElementById('postpartum-rp-private-note-slot').innerHTML = privateNoteBoxHtml('postpartum-rp');
  fillNoteBoxes('postpartum-rp');
  if(window.lucide) lucide.createIcons();
if(!skipSave) savePostpartumRecordToSheet();
}

function savePostpartumRecordToSheet(){
  const statusEl=document.getElementById('postpartum-save-status');
  if(!isSheetConfigured()){ if(statusEl) statusEl.innerText='저장소 미설정'; return; }
  if(statusEl) statusEl.innerText='저장 중...';
  const payload = { category:'산후', name: postpartumFormData.name, birthDate: postpartumFormData.birthDate, gender:'여성', ageGroup:'', formData: postpartumFormData };
  fetch(CONFIG.SHEET_URL, { method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(payload) })
    .then(()=>{ if(statusEl) statusEl.innerText='저장 요청 완료 ✓'; })
    .catch((err)=>{ console.error('저장 실패:',err); if(statusEl) statusEl.innerText='저장 실패 - 설정을 확인해 주세요'; });
}


