/* ===================== 유소년스포츠 모듈 ===================== */
let sportsCurrentStep = 1;
let sportsCameFromSearch = false;
const sportsTotalSteps = 4;
const sportsFormData = {
  name:'', dob:'', gender:'남', school:'', sport:'',
  trainingRegular:'', trainingPersonal:'', heightChange:'', weightChange:'', chiefComplaint:'',
  abilityEndurance:'', abilityStrength:'', abilitySpeed:'', abilityAgility:'', abilityFlexibility:'', abilityBalance:'',
  energyNutrition:[], recoverySleep:[], immunityInjury:[], mentalityFocus:[],
  growthSelfCheck:[], growthNutrition:[], perfFocus:[],
  painLocation:[], painOnset:'', activityLevel:'', immRespiratory:[],
  guardianName:''
};
window.updateSportsData = function(key,val){ sportsFormData[key]=val; };
window.updateSportsCheck = function(cat,val,checked){
  if(checked){ if(!sportsFormData[cat].includes(val)) sportsFormData[cat].push(val); }
  else{ sportsFormData[cat]=sportsFormData[cat].filter(i=>i!==val); }
};
window.setSportsSegmented = function(field,val,btnEl){
  sportsFormData[field]=val;
  const parent=btnEl.parentElement;
  parent.querySelectorAll('button').forEach(b=>{ b.className="flex-1 py-2 text-[14px] font-medium rounded-[7px] text-[#8E8E93] transition-all duration-200"; });
  btnEl.className="flex-1 py-2 text-[14px] font-bold rounded-[7px] bg-white shadow-[0_3px_8px_rgba(0,0,0,0.12)] text-[#c94622] transition-all duration-200";
};
window.setAbility = function(field,val,btnEl){
  sportsFormData[field]=val;
  const parent=btnEl.parentElement;
  parent.querySelectorAll('button').forEach(b=>{ b.className="py-2 text-[12px] font-semibold rounded-[8px] bg-[#F2F2F7] text-[#8E8E93]"; });
  btnEl.className="py-2 text-[12px] font-bold rounded-[8px] bg-[#fc582b] text-white";
};
window.setSportsRadio = function(field,val){ sportsFormData[field]=val; refreshSportsStep(); };

