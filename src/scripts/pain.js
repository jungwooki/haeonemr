/* ===================== 통증 모듈 ===================== */
let painCurrentStep = 1;
let painCameFromSearch = false;
const painTotalSteps = 4;
const painFormData = {
  name:'', birthDate:'', bodyMarkers:[], painAreaCenter:[], painAreaSide:[], painAreaDetail:'',
  painCause:[], painDurationNum:'', painDurationUnit:'개월',
  currentPainScale:'', maxPainScale:'', painFeel:[], painWorse:[], painBetter:[],
  otherSymptoms:[], womenHealth:[], disease:[], lifestyle:[], medication:''
};
window.updatePainData = function(key,val){ painFormData[key]=val; };
window.updatePainCheck = function(cat,val,checked){
  if(checked){ if(!painFormData[cat].includes(val)) painFormData[cat].push(val); }
  else{ painFormData[cat]=painFormData[cat].filter(i=>i!==val); }
};
window.setPainScale = function(field,val,btnEl){
  painFormData[field]=val;
  const parent=btnEl.parentElement;
  parent.querySelectorAll('button').forEach(b=>{ b.className="w-9 h-9 rounded-full font-bold text-[13px] bg-[#F2F2F7] text-[#8E8E93]"; });
  btnEl.className="w-9 h-9 rounded-full font-bold text-[13px] bg-[#fc582b] text-white";
};

/* ----- 신체지도 (앞면/뒷면 터치로 통증 부위 표시) ----- */
let painActiveBodyView = 'front';
window.setPainBodyView = function(view){
  painActiveBodyView = view;
  const wrap = document.getElementById('pain-bodymap-wrap');
  if(wrap) wrap.innerHTML = bodyMapSvgMarkup(view);
  renderPainBodyMarkers();
  const tabs = document.querySelectorAll('.pain-bodyview-tab');
  tabs.forEach(t=>{
    const isActive = t.dataset.view===view;
    t.className = `pain-bodyview-tab flex-1 py-2 text-[13px] rounded-[7px] transition-all duration-200 ${isActive?'font-bold bg-white shadow-[0_3px_8px_rgba(0,0,0,0.12)] text-[#fc582b]':'font-medium text-[#8E8E93]'}`;
  });
};
window.handlePainBodyMapClick = function(evt){
  const svg = document.getElementById('pain-bodymap-svg');
  const rect = svg.getBoundingClientRect();
  const x = ((evt.clientX - rect.left) / rect.width) * 100;
  const y = ((evt.clientY - rect.top) / rect.height) * 100;
  painFormData.bodyMarkers.push({ view: painActiveBodyView, x:x.toFixed(1), y:y.toFixed(1) });
  renderPainBodyMarkers();
};
window.removePainMarker = function(evt, idx){
  evt.stopPropagation();
  painFormData.bodyMarkers.splice(idx,1);
  renderPainBodyMarkers();
};
function renderPainBodyMarkers(){
  const layer = document.getElementById('pain-markers-layer');
  if(!layer) return;
  const indexed = painFormData.bodyMarkers.map((m,i)=>({...m,_i:i})).filter(m=>m.view===painActiveBodyView);
  layer.innerHTML = indexed.map(m=>`
    <div onclick="removePainMarker(event,${m._i})" style="position:absolute;left:${m.x}%;top:${m.y}%;width:20px;height:20px;margin:-10px 0 0 -10px;background:rgba(244,63,94,0.75);border:2px solid #fc582b;border-radius:50%;pointer-events:auto;cursor:pointer;"></div>
  `).join('');
}
function bodyMapSvgMarkup(view, layerId){
  const back = view==='back';
  const lid = layerId || 'pain-markers-layer';
  return `
  <svg id="pain-bodymap-svg" viewBox="0 0 200 400" style="width:100%;touch-action:none;cursor:crosshair;display:block;" onclick="handlePainBodyMapClick(event)">
    <circle cx="100" cy="28" r="22" fill="#F2F2F7" stroke="#C7C7CC" stroke-width="2"/>
    ${back ? '<line x1="100" y1="10" x2="100" y2="46" stroke="#C7C7CC" stroke-width="1.5"/>' : ''}
    <rect x="68" y="52" width="64" height="92" rx="18" fill="#F2F2F7" stroke="#C7C7CC" stroke-width="2"/>
    ${back ? '<line x1="100" y1="55" x2="100" y2="140" stroke="#C7C7CC" stroke-width="1.5"/>' : ''}
    <rect x="38" y="58" width="24" height="88" rx="11" fill="#F2F2F7" stroke="#C7C7CC" stroke-width="2"/>
    <rect x="138" y="58" width="24" height="88" rx="11" fill="#F2F2F7" stroke="#C7C7CC" stroke-width="2"/>
    <rect x="34" y="140" width="22" height="60" rx="10" fill="#F2F2F7" stroke="#C7C7CC" stroke-width="2"/>
    <rect x="144" y="140" width="22" height="60" rx="10" fill="#F2F2F7" stroke="#C7C7CC" stroke-width="2"/>
    <rect x="74" y="144" width="24" height="100" rx="11" fill="#F2F2F7" stroke="#C7C7CC" stroke-width="2"/>
    <rect x="102" y="144" width="24" height="100" rx="11" fill="#F2F2F7" stroke="#C7C7CC" stroke-width="2"/>
    <rect x="72" y="244" width="26" height="80" rx="9" fill="#F2F2F7" stroke="#C7C7CC" stroke-width="2"/>
    <rect x="102" y="244" width="26" height="80" rx="9" fill="#F2F2F7" stroke="#C7C7CC" stroke-width="2"/>
    <ellipse cx="85" cy="332" rx="15" ry="8" fill="#F2F2F7" stroke="#C7C7CC" stroke-width="2"/>
    <ellipse cx="115" cy="332" rx="15" ry="8" fill="#F2F2F7" stroke="#C7C7CC" stroke-width="2"/>
    <text x="60" y="145" font-size="9" fill="#8E8E93">${back?'좌':'우'}</text>
    <text x="132" y="145" font-size="9" fill="#8E8E93">${back?'우':'좌'}</text>
    <text x="86" y="24" font-size="10" font-weight="700" fill="#B0B0B5">${back?'뒷면':'앞면'}</text>
  </svg>
  <div id="${lid}" style="position:absolute;inset:0;pointer-events:none;"></div>`;
}
function scaleButtons(field){
  let html='<div class="flex flex-wrap gap-2">';
  for(let i=0;i<=10;i++){
    const active = painFormData[field]===String(i);
    html += `<button type="button" onclick="setPainScale('${field}','${i}',this)" class="w-9 h-9 rounded-full font-bold text-[13px] ${active?'bg-[#fc582b] text-white':'bg-[#F2F2F7] text-[#8E8E93]'}">${i}</button>`;
  }
  html += '</div>';
  return html;
}

