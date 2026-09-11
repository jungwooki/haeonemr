/* ===================== 심층진료 (H-SCALE) 모듈 ===================== */
let deepCurrentStep = 1;
let deepCameFromSearch = false;
const deepFormData = {
  name:'', birthDate:'', gender:'여성', height:'', weight:'', chiefComplaint:'', healthSelfAssess:'건강함',
  stressLevel:'', sleepQuality:'', digestion:'', appetite:'', stool:'', urine:'', coldHeat:'',
  liverSymptoms:[], heartSymptoms:[], spleenSymptoms:[], lungSymptoms:[], kidneySymptoms:[],
  history:[], surgery:'없음',
  periodCycle:'', periodPain:'', periodClots:'', pms:[], discharge:''
};
window.updateDeepData = function(key,val){ deepFormData[key]=val; };
window.updateDeepCheck = function(cat,val,checked){
  if(checked){ if(!deepFormData[cat].includes(val)) deepFormData[cat].push(val); }
  else{ deepFormData[cat]=deepFormData[cat].filter(i=>i!==val); }
};
window.setDeepSegmented = function(field,val,btnEl){
  deepFormData[field]=val;
  const parent=btnEl.parentElement;
  parent.querySelectorAll('button').forEach(b=>{ b.className="flex-1 py-2 text-[14px] font-medium rounded-[7px] text-[#8E8E93] transition-all duration-200"; });
  btnEl.className="flex-1 py-2 text-[14px] font-bold rounded-[7px] bg-white shadow-[0_3px_8px_rgba(0,0,0,0.12)] text-[#c94622] transition-all duration-200";
};
window.setDeepRadio = function(field,val){ deepFormData[field]=val; refreshDeepStep(); };

function deepGetTotalSteps(){ return deepFormData.gender==='여성' ? 5 : 4; }