const SportsUI = {
  group:(c)=>`<div class="bg-white rounded-[10px] overflow-hidden border border-[#EDEEF1] w-full">${c}</div>`,
  inputRow:(label,field,placeholder,type="text",suffix="")=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white">
      <span class="text-[16px] font-semibold text-black">${label}</span>
      <div class="flex items-center gap-1">
        <input type="${type}" oninput="updateSportsData('${field}', this.value)" value="${sportsFormData[field]}" class="text-right text-[16px] text-[#8E8E93] font-medium outline-none w-40 placeholder:text-gray-300 bg-transparent" placeholder="${placeholder}">
        ${suffix?`<span class="text-[#8E8E93] font-medium text-[15px]">${suffix}</span>`:''}
      </div>
    </div>`,
  textarea:(field,placeholder)=>`
    <div class="bg-white rounded-[12px] p-5 shadow-sm border border-[#EDEEF1]">
      <textarea oninput="updateSportsData('${field}', this.value)" class="w-full h-24 outline-none resize-none text-[16px] font-medium text-black placeholder:text-gray-300 bg-transparent" placeholder="${placeholder}">${sportsFormData[field]}</textarea>
    </div>`,
  segmentedControl:(field,options)=>`
    <div class="flex bg-[#F2F2F7] rounded-[9px] p-[3px] w-full">
      ${options.map(opt=>`<button onclick="setSportsSegmented('${field}', '${opt}', this)" class="flex-1 py-2 text-[14px] rounded-[7px] transition-all duration-200 ${sportsFormData[field]===opt?'font-bold bg-white shadow-[0_3px_8px_rgba(0,0,0,0.12)] text-[#c94622]':'font-medium text-[#8E8E93]'}">${opt}</button>`).join('')}
    </div>`,
  radioList:(field,options)=>`<div>${options.map(opt=>`
    <label class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white cursor-pointer active:bg-gray-50" onclick="setSportsRadio('${field}','${opt.replace(/'/g,"\\'")}')">
      <span class="text-[15px] font-semibold text-black">${opt}</span>
      <div class="w-5 h-5 rounded-full border-2 ${sportsFormData[field]===opt?'border-[#fc582b] bg-[#fc582b]':'border-gray-300'} flex items-center justify-center shrink-0">
        ${sportsFormData[field]===opt?'<div class="w-2 h-2 bg-white rounded-full"></div>':''}
      </div>
    </label>`).join('')}</div>`,
  selectRow:(label,field,options)=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white gap-3">
      <span class="text-[15px] font-semibold text-black shrink-0">${label}</span>
      <select onchange="updateSportsData('${field}', this.value)" class="text-right text-[14px] text-[#8E8E93] font-medium outline-none bg-transparent flex-1">
        <option value="">선택</option>
        ${options.map(o=>`<option value="${o}" ${sportsFormData[field]===o?'selected':''}>${o}</option>`).join('')}
      </select>
    </div>`,
  checkRow:(label,category,value)=>`
    <label class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] bg-white cursor-pointer active:bg-gray-50 transition-colors">
      <span class="text-[15px] font-semibold text-black">${label}</span>
      <div class="relative flex items-center justify-center">
        <input type="checkbox" class="sr-only peer" onchange="updateSportsCheck('${category}', '${value}', this.checked)" ${sportsFormData[category].includes(value)?'checked':''}>
        <i data-lucide="check" class="w-6 h-6 text-[#fc582b] opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></i>
      </div>
    </label>`,
  checkGrid:(items,category)=>`<div class="md:grid md:grid-cols-2 md:divide-x md:divide-[#EDEEF1]">${items.map(v=>SportsUI.checkRow(v,category,v)).join('')}</div>`,
  abilityRow:(label,field)=>`
    <div class="bg-white rounded-[12px] p-4 shadow-sm border border-[#EDEEF1]">
      <div class="text-[14px] font-bold text-black mb-3">${label}</div>
      <div class="grid grid-cols-4 gap-2">
        ${['하(부족)','중간','상(좋음)','모름'].map(opt=>`<button type="button" onclick="setAbility('${field}','${opt}',this)" class="py-2 text-[12px] font-semibold rounded-[8px] ${sportsFormData[field]===opt?'bg-[#fc582b] text-white font-bold':'bg-[#F2F2F7] text-[#8E8E93]'}">${opt}</button>`).join('')}
      </div>
    </div>`,
  header:(t)=>`<h2 class="text-[26px] font-extrabold tracking-tight text-black mb-1.5 mt-5 px-2 first:mt-0">${t}</h2>`,
  subhead:(t)=>`<div class="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1.5 mt-4 px-4">${t}</div>`
};

const SPORTS_OPT_ENERGY = ['훈련량에 비해 식사량이 부족함','식욕부진 또는 잦은 더부룩함','체중 조절 스트레스/식사량 제한','찬 음식, 탄산, 단 음식 과다 섭취','(여학생) 월경 불규칙 또는 건너뜀'];
const SPORTS_OPT_SLEEP = ['다음날까지 이어지는 심한 피로감','수면 부족(8시간 미만)','입면 장애 또는 잦은 깸','수면 중 식은땀, 뒤척임','취침 직전까지 스마트폰 사용'];
const SPORTS_OPT_IMMUNITY = ['잦은 감기, 입병, 미열','반복되는 통증 및 부상','비염, 아토피 등 알레르기','잦은 장염, 두드러기'];
const SPORTS_OPT_MENTAL_COND = ['잦은 실수 및 집중력 저하','중요 경기 전 긴장성 복통','기대에 대한 심한 불안감','실수 후 위축 및 무너짐'];
const SPORTS_OPT_GROWTH_SELF = ['또래보다 키가 작다고 느낌','밤에 다리가 아픔(성장통)'];
const SPORTS_OPT_GROWTH_NUTR = ['아침 결식/적은 식사량','잦은 소화불량/체함','많은 훈련량으로 인한 성장 방해 우려','근육 대비 키 성장 부진'];
const SPORTS_OPT_PERF_FOCUS = ['반응 속도/판단 느림','아는 동작 반복 실수','실수 후 눈에 띄게 위축','평소보다 예민/무기력'];
const SPORTS_OPT_PAIN_LOC = ['목/어깨','허리','팔꿈치/손목','고관절','무릎','발목/발'];
const SPORTS_OPT_IMM_RESP = ['심한 비염(콧물,코막힘)','운동 시 숨참/기침','피부 발진/가려움','긴장성 복통/설사'];