const PainUI = {
  group:(c)=>`<div class="bg-white rounded-[10px] overflow-hidden border border-[#EDEEF1] w-full">${c}</div>`,
  inputRow:(label,field,placeholder,type="text",suffix="")=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white">
      <span class="text-[16px] font-semibold text-black">${label}</span>
      <div class="flex items-center gap-1">
        <input type="${type}" oninput="updatePainData('${field}', this.value)" value="${painFormData[field]}" class="text-right text-[16px] text-[#8E8E93] font-medium outline-none w-32 placeholder:text-gray-300 bg-transparent" placeholder="${placeholder}">
        ${suffix?`<span class="text-[#8E8E93] font-medium text-[15px]">${suffix}</span>`:''}
      </div>
    </div>`,
  dateRow:(label,field)=>`
    <div class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] last:border-0 bg-white">
      <span class="text-[16px] font-semibold text-black">${label}</span>
      <input type="date" onchange="updatePainData('${field}', this.value)" value="${painFormData[field]}" class="text-right text-[16px] text-[#8E8E93] font-medium outline-none bg-transparent">
    </div>`,
  selectInline:(field,options)=>`<select onchange="updatePainData('${field}', this.value)" class="text-[15px] font-semibold text-black outline-none bg-[#F2F2F7] rounded-[8px] px-3 py-2">${options.map(o=>`<option value="${o}" ${painFormData[field]===o?'selected':''}>${o} 전</option>`).join('')}</select>`,
  textarea:(field,placeholder)=>`
    <div class="bg-white rounded-[12px] p-5 shadow-sm border border-[#EDEEF1]">
      <textarea oninput="updatePainData('${field}', this.value)" class="w-full h-20 outline-none resize-none text-[16px] font-medium text-black placeholder:text-gray-300 bg-transparent" placeholder="${placeholder}">${painFormData[field]}</textarea>
    </div>`,
  checkRow:(label,category,value)=>`
    <label class="flex items-center justify-between p-3 px-4 border-b border-[#EDEEF1] bg-white cursor-pointer active:bg-gray-50 transition-colors">
      <span class="text-[15px] font-semibold text-black">${label}</span>
      <div class="relative flex items-center justify-center">
        <input type="checkbox" class="sr-only peer" onchange="updatePainCheck('${category}', '${value}', this.checked)" ${painFormData[category].includes(value)?'checked':''}>
        <i data-lucide="check" class="w-6 h-6 text-[#fc582b] opacity-0 peer-checked:opacity-100 transition-opacity duration-200"></i>
      </div>
    </label>`,
  checkGrid:(items,category)=>`<div class="md:grid md:grid-cols-2 md:divide-x md:divide-[#EDEEF1]">${items.map(v=>PainUI.checkRow(v,category,v)).join('')}</div>`,
  header:(t)=>`<h2 class="text-[26px] font-extrabold tracking-tight text-black mb-1.5 mt-5 px-2 first:mt-0">${t}</h2>`,
  subhead:(t)=>`<div class="text-[13px] font-bold text-[#8E8E93] uppercase tracking-wider mb-1.5 mt-4 px-4">${t}</div>`
};

const PAIN_OPT_SIDE = ['어깨(좌)','어깨(우)','팔/팔꿈치(좌)','팔/팔꿈치(우)','손/손목(좌)','손/손목(우)','골반/엉덩이(좌)','골반/엉덩이(우)','허벅지(좌)','허벅지(우)','무릎(좌)','무릎(우)','종아리(좌)','종아리(우)','발/발목(좌)','발/발목(우)'];
const PAIN_OPT_FEEL = ['쑤신다(뻐근함)','욱신거린다(맥박뛰듯)','찌른다(칼로베는듯)','저리다(전기오듯)','시리다(차가운느낌)','화끈거린다(뜨거운느낌)','무겁다(돌을얹은듯)','힘이 빠지는느낌'];
const PAIN_OPT_WORSE = ['가만히 있을 때','움직일 때','아침에 일어났을 때','밤에 잘 때','날씨가 흐리거나 추울 때','스트레스를 받을 때'];
const PAIN_OPT_BETTER = ['휴식을 취할 때','따뜻한 찜질을 할 때','차가운 찜질을 할 때','가볍게 움직여줄 때'];
const PAIN_OPT_SYMPTOMS = ['통증 부위가 붓는다','뻣뻣한 느낌이 든다','관절에서 소리가 난다','어지럼증이 있다','몸이 자주 붓는다(얼굴,손발)','손발이 차고 저린 편이다','소화가 잘 안된다/자주 체한다','속쓰림/변비/설사가 잦다','잠들기 어렵거나 자주 깬다','피로감을 자주 느끼고 늘 졸리다','감기,위염,장염에 자주 걸린다','불안하거나 우울감이 있다','두통이 잦다/식은땀을 흘린다','이명/기억력·집중력 저하','가슴 두근거림/답답함/숨참','소변이 불편하다(빈뇨/잔뇨/야간뇨)'];
const PAIN_OPT_WOMEN = ['임신 계획/중 또는 출산 3개월 이내','생리통이 심하다','생리 주기가 불규칙하다'];
const PAIN_OPT_DISEASE = ['고혈압','당뇨','심장/뇌혈관질환','간염(간기능장애)','신장질환','빈혈'];
const PAIN_OPT_LIFESTYLE = ['스트레스를 많이 받는 편이다','업무량이 너무 많다','과음이 잦은 편이다','흡연을 한다'];

const painSections = {
  2:{ navTitle:'통증 부위', html:()=>`
    ${PainUI.header('불편한 부위를 알려주세요')}
    ${PainUI.group(PainUI.inputRow('성함','name','이름 입력')+PainUI.dateRow('생년월일','birthDate'))}
    <p class="text-[14px] text-[#3C3C43] px-2 mb-2">아래 그림에서 <b class="text-[#fc582b]">아픈 부위를 터치</b>해 표시해 주세요. 앞면·뒷면을 각각 확인해 주시고, 잘못 눌렀다면 표시를 다시 누르면 지워집니다.</p>
    <div class="bg-white rounded-[12px] p-5 shadow-sm border border-[#EDEEF1]">
      <div class="flex bg-[#F2F2F7] rounded-[9px] p-[3px] w-full mb-4">
        <button type="button" data-view="front" onclick="setPainBodyView('front')" class="pain-bodyview-tab flex-1 py-2 text-[13px] rounded-[7px] font-bold bg-white shadow-[0_3px_8px_rgba(0,0,0,0.12)] text-[#fc582b]">앞면</button>
        <button type="button" data-view="back" onclick="setPainBodyView('back')" class="pain-bodyview-tab flex-1 py-2 text-[13px] rounded-[7px] font-medium text-[#8E8E93]">뒷면</button>
      </div>
      <div class="flex justify-center">
        <div id="pain-bodymap-wrap" style="position:relative;width:200px;">${bodyMapSvgMarkup('front')}</div>
      </div>
    </div>
    ${PainUI.subhead('척추 및 중앙 부위 (추가 선택)')}
    ${PainUI.group(PainUI.checkGrid(['목','등','허리'],'painAreaCenter'))}
    ${PainUI.subhead('좌/우 부위 (추가 선택)')}
    ${PainUI.group(PainUI.checkGrid(PAIN_OPT_SIDE,'painAreaSide'))}
    ${PainUI.group(PainUI.textarea('painAreaDetail','기타 부위나 방사통(뻗치는 통증)이 있다면 적어주세요'))}
  `},
  3:{ navTitle:'통증 상세', html:()=>`
    ${PainUI.header('통증이 어떻게 시작되었나요?')}
    ${PainUI.subhead('시작 계기 (다중 선택)')}
    ${PainUI.group(PainUI.checkGrid(['넘어지거나 다친 적이 있다','평소에 많이 사용한다','특별한 계기를 잘 모르겠다'],'painCause'))}
    ${PainUI.subhead('발생 시기')}
    ${PainUI.group(`<div class="flex items-center gap-3 p-3 px-4 bg-white">
      <input type="number" oninput="updatePainData('painDurationNum', this.value)" value="${painFormData.painDurationNum}" placeholder="숫자" class="w-24 p-3 text-center rounded-[8px] bg-[#F2F2F7] text-[16px] font-bold outline-none">
      ${PainUI.selectInline('painDurationUnit',['일','주','개월','년'])}
    </div>`)}
    ${PainUI.header('통증의 강도')}
    <p class="text-[13px] text-[#8E8E93] px-2 mb-2">0은 전혀 아프지 않은 상태, 10은 상상할 수 있는 가장 심한 통증입니다.</p>
    ${PainUI.group(`
      <div class="p-3 px-4 border-b border-[#EDEEF1]"><div class="text-[14px] font-bold text-black mb-2">현재 통증</div>${scaleButtons('currentPainScale')}</div>
      <div class="p-3 px-4"><div class="text-[14px] font-bold text-black mb-2">가장 심할 때 통증</div>${scaleButtons('maxPainScale')}</div>
    `)}
    ${PainUI.subhead('어떤 느낌의 통증인가요? (다중 선택)')}
    ${PainUI.group(PainUI.checkGrid(PAIN_OPT_FEEL,'painFeel'))}
    ${PainUI.subhead('이럴 때 더 아파요')}
    ${PainUI.group(PainUI.checkGrid(PAIN_OPT_WORSE,'painWorse'))}
    ${PainUI.subhead('이럴 때 편안해져요')}
    ${PainUI.group(PainUI.checkGrid(PAIN_OPT_BETTER,'painBetter'))}
  `},
  4:{ navTitle:'전신 상태', html:()=>`
    ${PainUI.header('동반 증상 및 전반적인 건강 상태')}
    ${PainUI.subhead('해당하는 증상 (다중 선택)')}
    ${PainUI.group(PainUI.checkGrid(PAIN_OPT_SYMPTOMS,'otherSymptoms'))}
    ${PainUI.subhead('여성 건강 (해당하는 분만)')}
    ${PainUI.group(PainUI.checkGrid(PAIN_OPT_WOMEN,'womenHealth'))}
    ${PainUI.header('기저질환 및 생활 습관')}
    ${PainUI.subhead('진단받은 적이 있는 질환')}
    ${PainUI.group(PainUI.checkGrid(PAIN_OPT_DISEASE,'disease'))}
    ${PainUI.subhead('생활 습관')}
    ${PainUI.group(PainUI.checkGrid(PAIN_OPT_LIFESTYLE,'lifestyle'))}
    ${PainUI.group(PainUI.inputRow('현재 복용 중인 약','medication','혈압약, 당뇨약, 영양제 등'))}
  `}
};

function painRenderProgress(){
  const fill=document.getElementById('pain-progress-fill');
  const pct = painCurrentStep<=1 ? 0 : ((painCurrentStep-1)/painTotalSteps)*100;
  fill.style.width=pct+'%';
}
function refreshPainStep(){
  if(painCurrentStep===1) return;
  const container=document.getElementById('pain-dynamic-container');
  container.innerHTML = painSections[painCurrentStep].html();
  if(window.lucide) lucide.createIcons();
  if(painCurrentStep===2) setPainBodyView(painActiveBodyView);
  painRenderProgress();
}
window.painUpdateUI = function(){
  triggerFadeIn(document.getElementById('pain-dynamic-container'));
  document.querySelectorAll('.pain-step-content').forEach(s=>s.classList.remove('active'));
  const bottomAction=document.getElementById('pain-bottom-action'), nextBtn=document.getElementById('pain-next-btn'),
        backLabel=document.getElementById('pain-btn-back-label'), navTitle=document.getElementById('pain-nav-title'),
        scrollContainer=document.getElementById('pain-scroll-container');
  if(painCurrentStep===1){
    document.getElementById('pain-step-1').classList.add('active');
    bottomAction.classList.add('hidden'); backLabel.innerText='메인으로'; navTitle.innerText='소개';
  } else {
    const config=painSections[painCurrentStep];
    const container=document.getElementById('pain-dynamic-container');
    container.innerHTML=config.html(); container.classList.add('active');
    bottomAction.classList.remove('hidden'); backLabel.innerText='이전'; navTitle.innerText=config.navTitle;
    nextBtn.innerText = (painCurrentStep===painTotalSteps) ? '작성 완료하기' : '다음 단계';
    if(painCurrentStep===2) setPainBodyView(painActiveBodyView);
  }
  painRenderProgress(); if(window.lucide) lucide.createIcons();
  if(scrollContainer) scrollContainer.scrollTo(0,0);
};
window.painNextStep = function(){
  if(painCurrentStep<painTotalSteps){ painCurrentStep++; painUpdateUI(); }
  else { savePainRecordToSheet(); document.getElementById('pain-app-shell').style.display='none'; showCompletion(); }
};
window.painPrevStep = function(){ if(painCurrentStep>1){ painCurrentStep--; painUpdateUI(); } else { document.getElementById('pain-app-shell').style.display='none'; returnToHub(); } };
window.enterPainSurvey = function(){
  document.getElementById('hub-view').style.display='none';
  const shell=document.getElementById('pain-app-shell'); shell.style.display='flex'; triggerFadeIn(shell);
  painCurrentStep=1; painActiveBodyView='front'; painUpdateUI();
};
window.painBackToForm = function(){
  document.getElementById('pain-report-view').classList.remove('active');
  if(painCameFromSearch){
    painCameFromSearch=false;
    document.getElementById('search-view').style.display='flex';
  } else {
    document.getElementById('pain-app-shell').style.display='flex';
    painCurrentStep=painTotalSteps; painUpdateUI();
  }
};

function generatePainReportAndShow(skipSave){
  const f=painFormData, todayStr=new Date().toLocaleDateString('ko-KR');
  document.title = `${(f.name||'이름미상').replace(/\s+/g,'')}_통증_${new Date().toISOString().slice(0,10).replace(/-/g,'')}`;

  document.getElementById('pain-rp-name').innerText=f.name||'미입력';
  document.getElementById('pain-rp-current').innerText=f.currentPainScale!==''?`${f.currentPainScale} / 10`:'-';
  document.getElementById('pain-rp-max').innerText=f.maxPainScale!==''?`${f.maxPainScale} / 10`:'-';
  document.getElementById('pain-rp-duration').innerText=f.painDurationNum?`${f.painDurationNum}${f.painDurationUnit} 전`:'-';
  document.getElementById('pain-rp-date').innerText=todayStr;
  document.getElementById('pain-rp-areadetail').innerText=f.painAreaDetail||'특이사항 없음';
  document.getElementById('pain-rp-footer-1').innerText=`측정일: ${todayStr}`;
  document.getElementById('pain-rp-footer-2').innerText=`측정일: ${todayStr}`;

  const frontWrap = document.getElementById('pain-rp-bodymap-front');
  const backWrap = document.getElementById('pain-rp-bodymap-back');
  frontWrap.innerHTML = bodyMapSvgMarkup('front', 'pain-rp-layer-front');
  backWrap.innerHTML = bodyMapSvgMarkup('back', 'pain-rp-layer-back');
  const frontMarkers = f.bodyMarkers.filter(m=>m.view==='front'||!m.view);
  const backMarkers = f.bodyMarkers.filter(m=>m.view==='back');
  frontWrap.querySelector('#pain-rp-layer-front').innerHTML = frontMarkers.map(m=>`<div style="position:absolute;left:${m.x}%;top:${m.y}%;width:16px;height:16px;margin:-8px 0 0 -8px;background:rgba(244,63,94,0.75);border:2px solid #fc582b;border-radius:50%;"></div>`).join('');
  backWrap.querySelector('#pain-rp-layer-back').innerHTML = backMarkers.map(m=>`<div style="position:absolute;left:${m.x}%;top:${m.y}%;width:16px;height:16px;margin:-8px 0 0 -8px;background:rgba(244,63,94,0.75);border:2px solid #fc582b;border-radius:50%;"></div>`).join('');

  const areas = [...f.painAreaCenter, ...f.painAreaSide];
  document.getElementById('pain-rp-areas').innerHTML = areas.length ? areas.map(a=>`<span class="rp-chip">${a}</span>`).join('') : '<span class="text-[12px] text-[#8E8E93]">체크된 부위 없음 (그림 표시만 있을 수 있음)</span>';

  document.getElementById('pain-rp-feature').innerHTML = `
    <div class="mb-1.5">• 시작 계기: ${f.painCause.length?f.painCause.join(', '):'-'}</div>
    <div class="mb-1.5">• 느낌: ${f.painFeel.length?f.painFeel.join(', '):'-'}</div>
    <div class="mb-1.5">• 악화 요인: ${f.painWorse.length?f.painWorse.join(', '):'-'}</div>
    <div>• 완화 요인: ${f.painBetter.length?f.painBetter.join(', '):'-'}</div>`;

  document.getElementById('pain-rp-symptoms').innerHTML = `
    <div class="mb-1.5">• 동반 증상: ${f.otherSymptoms.length?f.otherSymptoms.join(', '):'해당 없음'}</div>
    <div>• 여성 건강: ${f.womenHealth.length?f.womenHealth.join(', '):'해당 없음'}</div>`;

  document.getElementById('pain-rp-history').innerHTML = `
    <div class="mb-1.5">• 기저질환: ${f.disease.length?f.disease.join(', '):'해당 없음'}</div>
    <div class="mb-1.5">• 생활습관: ${f.lifestyle.length?f.lifestyle.join(', '):'해당 없음'}</div>
    <div>• 복용약: ${f.medication||'없음'}</div>`;

  document.getElementById('pain-app-shell').style.display='none';
  const _rv=document.getElementById('pain-report-view'); _rv.classList.add('active'); triggerFadeIn(_rv.querySelector('.report-scroll'));
  if(window.lucide) lucide.createIcons();
  const statusEl=document.getElementById('pain-save-status'); if(statusEl) statusEl.innerText='';
    document.getElementById('pain-rp-doctor-note-slot').innerHTML = doctorNoteBoxHtml('pain-rp');
  document.getElementById('pain-rp-private-note-slot').innerHTML = privateNoteBoxHtml('pain-rp');
  fillNoteBoxes('pain-rp');
  if(window.lucide) lucide.createIcons();
if(!skipSave) savePainRecordToSheet();
}

function savePainRecordToSheet(){
  const statusEl=document.getElementById('pain-save-status');
  if(!isSheetConfigured()){ if(statusEl) statusEl.innerText='저장소 미설정'; return; }
  if(statusEl) statusEl.innerText='저장 중...';
  const payload = { category:'통증', name: painFormData.name, birthDate: painFormData.birthDate, gender:'', ageGroup:'', formData: painFormData };
  fetch(CONFIG.SHEET_URL, { method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(payload) })
    .then(()=>{ if(statusEl) statusEl.innerText='저장 요청 완료 ✓'; })
    .catch((err)=>{ console.error('저장 실패:',err); if(statusEl) statusEl.innerText='저장 실패 - 설정을 확인해 주세요'; });
}