const DeepUI = {
  group:(c)=>`<div class="bg-white rounded-[10px] overflow-hidden border border-[#EDEEF1] w-full">${c}</div>`,
  inputRow:(label,field,placeholder,type="text",suffix="")=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white">
      <span class="text-[16px] font-semibold text-black">${label}</span>
      <div class="flex items-center gap-1">
        <input type="${type}" oninput="updateDeepData('${field}', this.value)" value="${deepFormData[field]}" class="text-right text-[16px] text-[#8E8E93] font-medium outline-none w-40 placeholder:text-gray-300 bg-transparent" placeholder="${placeholder}">
        ${suffix?`<span class="text-[#8E8E93] font-medium text-[15px]">${suffix}</span>`:''}
      </div>
    </div>`,
  dateRow:(label,field)=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white">
      <span class="text-[16px] font-semibold text-black">${label}</span>
      <input type="date" onchange="updateDeepData('${field}', this.value)" value="${deepFormData[field]}" class="text-right text-[16px] text-[#8E8E93] font-medium outline-none bg-transparent">
    </div>`,
  textarea:(field,placeholder)=>`
    <div class="bg-white rounded-[12px] p-5 shadow-sm border border-[#EDEEF1]">
      <textarea oninput="updateDeepData('${field}', this.value)" class="w-full h-24 outline-none resize-none text-[16px] font-medium text-black placeholder:text-gray-300 bg-transparent" placeholder="${placeholder}">${deepFormData[field]}</textarea>
    </div>`,
  segmentedControl:(field,options)=>`
    <div class="flex bg-[#F2F2F7] rounded-[9px] p-[3px] w-full">
      ${options.map(opt=>`<button onclick="setDeepSegmented('${field}', '${opt}', this)" class="flex-1 py-2 text-[14px] rounded-[7px] transition-all duration-200 ${deepFormData[field]===opt?'font-bold bg-white shadow-[0_3px_8px_rgba(0,0,0,0.12)] text-[#c94622]':'font-medium text-[#8E8E93]'}">${opt}</button>`).join('')}
    </div>`,
  radioList:(field,options)=>`<div>${options.map(opt=>`
    <label class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white cursor-pointer active:bg-gray-50" onclick="setDeepRadio('${field}','${opt.replace(/'/g,"\\'")}')">
      <span class="text-[15px] font-semibold text-black">${opt}</span>
      <div class="w-5 h-5 rounded-full border-2 ${deepFormData[field]===opt?'border-[#fc582b] bg-[#fc582b]':'border-gray-300'} flex items-center justify-center shrink-0">
        ${deepFormData[field]===opt?'<div class="w-2 h-2 bg-white rounded-full"></div>':''}
      </div>
    </label>`).join('')}</div>`,
  selectRow:(label,field,options)=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white gap-3">
      <span class="text-[15px] font-semibold text-black shrink-0">${label}</span>
      <select onchange="updateDeepData('${field}', this.value)" class="text-right text-[14px] text-[#8E8E93] font-medium outline-none bg-transparent flex-1">
        <option value="">선택</option>
        ${options.map(o=>`<option value="${o}" ${deepFormData[field]===o?'selected':''}>${o}</option>`).join('')}
      </select>
    </div>`,
  checkRow:(label,category,value)=>`
    <label class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] bg-white cursor-pointer active:bg-gray-50 transition-colors">
      <span class="text-[15px] font-semibold text-black">${label}</span>
      <div class="relative flex items-center justify-center">
        <input type="checkbox" class="sr-only peer" onchange="updateDeepCheck('${category}', '${value}', this.checked)" ${deepFormData[category].includes(value)?'checked':''}>
        <i data-lucide="check" class="w-6 h-6 text-[#fc582b] opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></i>
      </div>
    </label>`,
  checkGrid:(items,category)=>`<div class="md:grid md:grid-cols-2 md:divide-x md:divide-[#EDEEF1]">${items.map(v=>DeepUI.checkRow(v,category,v)).join('')}</div>`,
  header:(t)=>`<h2 class="text-[26px] font-extrabold tracking-tight text-black mb-1.5 mt-5 px-2 first:mt-0">${t}</h2>`,
  subhead:(t)=>`<div class="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1.5 mt-4 px-4">${t}</div>`
};

const DEEP_OPT_LIVER = ['쉽게 피로를 느끼고 잘 지친다','짜증이 많고 화를 자주 낸다','옆구리가 결리거나 아프다','눈이 침침하고 피로하다','근육에 쥐가 잘 난다','어지러움이나 두통이 있다','멍이 잘 든다'];
const DEEP_OPT_HEART = ['가슴이 두근거리고 자주 놀란다','깊은 잠을 못자고 자주 깬다','건망증이 심하다','안색이 창백하다는 말을 듣는다','손발이 차고 저리다','특정 부위로 땀을 자주 흘린다'];
const DEEP_OPT_SPLEEN = ['입맛이 없고 속이 늘 더부룩하다','몸이 무겁고 눕기를 좋아한다','생각이 많고 걱정이 많다','멀미를 하거나 구역감이 있다','배가 자주 아프고 설사/변비가 잦다','입술이나 입안이 자주 헌다'];
const DEEP_OPT_LUNG = ['감기에 자주 걸리고 잘 낫지 않는다','마른 기침, 가래, 콧물이 잦다','온도 변화(추위/더위)에 민감하다','비염, 천식, 아토피 진단을 받은 적 있다','피부가 건조하고 가렵다','목소리에 힘이 없다'];
const DEEP_OPT_KIDNEY = ['눈 주위가 붓거나 다크써클이 생긴다','소변을 자주 보거나 시원하지 않다','허리나 무릎이 자주 아프다','머리카락 숱이 적거나 힘이 없다','방광염, 신장질환을 앓은 적 있다','귀에서 소리가 난다(이명)'];
const DEEP_OPT_HISTORY = ['고혈압','당뇨','고지혈증','지방간','갑상선질환','디스크/관절염'];
const DEEP_OPT_PMS = ['가슴통증/팽만감','아랫배/허리 통증','감정기복/우울','소화불량/변비','두통/어지럼증'];

const deepSections = {
  2:{ navTitle:'기본 정보', html:()=>`
    ${DeepUI.header('기본 정보')}
    ${DeepUI.group(`
      ${DeepUI.inputRow('성함','name','이름 입력')}
      ${DeepUI.dateRow('생년월일','birthDate')}
      <div class="p-3 px-4 border-b border-[#EDEEF1] bg-white">${DeepUI.segmentedControl('gender',['여성','남성'])}</div>
      ${DeepUI.inputRow('키','height','0','number','cm')}
      ${DeepUI.inputRow('체중','weight','0','number','kg')}
    `)}
    ${DeepUI.subhead('현재 건강 상태 자가진단')}
    ${DeepUI.group(DeepUI.radioList('healthSelfAssess',['건강함','보통','허약함','최근 급격히 허약']))}
    ${DeepUI.subhead('가장 불편한 증상 (주호소)')}
    ${DeepUI.textarea('chiefComplaint','어디가 가장 불편하신가요?')}
  `},
  3:{ navTitle:'생활 습관', html:()=>`
    ${DeepUI.header('생활 습관 · 전신 상태')}
    ${DeepUI.subhead('스트레스 정도')}
    ${DeepUI.group(DeepUI.radioList('stressLevel',['편안함','견딜만함','심함','항상 긴장','매우 심함(우울)']))}
    ${DeepUI.subhead('수면 습관')}
    ${DeepUI.group(DeepUI.radioList('sleepQuality',['개운함','꿈이 많음','자주 깸','입면장애(잠들기 힘듦)']))}
    ${DeepUI.subhead('식사 및 소화')}
    ${DeepUI.group(`
      ${DeepUI.selectRow('소화 상태','digestion',['소화 잘됨','소화불량/더부룩','자주 체함','속쓰림/신물'])}
      ${DeepUI.selectRow('식욕 상태','appetite',['보통','식욕 좋음(과식)','식욕없음','입맛이 씀/없음'])}
    `)}
    ${DeepUI.subhead('한열 (추위/더위)')}
    ${DeepUI.group(DeepUI.radioList('coldHeat',['보통','추위/더위 잘탐','얼굴로 열이 오름','손발이 참']))}
    ${DeepUI.subhead('대변 · 소변 상태')}
    ${DeepUI.group(DeepUI.radioList('stool',['정상','변비','설사/묽은변','불규칙']))}
    ${DeepUI.group(DeepUI.radioList('urine',['정상','자주 봄(빈뇨)','시원찮음/잔뇨감','진하고 냄새남']))}
  `},
  4:{ navTitle:'오장 · 과거력', html:()=>`
    ${DeepUI.header('오장(五臟) 체크')}
    ${DeepUI.subhead('간(肝) 기능 — 피로, 해독, 근육')}
    ${DeepUI.group(DeepUI.checkGrid(DEEP_OPT_LIVER,'liverSymptoms'))}
    ${DeepUI.subhead('심(心) 기능 — 순환, 정신, 수면')}
    ${DeepUI.group(DeepUI.checkGrid(DEEP_OPT_HEART,'heartSymptoms'))}
    ${DeepUI.subhead('비(脾) 기능 — 소화, 흡수, 사지')}
    ${DeepUI.group(DeepUI.checkGrid(DEEP_OPT_SPLEEN,'spleenSymptoms'))}
    ${DeepUI.subhead('폐(肺) 기능 — 호흡기, 피부, 면역')}
    ${DeepUI.group(DeepUI.checkGrid(DEEP_OPT_LUNG,'lungSymptoms'))}
    ${DeepUI.subhead('신(腎) 기능 — 비뇨, 생식, 뼈')}
    ${DeepUI.group(DeepUI.checkGrid(DEEP_OPT_KIDNEY,'kidneySymptoms'))}
    ${DeepUI.header('과거 병력 및 수술 이력')}
    ${DeepUI.group(DeepUI.checkGrid(DEEP_OPT_HISTORY,'history'))}
    ${DeepUI.subhead('수술 경험')}
    ${DeepUI.group(DeepUI.radioList('surgery',['없음','있음']))}
  `},
  5:{ navTitle:'여성 건강', html:()=>`
    ${DeepUI.header('여성 건강 체크')}
    ${DeepUI.subhead('월경 주기')}
    ${DeepUI.group(DeepUI.radioList('periodCycle',['규칙적','불규칙','희발월경(드뭄)','빈발월경(잦음)']))}
    ${DeepUI.subhead('생리통 정도')}
    ${DeepUI.group(DeepUI.radioList('periodPain',['없음','약간(참을만함)','심함(약 복용)','매우 심함']))}
    ${DeepUI.subhead('혈액 양상 (덩어리)')}
    ${DeepUI.group(DeepUI.radioList('periodClots',['없음/선홍색','약간 있음','검붉고 덩어리 많음']))}
    ${DeepUI.subhead('냉/대하 (분비물)')}
    ${DeepUI.group(DeepUI.radioList('discharge',['없음','약간 있음','많음','냄새/가려움']))}
    ${DeepUI.subhead('월경 전 증후군 (PMS)')}
    ${DeepUI.group(DeepUI.checkGrid(DEEP_OPT_PMS,'pms'))}
  `}
};

function deepRenderProgress(){
  const fill=document.getElementById('deep-progress-fill');
  const total=deepGetTotalSteps();
  const pct = deepCurrentStep<=1 ? 0 : ((deepCurrentStep-1)/total)*100;
  fill.style.width=pct+'%';
}
function refreshDeepStep(){
  if(deepCurrentStep===1) return;
  const container=document.getElementById('deep-dynamic-container');
  container.innerHTML = deepSections[deepCurrentStep].html();
  if(window.lucide) lucide.createIcons();
  deepRenderProgress();
}
window.deepUpdateUI = function(){
  triggerFadeIn(document.getElementById('deep-dynamic-container'));
  document.querySelectorAll('.deep-step-content').forEach(s=>s.classList.remove('active'));
  const bottomAction=document.getElementById('deep-bottom-action'), nextBtn=document.getElementById('deep-next-btn'),
        backLabel=document.getElementById('deep-btn-back-label'), navTitle=document.getElementById('deep-nav-title'),
        scrollContainer=document.getElementById('deep-scroll-container');
  if(deepCurrentStep===1){
    document.getElementById('deep-step-1').classList.add('active');
    bottomAction.classList.add('hidden'); backLabel.innerText='메인으로'; navTitle.innerText='소개';
  } else {
    const config=deepSections[deepCurrentStep];
    const container=document.getElementById('deep-dynamic-container');
    container.innerHTML=config.html(); container.classList.add('active');
    bottomAction.classList.remove('hidden'); backLabel.innerText='이전'; navTitle.innerText=config.navTitle;
    nextBtn.innerText = (deepCurrentStep===deepGetTotalSteps()) ? '완료 및 리포트 생성' : '다음 단계';
  }
  deepRenderProgress(); if(window.lucide) lucide.createIcons();
  if(scrollContainer) scrollContainer.scrollTo(0,0);
};
window.deepNextStep = function(){ if(deepCurrentStep<deepGetTotalSteps()){ deepCurrentStep++; deepUpdateUI(); } else { saveDeepRecordToSheet(); document.getElementById('deep-app-shell').style.display='none'; showCompletion(); } };
window.deepPrevStep = function(){ if(deepCurrentStep>1){ deepCurrentStep--; deepUpdateUI(); } else { document.getElementById('deep-app-shell').style.display='none'; returnToHub(); } };
window.enterDeepSurvey = function(){
  document.getElementById('hub-view').style.display='none';
  const shell=document.getElementById('deep-app-shell'); shell.style.display='flex'; triggerFadeIn(shell);
  deepCurrentStep=1; deepUpdateUI();
};
window.deepBackToForm = function(){
  document.getElementById('deep-report-view').classList.remove('active');
  if(deepCameFromSearch){
    deepCameFromSearch=false;
    document.getElementById('search-view').style.display='flex';
  } else {
    document.getElementById('deep-app-shell').style.display='flex';
    deepCurrentStep=deepGetTotalSteps(); deepUpdateUI();
  }
};

/* ----- H-SCALE 스코어링 (증상강도 계산 후, 건강도=100-강도 로 환산) ----- */
function calcDeepOrganHealth(){
  const f=deepFormData; let s={liver:20,heart:20,spleen:20,lung:20,kidney:20}; const w=15;
  s.liver += f.liverSymptoms.length*w;
  if(f.stressLevel==='심함'||f.stressLevel==='매우 심함(우울)') s.liver+=15;
  if(f.pms.includes('감정기복/우울')) s.liver+=10;
  s.heart += f.heartSymptoms.length*w;
  if(f.sleepQuality==='자주 깸'||f.sleepQuality==='입면장애(잠들기 힘듦)') s.heart+=15;
  if(f.stressLevel==='항상 긴장') s.heart+=10;
  s.spleen += f.spleenSymptoms.length*w;
  if(f.digestion && f.digestion!=='소화 잘됨') s.spleen+=10;
  if(f.appetite==='식욕없음') s.spleen+=10;
  if(f.stool==='설사/묽은변') s.spleen+=10;
  s.lung += f.lungSymptoms.length*w;
  if(f.coldHeat==='추위/더위 잘탐') s.lung+=15;
  if(f.lungSymptoms.includes('비염, 천식, 아토피 진단을 받은 적 있다')) s.lung+=15;
  s.kidney += f.kidneySymptoms.length*w;
  if(f.urine && f.urine!=='정상') s.kidney+=10;
  if(f.coldHeat==='추위/더위 잘탐') s.kidney+=5;
  if(f.kidneySymptoms.includes('방광염, 신장질환을 앓은 적 있다')) s.kidney+=15;
  Object.keys(s).forEach(k=>{ if(s[k]>100) s[k]=100; });
  const health = {};
  Object.entries(s).forEach(([k,v])=>{ health[k]=Math.max(8, 120-v); });
  return { '간':health.liver, '심':health.heart, '비':health.spleen, '폐':health.lung, '신':health.kidney };
}
function calcDeepQiBloodWater(){
  const f=deepFormData; let s={qiDef:20,qiRev:20,qiStag:20,bloodDef:20,bloodStasis:20,dampness:20,yinDef:20};
  if(f.liverSymptoms.includes('쉽게 피로를 느끼고 잘 지친다')) s.qiDef+=20;
  if(f.lungSymptoms.includes('목소리에 힘이 없다')) s.qiDef+=15;
  if(f.spleenSymptoms.includes('몸이 무겁고 눕기를 좋아한다')) s.qiDef+=15;
  if(f.healthSelfAssess==='허약함'||f.healthSelfAssess==='최근 급격히 허약') s.qiDef+=15;
  if(f.appetite==='식욕없음') s.qiDef+=10;
  if(f.spleenSymptoms.includes('멀미를 하거나 구역감이 있다')) s.qiRev+=25;
  if(f.lungSymptoms.includes('마른 기침, 가래, 콧물이 잦다')) s.qiRev+=20;
  if(f.coldHeat==='얼굴로 열이 오름') s.qiRev+=20;
  if(f.heartSymptoms.includes('가슴이 두근거리고 자주 놀란다')) s.qiRev+=10;
  if(f.liverSymptoms.includes('짜증이 많고 화를 자주 낸다')) s.qiStag+=20;
  if(f.liverSymptoms.includes('옆구리가 결리거나 아프다')) s.qiStag+=15;
  if(f.heartSymptoms.includes('가슴이 두근거리고 자주 놀란다')) s.qiStag+=10;
  if(f.stressLevel==='심함'||f.stressLevel==='항상 긴장') s.qiStag+=20;
  if(f.pms.includes('가슴통증/팽만감')) s.qiStag+=15;
  if(f.liverSymptoms.includes('어지러움이나 두통이 있다')) s.bloodDef+=20;
  if(f.heartSymptoms.includes('안색이 창백하다는 말을 듣는다')) s.bloodDef+=20;
  if(f.heartSymptoms.includes('손발이 차고 저리다')) s.bloodDef+=15;
  if(f.kidneySymptoms.includes('머리카락 숱이 적거나 힘이 없다')) s.bloodDef+=10;
  if(f.liverSymptoms.includes('눈이 침침하고 피로하다')) s.bloodDef+=15;
  if(f.liverSymptoms.includes('멍이 잘 든다')) s.bloodStasis+=20;
  if(f.periodClots==='검붉고 덩어리 많음') s.bloodStasis+=25;
  if(f.periodPain==='심함(약 복용)'||f.periodPain==='매우 심함') s.bloodStasis+=20;
  if(f.pms.includes('아랫배/허리 통증')) s.bloodStasis+=10;
  if(f.surgery==='있음') s.bloodStasis+=10;
  if(f.spleenSymptoms.includes('몸이 무겁고 눕기를 좋아한다')) s.dampness+=20;
  if(f.kidneySymptoms.includes('눈 주위가 붓거나 다크써클이 생긴다')) s.dampness+=20;
  if(f.stool==='설사/묽은변') s.dampness+=15;
  if(f.discharge==='많음'||f.discharge==='냄새/가려움') s.dampness+=15;
  if(f.lungSymptoms.includes('마른 기침, 가래, 콧물이 잦다')) s.dampness+=10;
  if(f.coldHeat==='얼굴로 열이 오름') s.yinDef+=20;
  if(f.kidneySymptoms.includes('귀에서 소리가 난다(이명)')) s.yinDef+=15;
  if(f.urine==='진하고 냄새남') s.yinDef+=15;
  if(f.lungSymptoms.includes('피부가 건조하고 가렵다')) s.yinDef+=15;
  if(f.sleepQuality==='입면장애(잠들기 힘듦)') s.yinDef+=10;
  Object.keys(s).forEach(k=>{ if(s[k]>100) s[k]=100; if(s[k]<20) s[k]=20; });
  const h={}; Object.entries(s).forEach(([k,v])=>{ h[k]=Math.max(8,120-v); });
  return { '기허':h.qiDef, '기역':h.qiRev, '기울':h.qiStag, '혈허':h.bloodDef, '어혈':h.bloodStasis, '수체':h.dampness, '음허':h.yinDef };
}

function generateDeepReportAndShow(skipSave){
  const f=deepFormData, isFemale=f.gender==='여성', todayStr=new Date().toLocaleDateString('ko-KR');
  document.title = `${(f.name||'이름미상').replace(/\s+/g,'')}_심층진료_${new Date().toISOString().slice(0,10).replace(/-/g,'')}`;

  document.getElementById('deep-rp-name').innerText=f.name||'미입력';
  document.getElementById('deep-rp-age').innerText=`${f.gender} · ${formatAgeFromBirthDate(f.birthDate)}`;
  document.getElementById('deep-rp-body').innerText=`${f.height||'0'}cm / ${f.weight||'0'}kg`;
  document.getElementById('deep-rp-selfassess').innerText=f.healthSelfAssess||'-';
  document.getElementById('deep-rp-date').innerText=todayStr;
  document.getElementById('deep-rp-complaint').innerText=f.chiefComplaint||'특이 호소 증상 없음';
  document.getElementById('deep-rp-footer-1').innerText=`측정일: ${todayStr}`;
  document.getElementById('deep-rp-footer-2').innerText=`측정일: ${todayStr}`;
  document.getElementById('deep-badge-1').innerText='1 / 2';

  const organ=calcDeepOrganHealth(), qhs=calcDeepQiBloodWater();
  drawRadar(organ,'deep-rp-radar'); drawRadar(qhs,'deep-rp-qhs-radar');
  const organModern={'간':'피로회복·해독','심':'순환·정신·수면','비':'소화·흡수','폐':'호흡·면역','신':'생식·비뇨·뼈'};
  const qhsModern={'기허':'기운부족','기역':'기운상충','기울':'스트레스','혈허':'혈액부족','어혈':'혈액순환','수체':'부종·담음','음허':'진액부족'};
  renderLegend('deep-rp-organ-legend', organ, organModern);
  renderLegend('deep-rp-qhs-legend', qhs, qhsModern);

  const organAvg = Object.values(organ).reduce((a,b)=>a+b,0)/Object.values(organ).length;
  const qhsAvg = Object.values(qhs).reduce((a,b)=>a+b,0)/Object.values(qhs).length;
  const hscaleScore = Math.round((organAvg+qhsAvg)/2);
  let grade='관찰필요', color='#dc2626';
  if(hscaleScore>=80){ grade='우수'; color='#16a34a'; }
  else if(hscaleScore>=60){ grade='양호'; color='#65a30d'; }
  else if(hscaleScore>=40){ grade='보통'; color='#d97706'; }
  document.getElementById('deep-hscale-score').innerText=hscaleScore;
  document.getElementById('deep-hscale-ring').style.background=`conic-gradient(${color} ${hscaleScore}%, #EDEEF1 0)`;
  document.getElementById('deep-hscale-grade').innerText=`종합 건강 스코어 ${hscaleScore}점 · ${grade}`;

  const lifestyleLines=[];
  if(f.stressLevel) lifestyleLines.push(`스트레스: ${f.stressLevel}`);
  if(f.sleepQuality) lifestyleLines.push(`수면: ${f.sleepQuality}`);
  if(f.digestion||f.appetite) lifestyleLines.push(`소화/식욕: ${f.digestion||'-'} · ${f.appetite||'-'}`);
  if(f.stool||f.urine) lifestyleLines.push(`대소변: ${f.stool||'-'} · ${f.urine||'-'}`);
  if(f.coldHeat) lifestyleLines.push(`한열: ${f.coldHeat}`);
  document.getElementById('deep-rp-lifestyle').innerHTML = lifestyleLines.length ? lifestyleLines.map(l=>`<div class="mb-1.5">• ${l}</div>`).join('') : '<div>입력된 생활습관 정보가 없습니다.</div>';

  const womenCard=document.getElementById('deep-rp-women-card');
  if(isFemale){
    womenCard.style.display='block';
    document.getElementById('deep-rp-women').innerHTML = `
      <div class="mb-1.5">• 월경 주기: ${f.periodCycle||'-'} · 생리통: ${f.periodPain||'-'}</div>
      <div class="mb-1.5">• 혈액 양상: ${f.periodClots||'-'} · 냉/대하: ${f.discharge||'-'}</div>
      <div>• PMS: ${f.pms.length?f.pms.join(', '):'해당 없음'}</div>`;
  } else { womenCard.style.display='none'; }

  document.getElementById('deep-rp-history').innerHTML = `
    <div class="mb-1.5">• 과거 병력: ${f.history.length?f.history.join(', '):'해당 없음'}</div>
    <div>• 수술 경험: ${f.surgery}</div>`;

  const weakestOrgan=Object.entries(organ).sort((a,b)=>a[1]-b[1])[0];
  const weakestQhs=Object.entries(qhs).sort((a,b)=>a[1]-b[1])[0];
  document.getElementById('deep-rp-overall').innerText =
    `주호소 "${f.chiefComplaint||'특이 증상 없음'}"과 문진 응답을 종합하면 오장 중 ${weakestOrgan[0]}(${organModern[weakestOrgan[0]]}) 계통과, 변증상 ${weakestQhs[0]}(${qhsModern[weakestQhs[0]]}) 경향이 상대적으로 두드러집니다. 진료실에서 체질에 맞는 처방과 관리 계획을 안내해 드리겠습니다.`;

  document.getElementById('deep-app-shell').style.display='none';
  const _rv=document.getElementById('deep-report-view'); _rv.classList.add('active'); triggerFadeIn(_rv.querySelector('.report-scroll'));
  if(window.lucide) lucide.createIcons();
  const statusEl=document.getElementById('deep-save-status'); if(statusEl) statusEl.innerText='';
    document.getElementById('deep-rp-doctor-note-slot').innerHTML = doctorNoteBoxHtml('deep-rp');
  document.getElementById('deep-rp-private-note-slot').innerHTML = privateNoteBoxHtml('deep-rp');
  fillNoteBoxes('deep-rp');
  if(window.lucide) lucide.createIcons();
if(!skipSave) saveDeepRecordToSheet();
}

function saveDeepRecordToSheet(){
  const statusEl=document.getElementById('deep-save-status');
  if(!isSheetConfigured()){ if(statusEl) statusEl.innerText='저장소 미설정'; return; }
  if(statusEl) statusEl.innerText='저장 중...';
  const payload = { category:'심층진료', name: deepFormData.name, birthDate: deepFormData.birthDate, gender: deepFormData.gender, ageGroup:'', formData: deepFormData };
  fetch(CONFIG.SHEET_URL, { method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(payload) })
    .then(()=>{ if(statusEl) statusEl.innerText='저장 요청 완료 ✓'; })
    .catch((err)=>{ console.error('저장 실패:',err); if(statusEl) statusEl.innerText='저장 실패 - 설정을 확인해 주세요'; });
}