const sportsSections = {
  2:{ navTitle:'기본 정보', html:()=>`
    ${SportsUI.header('선수 기본 정보')}
    ${SportsUI.group(`
      ${SportsUI.inputRow('이름','name','이름 입력')}
      ${SportsUI.inputRow('생년월일','dob','','date')}
      <div class="p-3 px-4 border-b border-[#EDEEF1] bg-white">${SportsUI.segmentedControl('gender',['남','여'])}</div>
      ${SportsUI.inputRow('소속(학교/클럽)','school','예: 해온초 5학년')}
      ${SportsUI.inputRow('종목 및 포지션','sport','예: 축구/공격수')}
      ${SportsUI.inputRow('정규 훈련','trainingRegular','주 O회 / 총 O시간')}
      ${SportsUI.inputRow('개인 레슨','trainingPersonal','주 O회 / 총 O시간')}
      ${SportsUI.inputRow('최근 6개월 키 변화','heightChange','0','number','cm')}
      ${SportsUI.inputRow('최근 6개월 체중 변화','weightChange','0','number','kg')}
    `)}
    ${SportsUI.subhead('주소증(병원을 방문하게 된 가장 주된 불편한 이유, 증상)')}
    ${SportsUI.textarea('chiefComplaint','예: 요즘 키 성장이 멈춘 것 같아 걱정입니다.')}
  `},
  3:{ navTitle:'운동능력·컨디션', html:()=>`
    ${SportsUI.header('기초 운동 능력 자가 진단')}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      ${SportsUI.abilityRow('지구력(지속력)','abilityEndurance')}
      ${SportsUI.abilityRow('근력(파워)','abilityStrength')}
      ${SportsUI.abilityRow('스피드(최고 속도)','abilitySpeed')}
      ${SportsUI.abilityRow('민첩성','abilityAgility')}
      ${SportsUI.abilityRow('유연성','abilityFlexibility')}
      ${SportsUI.abilityRow('평형성(밸런스)','abilityBalance')}
    </div>
    ${SportsUI.header('컨디션 & 생활습관 (최근 1주일 기준)')}
    ${SportsUI.subhead('에너지 & 영양')}
    ${SportsUI.group(SportsUI.checkGrid(SPORTS_OPT_ENERGY,'energyNutrition'))}
    ${SportsUI.subhead('회복 & 수면')}
    ${SportsUI.group(SportsUI.checkGrid(SPORTS_OPT_SLEEP,'recoverySleep'))}
    ${SportsUI.subhead('면역 & 부상')}
    ${SportsUI.group(SportsUI.checkGrid(SPORTS_OPT_IMMUNITY,'immunityInjury'))}
    ${SportsUI.subhead('멘탈리티')}
    ${SportsUI.group(SportsUI.checkGrid(SPORTS_OPT_MENTAL_COND,'mentalityFocus'))}
  `},
  4:{ navTitle:'상세 증상', html:()=>`
    ${SportsUI.header('성장 발달')}
    ${SportsUI.group(SportsUI.checkGrid(SPORTS_OPT_GROWTH_SELF,'growthSelfCheck'))}
    ${SportsUI.subhead('영양/운동 요인')}
    ${SportsUI.group(SportsUI.checkGrid(SPORTS_OPT_GROWTH_NUTR,'growthNutrition'))}

    ${SportsUI.header('스포츠 손상')}
    ${SportsUI.subhead('통증 부위 (다중 선택)')}
    ${SportsUI.group(SportsUI.checkGrid(SPORTS_OPT_PAIN_LOC,'painLocation'))}
    ${SportsUI.subhead('통증 시기 & 현재 단계')}
    ${SportsUI.group(`
      ${SportsUI.selectRow('발생 시기','painOnset',['1주일 이내','1개월 전','3개월 전','6개월 이상'])}
      ${SportsUI.selectRow('현재 운동 단계','activityLevel',['완전 휴식','가벼운 활동','개인 훈련','팀 훈련 복귀','정상 훈련'])}
    `)}

    ${SportsUI.header('멘탈리티 (상세)')}
    ${SportsUI.group(SportsUI.checkGrid(SPORTS_OPT_PERF_FOCUS,'perfFocus'))}

    ${SportsUI.header('면역 / 알레르기')}
    ${SportsUI.group(SportsUI.checkGrid(SPORTS_OPT_IMM_RESP,'immRespiratory'))}

    ${SportsUI.header('보호자 확인')}
    ${SportsUI.group(SportsUI.inputRow('보호자 성함','guardianName','이름 입력'))}
    <p class="text-[13px] font-medium text-[#8E8E93] text-center mt-6">입력하신 정보는 안전하게 보호되며 진료 목적으로만 사용됩니다.</p>
  `}
};

