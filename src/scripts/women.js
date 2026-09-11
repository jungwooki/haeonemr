/* ===================== 여성건강 모듈 ===================== */
let womenCurrentStep = 1;
let womenCameFromSearch = false;
const womenTotalSteps = 4;
const womenFormData = {
  name:'', birthDate:'', height:'', weight:'', chiefComplaint:'',
  lastPeriodDate:'', periodCycle:'', periodAmount:'', periodPain:'', periodClots:'', pms:[], discharge:'',
  coldHeat:'', sweat:'', digestion:'', appetite:'', sleepQuality:'', stool:'', urine:'',
  liverSymptoms:[], heartSymptoms:[], spleenSymptoms:[], lungSymptoms:[], kidneySymptoms:[],
  history:[], surgery:'없음'
};
window.updateWomenData = function(key,val){ womenFormData[key]=val; };
window.updateWomenCheck = function(cat,val,checked){
  if(checked){ if(!womenFormData[cat].includes(val)) womenFormData[cat].push(val); }
  else{ womenFormData[cat]=womenFormData[cat].filter(i=>i!==val); }
};
window.setWomenRadio = function(field,val){ womenFormData[field]=val; refreshWomenStep(); };

const WomenUI = {
  group:(c)=>`<div class="bg-white rounded-[10px] overflow-hidden border border-[#EDEEF1] w-full">${c}</div>`,
  inputRow:(label,field,placeholder,type="text",suffix="")=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white">
      <span class="text-[16px] font-semibold text-black">${label}</span>
      <div class="flex items-center gap-1">
        <input type="${type}" oninput="updateWomenData('${field}', this.value)" value="${womenFormData[field]}" class="text-right text-[16px] text-[#8E8E93] font-medium outline-none w-40 placeholder:text-gray-300 bg-transparent" placeholder="${placeholder}">
        ${suffix?`<span class="text-[#8E8E93] font-medium text-[15px]">${suffix}</span>`:''}
      </div>
    </div>`,
  dateRow:(label,field)=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white">
      <span class="text-[16px] font-semibold text-black">${label}</span>
      <input type="date" onchange="updateWomenData('${field}', this.value)" value="${womenFormData[field]}" class="text-right text-[16px] text-[#8E8E93] font-medium outline-none bg-transparent">
    </div>`,
  textarea:(field,placeholder)=>`
    <div class="bg-white rounded-[12px] p-5 shadow-sm border border-[#EDEEF1]">
      <textarea oninput="updateWomenData('${field}', this.value)" class="w-full h-24 outline-none resize-none text-[16px] font-medium text-black placeholder:text-gray-300 bg-transparent" placeholder="${placeholder}">${womenFormData[field]}</textarea>
    </div>`,
  selectRow:(label,field,options)=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white gap-3">
      <span class="text-[15px] font-semibold text-black shrink-0">${label}</span>
      <select onchange="updateWomenData('${field}', this.value)" class="text-right text-[14px] text-[#8E8E93] font-medium outline-none bg-transparent flex-1">
        <option value="">선택</option>
        ${options.map(o=>`<option value="${o}" ${womenFormData[field]===o?'selected':''}>${o}</option>`).join('')}
      </select>
    </div>`,
  radioList:(field,options)=>`<div>${options.map(opt=>`
    <label class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white cursor-pointer active:bg-gray-50" onclick="setWomenRadio('${field}','${opt.replace(/'/g,"\\'")}')">
      <span class="text-[15px] font-semibold text-black">${opt}</span>
      <div class="w-5 h-5 rounded-full border-2 ${womenFormData[field]===opt?'border-[#a6a1fb] bg-[#a6a1fb]':'border-gray-300'} flex items-center justify-center shrink-0">
        ${womenFormData[field]===opt?'<div class="w-2 h-2 bg-white rounded-full"></div>':''}
      </div>
    </label>`).join('')}</div>`,
  checkRow:(label,category,value)=>`
    <label class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] bg-white cursor-pointer active:bg-gray-50 transition-colors">
      <span class="text-[15px] font-semibold text-black">${label}</span>
      <div class="relative flex items-center justify-center">
        <input type="checkbox" class="sr-only peer" onchange="updateWomenCheck('${category}', '${value}', this.checked)" ${womenFormData[category].includes(value)?'checked':''}>
        <i data-lucide="check" class="w-6 h-6 text-[#a6a1fb] opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></i>
      </div>
    </label>`,
  checkGrid:(items,category)=>`<div class="md:grid md:grid-cols-2 md:divide-x md:divide-[#EDEEF1]">${items.map(v=>WomenUI.checkRow(v,category,v)).join('')}</div>`,
  header:(t)=>`<h2 class="text-[26px] font-extrabold tracking-tight text-black mb-1.5 mt-5 px-2 first:mt-0">${t}</h2>`,
  subhead:(t)=>`<div class="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1.5 mt-4 px-4">${t}</div>`
};

const WOMEN_OPT_LIVER = ['쉽게 피로하고 지친다','짜증/화가 많다','옆구리가 결리거나 아프다','눈이 침침하고 피로하다','근육에 쥐가 잘 난다','멍이 잘 든다','어지러움/두통'];
const WOMEN_OPT_HEART = ['가슴이 답답/두근거림','잘 놀란다','꿈을 많이 꾼다','건망증이 심하다','안색이 창백하다','손발이 차고 저리다','얼굴이 붉다'];
const WOMEN_OPT_SPLEEN = ['소화가 잘 안된다','식욕이 없다','몸이 무겁다','눕기를 좋아한다','멀미/구역감','입술이 트거나 마른다','멍이 잘 든다'];
const WOMEN_OPT_LUNG = ['감기에 자주 걸린다','기침/가래가 잦다','숨이 차다','피부가 건조하다','비염/알레르기가 있다','목소리에 힘이 없다'];
const WOMEN_OPT_KIDNEY = ['허리/무릎이 아프다','소변을 자주 본다','부종/다크서클','귀에서 소리가 난다(이명)','모발건조/탈모','새벽 설사'];
const WOMEN_OPT_HISTORY = ['고혈압','당뇨','갑상선질환','자궁근종/내막증','방광염/신장염','비염/천식'];
const WOMEN_OPT_PMS = ['가슴통증/팽만감','아랫배/허리 통증','감정기복/우울','소화불량/변비','두통/어지럼증'];

const womenSections = {
  2:{ navTitle:'기본 정보', html:()=>`
    ${WomenUI.header('기본 정보')}
    ${WomenUI.group(`
      ${WomenUI.inputRow('성함','name','이름 입력')}
      ${WomenUI.dateRow('생년월일','birthDate')}
      ${WomenUI.inputRow('키','height','0','number','cm')}
      ${WomenUI.inputRow('체중','weight','0','number','kg')}
    `)}
    ${WomenUI.subhead('가장 불편한 증상 (주호소)')}
    ${WomenUI.textarea('chiefComplaint','예: 심한 생리통, 만성 피로, 소화 불량 등')}
  `},
  3:{ navTitle:'자궁 · 월경', html:()=>`
    ${WomenUI.header('자궁 및 월경 건강')}
    ${WomenUI.group(WomenUI.dateRow('마지막 월경 시작일 (LMP)','lastPeriodDate'))}
    ${WomenUI.subhead('월경 주기')}
    ${WomenUI.group(WomenUI.radioList('periodCycle',['규칙적 (28-30일)','짧은 편 (<25일)','긴 편 (>35일)','불규칙']))}
    ${WomenUI.subhead('월경 양')}
    ${WomenUI.group(WomenUI.radioList('periodAmount',['보통','많은 편','적은 편','매우 적음']))}
    ${WomenUI.subhead('생리통 정도')}
    ${WomenUI.group(WomenUI.radioList('periodPain',['없음/미약','보통 (참을만함)','심함 (진통제 필수)','일상 불가']))}
    ${WomenUI.subhead('혈액 양상 (덩어리)')}
    ${WomenUI.group(WomenUI.radioList('periodClots',['없음 (맑음)','약간 있음','많음 (덩어리)','검붉고 끈적함']))}
    ${WomenUI.subhead('월경 전 증후군 (PMS) 및 기타 증상 (다중 선택)')}
    ${WomenUI.group(WomenUI.checkGrid(WOMEN_OPT_PMS,'pms'))}
    ${WomenUI.subhead('냉/대하 (분비물)')}
    ${WomenUI.group(WomenUI.radioList('discharge',['없음/정상','약간 있음','많음','냄새/가려움 동반']))}
  `},
  4:{ navTitle:'전신 상태', html:()=>`
    ${WomenUI.header('전신 생리 지표')}
    ${WomenUI.subhead('추위/더위 (한열)')}
    ${WomenUI.group(WomenUI.radioList('coldHeat',['보통','추위를 많이 탐','더위를 많이 탐','상열감 (얼굴 화끈)']))}
    ${WomenUI.subhead('땀 (발한)')}
    ${WomenUI.group(WomenUI.radioList('sweat',['보통','잘 안나는 편','조금만 움직여도 남','잘 때 식은땀(도한)']))}
    ${WomenUI.subhead('소화 · 식욕')}
    ${WomenUI.group(`
      ${WomenUI.selectRow('소화 상태','digestion',['소화 잘됨','소화불량/더부룩','자주 체함','속쓰림/신물'])}
      ${WomenUI.selectRow('식욕 상태','appetite',['보통','식욕 좋음(과식)','식욕없음','입맛이 씀/없음'])}
    `)}
    ${WomenUI.subhead('수면 상태')}
    ${WomenUI.group(WomenUI.radioList('sleepQuality',['숙면함','꿈이 많음','자주 깸','입면장애(잠들기 힘듦)']))}
    ${WomenUI.subhead('대변 · 소변')}
    ${WomenUI.group(WomenUI.radioList('stool',['정상','변비','설사/묽은변','불규칙']))}
    ${WomenUI.group(WomenUI.radioList('urine',['정상','자주 봄(빈뇨)','시원찮음','진하고 냄새남']))}
  `},
  5:{ navTitle:'오장 · 과거력', html:()=>`
    ${WomenUI.header('오장(五臟) 체크')}
    ${WomenUI.subhead('간(肝) — 피로, 스트레스')}
    ${WomenUI.group(WomenUI.checkGrid(WOMEN_OPT_LIVER,'liverSymptoms'))}
    ${WomenUI.subhead('심(心) — 순환, 정신')}
    ${WomenUI.group(WomenUI.checkGrid(WOMEN_OPT_HEART,'heartSymptoms'))}
    ${WomenUI.subhead('비(脾) — 소화, 흡수')}
    ${WomenUI.group(WomenUI.checkGrid(WOMEN_OPT_SPLEEN,'spleenSymptoms'))}
    ${WomenUI.subhead('폐(肺) — 호흡, 면역')}
    ${WomenUI.group(WomenUI.checkGrid(WOMEN_OPT_LUNG,'lungSymptoms'))}
    ${WomenUI.subhead('신(腎) — 생식, 비뇨')}
    ${WomenUI.group(WomenUI.checkGrid(WOMEN_OPT_KIDNEY,'kidneySymptoms'))}
    ${WomenUI.header('과거력 및 수술 이력')}
    ${WomenUI.group(WomenUI.checkGrid(WOMEN_OPT_HISTORY,'history'))}
    ${WomenUI.subhead('수술 경험')}
    ${WomenUI.group(WomenUI.radioList('surgery',['없음','있음']))}
  `}
};

function womenRenderProgress(){
  const fill=document.getElementById('women-progress-fill');
  const pct = womenCurrentStep<=1 ? 0 : ((womenCurrentStep-1)/womenTotalSteps)*100;
  fill.style.width=pct+'%';
}
function refreshWomenStep(){
  if(womenCurrentStep===1) return;
  const container=document.getElementById('women-dynamic-container');
  container.innerHTML = womenSections[womenCurrentStep].html();
  if(window.lucide) lucide.createIcons();
  womenRenderProgress();
}
window.womenUpdateUI = function(){
  triggerFadeIn(document.getElementById('women-dynamic-container'));
  document.querySelectorAll('.women-step-content').forEach(s=>s.classList.remove('active'));
  const bottomAction=document.getElementById('women-bottom-action'), nextBtn=document.getElementById('women-next-btn'),
        backLabel=document.getElementById('women-btn-back-label'), navTitle=document.getElementById('women-nav-title'),
        scrollContainer=document.getElementById('women-scroll-container');
  if(womenCurrentStep===1){
    document.getElementById('women-step-1').classList.add('active');
    bottomAction.classList.add('hidden'); backLabel.innerText='메인으로'; navTitle.innerText='소개';
  } else {
    const config=womenSections[womenCurrentStep];
    const container=document.getElementById('women-dynamic-container');
    container.innerHTML=config.html(); container.classList.add('active');
    bottomAction.classList.remove('hidden'); backLabel.innerText='이전'; navTitle.innerText=config.navTitle;
    nextBtn.innerText = (womenCurrentStep===womenTotalSteps) ? '완료 및 리포트 생성' : '다음 단계';
  }
  womenRenderProgress(); if(window.lucide) lucide.createIcons();
  if(scrollContainer) scrollContainer.scrollTo(0,0);
};
window.womenNextStep = function(){ if(womenCurrentStep<womenTotalSteps){ womenCurrentStep++; womenUpdateUI(); } else { saveWomenRecordToSheet(); document.getElementById('women-app-shell').style.display='none'; showCompletion(); } };
window.womenPrevStep = function(){ if(womenCurrentStep>1){ womenCurrentStep--; womenUpdateUI(); } else { document.getElementById('women-app-shell').style.display='none'; returnToHub(); } };
window.enterWomenSurvey = function(){
  document.getElementById('hub-view').style.display='none';
  const shell=document.getElementById('women-app-shell'); shell.style.display='flex'; triggerFadeIn(shell);
  womenCurrentStep=1; womenUpdateUI();
};
window.womenBackToForm = function(){
  document.getElementById('women-report-view').classList.remove('active');
  if(womenCameFromSearch){
    womenCameFromSearch=false;
    document.getElementById('search-view').style.display='flex';
  } else {
    document.getElementById('women-app-shell').style.display='flex';
    womenCurrentStep=womenTotalSteps; womenUpdateUI();
  }
};

/* ----- H-SCALE 스코어링 (증상강도 계산 후, 건강도=100-강도 로 환산) ----- */
function calcWomenOrganHealth(){
  const f=womenFormData;
  let s={liver:30,heart:30,spleen:30,lung:30,kidney:30};
  s.liver += f.liverSymptoms.length*15;
  if(f.pms.includes('감정기복/우울')) s.liver+=10;
  s.heart += f.heartSymptoms.length*15;
  if(f.sleepQuality==='자주 깸'||f.sleepQuality==='입면장애(잠들기 힘듦)') s.heart+=10;
  s.spleen += f.spleenSymptoms.length*15;
  if(f.digestion && f.digestion!=='소화 잘됨') s.spleen+=10;
  if(f.appetite==='식욕없음') s.spleen+=10;
  s.lung += f.lungSymptoms.length*15;
  if(f.sweat==='조금만 움직여도 남') s.lung+=10;
  if(f.history.includes('비염/천식')) s.lung+=10;
  s.kidney += f.kidneySymptoms.length*15;
  if(f.history.includes('방광염/신장염')) s.kidney+=15;
  if(f.coldHeat==='추위를 많이 탐') s.kidney+=10;
  if(f.urine && f.urine!=='정상') s.kidney+=10;
  Object.keys(s).forEach(k=>{ if(s[k]>100) s[k]=100; if(s[k]<20) s[k]=20; });
  return { '간':Math.max(8,120-s.liver), '심':Math.max(8,120-s.heart), '비':Math.max(8,120-s.spleen), '폐':Math.max(8,120-s.lung), '신':Math.max(8,120-s.kidney) };
}
function calcWomenQiBloodWater(){
  const f=womenFormData;
  let s={qiDef:30,qiStag:20,bloodDef:30,bloodStasis:20,dampness:20,heat:20};
  if(f.spleenSymptoms.includes('쉽게 피로하고 지친다')) s.qiDef+=20;
  if(f.lungSymptoms.includes('감기에 자주 걸린다')) s.qiDef+=15;
  if(f.digestion==='소화불량/더부룩') s.qiDef+=15;
  if(f.appetite==='식욕없음') s.qiDef+=10;
  if(f.periodAmount==='적은 편') s.qiDef+=10;
  if(f.liverSymptoms.includes('짜증/화가 많다')) s.qiStag+=25;
  if(f.heartSymptoms.includes('가슴이 답답/두근거림')) s.qiStag+=15;
  if(f.pms.includes('감정기복/우울')) s.qiStag+=20;
  if(f.pms.includes('가슴통증/팽만감')) s.qiStag+=15;
  if(f.periodCycle==='불규칙') s.qiStag+=10;
  if(f.heartSymptoms.includes('안색이 창백하다')) s.bloodDef+=20;
  if(f.liverSymptoms.includes('어지러움/두통')) s.bloodDef+=20;
  if(f.kidneySymptoms.includes('모발건조/탈모')) s.bloodDef+=15;
  if(f.periodAmount==='매우 적음') s.bloodDef+=20;
  if(f.sleepQuality==='꿈이 많음') s.bloodDef+=10;
  if(f.periodPain==='심함 (진통제 필수)') s.bloodStasis+=30;
  if(f.periodClots==='많음 (덩어리)') s.bloodStasis+=25;
  if(f.liverSymptoms.includes('멍이 잘 든다')) s.bloodStasis+=15;
  if(f.surgery==='있음') s.bloodStasis+=15;
  if(f.pms.includes('아랫배/허리 통증')) s.bloodStasis+=10;
  if(f.kidneySymptoms.includes('부종/다크서클')) s.dampness+=25;
  if(f.spleenSymptoms.includes('몸이 무겁다')) s.dampness+=20;
  if(f.spleenSymptoms.includes('멀미/구역감')) s.dampness+=15;
  if(f.discharge==='많음') s.dampness+=20;
  if(f.stool==='설사/묽은변') s.dampness+=10;
  if(f.coldHeat==='더위를 많이 탐') s.heat+=20;
  if(f.coldHeat==='상열감 (얼굴 화끈)') s.heat+=25;
  if(f.heartSymptoms.includes('얼굴이 붉다')) s.heat+=15;
  if(f.urine==='진하고 냄새남') s.heat+=15;
  if(f.history.includes('고혈압')) s.heat+=10;
  Object.keys(s).forEach(k=>{ if(s[k]>100) s[k]=100; if(s[k]<20) s[k]=20; });
  return { '기허':Math.max(8,120-s.qiDef), '기울':Math.max(8,120-s.qiStag), '혈허':Math.max(8,120-s.bloodDef), '어혈':Math.max(8,120-s.bloodStasis), '수체':Math.max(8,120-s.dampness), '열':Math.max(8,120-s.heat) };
}

function generateWomenReportAndShow(skipSave){
  const f=womenFormData, todayStr=new Date().toLocaleDateString('ko-KR');
  document.title = `${(f.name||'이름미상').replace(/\s+/g,'')}_여성건강_${new Date().toISOString().slice(0,10).replace(/-/g,'')}`;

  document.getElementById('women-rp-name').innerText=f.name||'미입력';
  document.getElementById('women-rp-age').innerText=formatAgeFromBirthDate(f.birthDate);
  document.getElementById('women-rp-body').innerText=`${f.height||'0'}cm / ${f.weight||'0'}kg`;
  document.getElementById('women-rp-lmp').innerText=f.lastPeriodDate||'미입력';
  document.getElementById('women-rp-date').innerText=todayStr;
  document.getElementById('women-rp-complaint').innerText=f.chiefComplaint||'특이 호소 증상 없음';
  document.getElementById('women-rp-footer-1').innerText=`측정일: ${todayStr}`;
  document.getElementById('women-rp-footer-2').innerText=`측정일: ${todayStr}`;
  document.getElementById('women-badge-1').innerText='1 / 2';

  const organ=calcWomenOrganHealth(), qhs=calcWomenQiBloodWater();
  drawRadar(organ,'women-rp-radar'); drawRadar(qhs,'women-rp-qhs-radar');
  const organModern={'간':'피로·해독','심':'순환·정신','비':'소화·흡수','폐':'호흡·면역','신':'생식·비뇨'};
  const qhsModern={'기허':'기운부족','기울':'스트레스','혈허':'혈액부족','어혈':'혈액순환','수체':'부종·노폐물','열':'염증·화'};
  renderLegend('women-rp-organ-legend', organ, organModern);
  renderLegend('women-rp-qhs-legend', qhs, qhsModern);

  const organAvg = Object.values(organ).reduce((a,b)=>a+b,0)/Object.values(organ).length;
  const qhsAvg = Object.values(qhs).reduce((a,b)=>a+b,0)/Object.values(qhs).length;
  const hscaleScore = Math.round((organAvg+qhsAvg)/2);
  let grade='관찰필요', color='#dc2626';
  if(hscaleScore>=80){ grade='우수'; color='#16a34a'; }
  else if(hscaleScore>=60){ grade='양호'; color='#65a30d'; }
  else if(hscaleScore>=40){ grade='보통'; color='#d97706'; }
  document.getElementById('women-hscale-score').innerText=hscaleScore;
  document.getElementById('women-hscale-ring').style.background=`conic-gradient(${color} ${hscaleScore}%, #EDEEF1 0)`;
  document.getElementById('women-hscale-grade').innerText=`종합 건강 스코어 ${hscaleScore}점 · ${grade}`;

  const lifestyleLines=[];
  if(f.coldHeat) lifestyleLines.push(`한열: ${f.coldHeat}`);
  if(f.sweat) lifestyleLines.push(`땀: ${f.sweat}`);
  if(f.digestion||f.appetite) lifestyleLines.push(`소화/식욕: ${f.digestion||'-'} · ${f.appetite||'-'}`);
  if(f.sleepQuality) lifestyleLines.push(`수면: ${f.sleepQuality}`);
  if(f.stool||f.urine) lifestyleLines.push(`대소변: ${f.stool||'-'} · ${f.urine||'-'}`);
  document.getElementById('women-rp-lifestyle').innerHTML = lifestyleLines.length ? lifestyleLines.map(l=>`<div class="mb-1.5">• ${l}</div>`).join('') : '<div>입력된 정보가 없습니다.</div>';

  document.getElementById('women-rp-period').innerHTML = `
    <div class="mb-1.5">• LMP: ${f.lastPeriodDate||'미입력'} · 주기: ${f.periodCycle||'-'} · 월경량: ${f.periodAmount||'-'}</div>
    <div class="mb-1.5">• 생리통: ${f.periodPain||'-'} · 혈액 양상: ${f.periodClots||'-'}</div>
    <div class="mb-1.5">• 냉/대하: ${f.discharge||'-'}</div>
    <div>• PMS: ${f.pms.length?f.pms.join(', '):'해당 없음'}</div>`;

  document.getElementById('women-rp-history').innerHTML = `
    <div class="mb-1.5">• 과거 병력: ${f.history.length?f.history.join(', '):'해당 없음'}</div>
    <div>• 수술 경험: ${f.surgery}</div>`;

  const weakestOrgan=Object.entries(organ).sort((a,b)=>a[1]-b[1])[0];
  const weakestQhs=Object.entries(qhs).sort((a,b)=>a[1]-b[1])[0];
  document.getElementById('women-rp-overall').innerText =
    `주호소 "${f.chiefComplaint||'특이 증상 없음'}"과 문진 응답을 종합하면 오장 중 ${weakestOrgan[0]}(${organModern[weakestOrgan[0]]}) 계통과, 변증상 ${weakestQhs[0]}(${qhsModern[weakestQhs[0]]}) 경향이 상대적으로 두드러집니다. 진료실에서 체질과 자궁 건강에 맞춘 처방과 관리 계획을 안내해 드리겠습니다.`;

  document.getElementById('women-app-shell').style.display='none';
  const _rv=document.getElementById('women-report-view'); _rv.classList.add('active'); triggerFadeIn(_rv.querySelector('.report-scroll'));
  if(window.lucide) lucide.createIcons();
  const statusEl=document.getElementById('women-save-status'); if(statusEl) statusEl.innerText='';
    document.getElementById('women-rp-doctor-note-slot').innerHTML = doctorNoteBoxHtml('women-rp');
  document.getElementById('women-rp-private-note-slot').innerHTML = privateNoteBoxHtml('women-rp');
  fillNoteBoxes('women-rp');
  if(window.lucide) lucide.createIcons();
if(!skipSave) saveWomenRecordToSheet();
}

function saveWomenRecordToSheet(){
  const statusEl=document.getElementById('women-save-status');
  if(!isSheetConfigured()){ if(statusEl) statusEl.innerText='저장소 미설정'; return; }
  if(statusEl) statusEl.innerText='저장 중...';
  const payload = { category:'여성', name: womenFormData.name, birthDate: womenFormData.birthDate, gender:'여성', ageGroup:'', formData: womenFormData };
  fetch(CONFIG.SHEET_URL, { method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(payload) })
    .then(()=>{ if(statusEl) statusEl.innerText='저장 요청 완료 ✓'; })
    .catch((err)=>{ console.error('저장 실패:',err); if(statusEl) statusEl.innerText='저장 실패 - 설정을 확인해 주세요'; });
}