function sportsRenderProgress(){
  const fill=document.getElementById('sports-progress-fill');
  const pct = sportsCurrentStep<=1 ? 0 : ((sportsCurrentStep-1)/sportsTotalSteps)*100;
  fill.style.width=pct+'%';
}
function refreshSportsStep(){
  if(sportsCurrentStep===1) return;
  const container=document.getElementById('sports-dynamic-container');
  container.innerHTML = sportsSections[sportsCurrentStep].html();
  if(window.lucide) lucide.createIcons();
  sportsRenderProgress();
}
window.sportsUpdateUI = function(){
  triggerFadeIn(document.getElementById('sports-dynamic-container'));
  document.querySelectorAll('.sports-step-content').forEach(s=>s.classList.remove('active'));
  const bottomAction=document.getElementById('sports-bottom-action'), nextBtn=document.getElementById('sports-next-btn'),
        backLabel=document.getElementById('sports-btn-back-label'), navTitle=document.getElementById('sports-nav-title'),
        scrollContainer=document.getElementById('sports-scroll-container');
  if(sportsCurrentStep===1){
    document.getElementById('sports-step-1').classList.add('active');
    bottomAction.classList.add('hidden'); backLabel.innerText='메인으로'; navTitle.innerText='소개';
  } else {
    const config=sportsSections[sportsCurrentStep];
    const container=document.getElementById('sports-dynamic-container');
    container.innerHTML=config.html(); container.classList.add('active');
    bottomAction.classList.remove('hidden'); backLabel.innerText='이전'; navTitle.innerText=config.navTitle;
    nextBtn.innerText = (sportsCurrentStep===sportsTotalSteps) ? '작성 완료하기' : '다음 단계';
  }
  sportsRenderProgress(); if(window.lucide) lucide.createIcons();
  if(scrollContainer) scrollContainer.scrollTo(0,0);
};
window.sportsNextStep = function(){
  if(sportsCurrentStep<sportsTotalSteps){ sportsCurrentStep++; sportsUpdateUI(); }
  else { saveSportsRecordToSheet(); document.getElementById('sports-app-shell').style.display='none'; showCompletion(); }
};
window.sportsPrevStep = function(){ if(sportsCurrentStep>1){ sportsCurrentStep--; sportsUpdateUI(); } else { document.getElementById('sports-app-shell').style.display='none'; returnToHub(); } };
window.enterSportsSurvey = function(){
  document.getElementById('hub-view').style.display='none';
  const shell=document.getElementById('sports-app-shell'); shell.style.display='flex'; triggerFadeIn(shell);
  sportsCurrentStep=1; sportsUpdateUI();
};
window.sportsBackToForm = function(){
  document.getElementById('sports-report-view').classList.remove('active');
  if(sportsCameFromSearch){
    sportsCameFromSearch=false;
    document.getElementById('search-view').style.display='flex';
  } else {
    document.getElementById('sports-app-shell').style.display='flex';
    sportsCurrentStep=sportsTotalSteps; sportsUpdateUI();
  }
};

function generateSportsReportAndShow(skipSave){
  const f=sportsFormData, todayStr=new Date().toLocaleDateString('ko-KR');
  document.title = `${(f.name||'이름미상').replace(/\s+/g,'')}_유소년스포츠_${new Date().toISOString().slice(0,10).replace(/-/g,'')}`;

  document.getElementById('sports-rp-name').innerText=f.name||'미입력';
  document.getElementById('sports-rp-dob').innerText=`${f.gender} / ${f.dob||'미입력'}`;
  document.getElementById('sports-rp-sport').innerText=`${f.school||'-'} / ${f.sport||'-'}`;
  document.getElementById('sports-rp-growth').innerText=`키 ${f.heightChange||'0'}cm / 체중 ${f.weightChange||'0'}kg`;
  document.getElementById('sports-rp-date').innerText=todayStr;
  document.getElementById('sports-rp-complaint').innerText=f.chiefComplaint||'특이 요청사항 없음';
  document.getElementById('sports-rp-footer-1').innerText=`측정일: ${todayStr}`;
  document.getElementById('sports-rp-footer-2').innerText=`측정일: ${todayStr}`;

  document.getElementById('sports-rp-training').innerHTML = `
    <div class="mb-1.5">• 정규 훈련: ${f.trainingRegular||'-'}</div>
    <div>• 개인 레슨: ${f.trainingPersonal||'-'}</div>`;

  const abilities = [['지구력',f.abilityEndurance],['근력',f.abilityStrength],['스피드',f.abilitySpeed],['민첩성',f.abilityAgility],['유연성',f.abilityFlexibility],['평형성',f.abilityBalance]];
  document.getElementById('sports-rp-ability').innerHTML = abilities.map(([k,v])=>`<div class="rp-organ-row"><span>${k}</span><span style="font-weight:700">${v||'-'}</span></div>`).join('');

  document.getElementById('sports-rp-condition').innerHTML = `
    <div class="mb-1.5">• 에너지/영양: ${f.energyNutrition.length?f.energyNutrition.join(', '):'해당 없음'}</div>
    <div class="mb-1.5">• 회복/수면: ${f.recoverySleep.length?f.recoverySleep.join(', '):'해당 없음'}</div>
    <div class="mb-1.5">• 면역/부상: ${f.immunityInjury.length?f.immunityInjury.join(', '):'해당 없음'}</div>
    <div>• 멘탈/집중력: ${f.mentalityFocus.length?f.mentalityFocus.join(', '):'해당 없음'}</div>`;

  document.getElementById('sports-rp-growthdetail').innerHTML = `
    <div class="mb-1.5">• 자각 증상: ${f.growthSelfCheck.length?f.growthSelfCheck.join(', '):'해당 없음'}</div>
    <div>• 영양/운동 요인: ${f.growthNutrition.length?f.growthNutrition.join(', '):'해당 없음'}</div>`;

  document.getElementById('sports-rp-injury').innerHTML = `
    <div class="mb-1.5">• 통증 부위: ${f.painLocation.length?f.painLocation.join(', '):'해당 없음'}</div>
    <div>• 발생 시기: ${f.painOnset||'-'} · 현재 단계: ${f.activityLevel||'-'}</div>`;

  document.getElementById('sports-rp-mental').innerHTML = f.perfFocus.length ? f.perfFocus.map(v=>`<div class="mb-1">• ${v}</div>`).join('') : '<div>해당 없음</div>';
  document.getElementById('sports-rp-immune').innerHTML = f.immRespiratory.length ? f.immRespiratory.map(v=>`<div class="mb-1">• ${v}</div>`).join('') : '<div>해당 없음</div>';
  document.getElementById('sports-rp-guardian').innerText = f.guardianName||'미입력';

  document.getElementById('sports-app-shell').style.display='none';
  const _rv=document.getElementById('sports-report-view'); _rv.classList.add('active'); triggerFadeIn(_rv.querySelector('.report-scroll'));
  if(window.lucide) lucide.createIcons();
  const statusEl=document.getElementById('sports-save-status'); if(statusEl) statusEl.innerText='';
    document.getElementById('sports-rp-doctor-note-slot').innerHTML = doctorNoteBoxHtml('sports-rp');
  document.getElementById('sports-rp-private-note-slot').innerHTML = privateNoteBoxHtml('sports-rp');
  fillNoteBoxes('sports-rp');
  if(window.lucide) lucide.createIcons();
if(!skipSave) saveSportsRecordToSheet();
}

function saveSportsRecordToSheet(){
  const statusEl=document.getElementById('sports-save-status');
  if(!isSheetConfigured()){ if(statusEl) statusEl.innerText='저장소 미설정'; return; }
  if(statusEl) statusEl.innerText='저장 중...';
  const payload = { category:'유소년스포츠', name: sportsFormData.name, birthDate: sportsFormData.dob, gender: sportsFormData.gender, ageGroup:'', formData: sportsFormData };
  fetch(CONFIG.SHEET_URL, { method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(payload) })
    .then(()=>{ if(statusEl) statusEl.innerText='저장 요청 완료 ✓'; })
    .catch((err)=>{ console.error('저장 실패:',err); if(statusEl) statusEl.innerText='저장 실패 - 설정을 확인해 주세요'; });
}

