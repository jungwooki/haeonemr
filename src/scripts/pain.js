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
window.handlePainBodyMapClick = function(evt, view){
  const rect = evt.currentTarget.getBoundingClientRect();
  const x = ((evt.clientX - rect.left) / rect.width) * 100;
  const y = ((evt.clientY - rect.top) / rect.height) * 100;
  if(y > 86) return;
  painFormData.bodyMarkers.push({ view, x:x.toFixed(1), y:y.toFixed(1) });
  renderPainBodyMarkers();
};
window.removePainMarker = function(evt, idx){
  evt.stopPropagation();
  painFormData.bodyMarkers.splice(idx,1);
  renderPainBodyMarkers();
};
function renderPainBodyMarkers(){
  ['front','back'].forEach(view=>{
    const layer = document.getElementById(`pain-markers-layer-${view}`);
    if(!layer) return;
    const indexed = painFormData.bodyMarkers.map((m,i)=>({...m,_i:i})).filter(m=>(m.view||'front')===view);
    layer.innerHTML = indexed.map(m=>`
      <button type="button" class="pain-marker" aria-label="${view==='front'?'앞면':'뒷면'} 통증 표시 ${m._i+1} 지우기" onclick="removePainMarker(event,${m._i})" style="left:${m.x}%;top:${m.y}%;"></button>
    `).join('');
  });
  const count=document.getElementById('pain-marker-count');
  if(count) count.textContent=`표시한 부위 ${painFormData.bodyMarkers.length}개`;
  const undo=document.getElementById('pain-marker-undo');
  if(undo) undo.disabled=painFormData.bodyMarkers.length===0;
}
window.undoPainMarker=function(){ painFormData.bodyMarkers.pop(); renderPainBodyMarkers(); };

function bodyMapSvgMarkup(view, layerId){
  const back = view==='back';
  const lid = layerId || `pain-markers-layer-${view}`;
  return `
  <svg id="${lid}-svg" viewBox="0 0 200 400" aria-label="신체 ${back?'뒷면':'앞면'}" style="width:100%;display:block;${layerId?'':'cursor:crosshair;'}" ${layerId?'':`onclick="handlePainBodyMapClick(event, '${view}')"`}>
    <g fill="#E8EEF4" stroke="#475569" stroke-width="2" stroke-linejoin="round">
      <path d="M100 6 C86 6 79 15 79 28 C79 40 86 49 92 50 L92 55 L77 58 C62 57 48 59 43 71 L37 116 L34 149 L30 177 Q28 192 35 199 L40 193 L43 201 Q49 203 52 193 L56 175 L57 146 L63 109 L68 83 L70 120 L67 145 Q65 162 71 183 L74 226 L72 249 Q69 277 75 309 L75 320 Q66 326 69 335 Q79 342 96 336 L98 326 L96 310 L98 268 L97 245 L100 181 L103 245 L102 268 L104 310 L102 326 L104 336 Q121 342 131 335 Q134 326 125 320 L125 309 Q131 277 128 249 L126 226 L129 183 Q135 162 133 145 L130 120 L132 83 L137 109 L143 146 L144 175 L148 193 Q151 203 157 201 L160 193 L165 199 Q172 192 170 177 L166 149 L163 116 L157 71 C152 59 138 57 123 58 L108 55 L108 50 C114 49 121 40 121 28 C121 15 114 6 100 6 Z"/>
    </g>
    <g fill="none" stroke="#64748B" stroke-width="1.5" stroke-linecap="round">
      ${back ? `
        <path d="M100 60 V143 M77 74 Q88 78 91 99 M123 74 Q112 78 109 99 M72 149 Q84 164 100 155 Q116 164 128 149 M100 155 V180 M77 243 Q85 248 94 243 M106 243 Q115 248 123 243"/>
      ` : `
        <path d="M87 25 H91 M109 25 H113 M96 38 Q100 41 104 38 M78 68 L96 74 M122 68 L104 74 M76 92 Q87 96 96 92 M104 92 Q113 96 124 92 M100 111 V115 M73 146 L97 164 M127 146 L103 164"/>
        <ellipse cx="85" cy="242" rx="8" ry="10"/><ellipse cx="115" cy="242" rx="8" ry="10"/>
      `}
      <path d="M38 139 L54 141 M146 141 L162 139 M76 317 L94 317 M106 317 L124 317"/>
    </g>
    <g font-size="20" font-weight="800" fill="#1C1C1E" text-anchor="middle" stroke="#FFFFFF" stroke-width="3" paint-order="stroke" pointer-events="none" aria-label="환자 본인 기준 좌우">
      <text x="32" y="224">${back?'왼쪽':'오른쪽'}</text>
      <text x="168" y="224">${back?'오른쪽':'왼쪽'}</text>
    </g>
    <g pointer-events="none" text-anchor="middle">
      <rect x="55" y="350" width="90" height="34" rx="8" fill="#1C1C1E"/>
      <text x="100" y="375" font-size="24" font-weight="800" fill="#FFFFFF">${back?'뒷면':'앞면'}</text>
      <text x="100" y="398" font-size="12" font-weight="700" fill="#3C3C43">좌우는 본인 몸 기준입니다</text>
    </g>
  </svg>
  <div id="${lid}" style="position:absolute;inset:0;pointer-events:none;"></div>`;
}
function scaleButtons(field){
  let html=`<div class="pain-scale" role="group" aria-label="${field==='currentPainScale'?'현재 통증 점수':'가장 심할 때 통증 점수'}">`;
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
  selectInline:(field,options)=>`<select aria-label="통증 발생 후 기간 단위" onchange="updatePainData('${field}', this.value)" class="text-[15px] font-semibold text-black outline-none bg-[#F2F2F7] rounded-[8px] px-3 py-2">${options.map(o=>`<option value="${o}" ${painFormData[field]===o?'selected':''}>${o} 전</option>`).join('')}</select>`,
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

const PAIN_OPT_SIDE = ['어깨(좌)','어깨(우)','팔/팔꿈치(좌)','팔/팔꿈치(우)','손/손목(좌)','손/손목(우)','골반/엉덩이(좌)','골반/엉덩이(우)','허벅지(좌)','허벅지(우)','무릎(좌)','무릎(우)','종아리(좌)','종아리(우)','발/발목/발바닥(좌)','발/발목/발바닥(우)'];
function painSidePicker(){
  return `<div class="pain-side-picker">${PAIN_OPT_SIDE.filter((_,index)=>index%2===0).map(left=>{
    const area=left.slice(0,-3);
    return `<div class="pain-side-row" role="group" aria-label="${area}">
      <span class="pain-side-name">${area}</span>
      ${['좌','우'].map(side=>{
        const value=area+'('+side+')';
        return `<label class="pain-side-choice">
          <input type="checkbox" class="sr-only" aria-label="${area} ${side==='좌'?'왼쪽':'오른쪽'}" onchange="updatePainCheck('painAreaSide','${value}',this.checked)" ${painFormData.painAreaSide.includes(value)?'checked':''}>
          <span>${side==='좌'?'좌':'우'}</span>
        </label>`;
      }).join('')}
    </div>`;
  }).join('')}</div>`;
}

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
    <p class="text-[14px] text-[#3C3C43] px-2 mb-2">아래 그림에서 <b class="text-[#fc582b]">아픈 부위를 터치</b>해 표시해 주세요. 앞면·뒷면을 각각 확인해 주시고, 잘못 눌렀다면 표시를 다시 누르거나 마지막 표시를 취소할 수 있습니다. 그림 대신 아래 부위 목록에서 선택해도 됩니다.</p>
    <div class="pain-map-tools"><span id="pain-marker-count" role="status" aria-live="polite">표시한 부위 0개</span><button id="pain-marker-undo" type="button" onclick="undoPainMarker()" disabled>마지막 표시 취소</button></div>
    <div class="bg-white rounded-[12px] p-2 shadow-sm border border-[#EDEEF1]">
      <p class="text-center text-[14px] font-bold text-[#3C3C43] mb-2">좌우는 본인 몸 기준입니다</p>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;max-width:440px;margin:0 auto;">
        <div id="pain-bodymap-front" style="position:relative;min-width:0;">${bodyMapSvgMarkup('front')}</div>
        <div id="pain-bodymap-back" style="position:relative;min-width:0;border-left:1px solid #E2E8F0;">${bodyMapSvgMarkup('back')}</div>
      </div>
    </div>
    ${PainUI.subhead('척추 및 중앙 부위 (추가 선택)')}
    ${PainUI.group(PainUI.checkGrid(['목','등','허리'],'painAreaCenter'))}
    ${PainUI.subhead('좌우 통증 부위 선택')}
    <p class="pain-side-help">본인 몸 기준으로 좌·우를 눌러 주세요. 양쪽과 여러 부위를 함께 선택할 수 있고, 다시 누르면 해제됩니다.</p>
    ${PainUI.group(painSidePicker())}
    ${PainUI.group(PainUI.textarea('painAreaDetail','기타 부위나 방사통(뻗치는 통증)이 있다면 적어주세요'))}
  `},
  3:{ navTitle:'통증 상세', html:()=>`
    ${PainUI.header('통증이 어떻게 시작되었나요?')}
    ${PainUI.subhead('시작 계기 (다중 선택)')}
    ${PainUI.group(PainUI.checkGrid(['넘어지거나 다친 적이 있다','평소에 많이 사용한다','특별한 계기를 잘 모르겠다'],'painCause'))}
    ${PainUI.subhead('발생 시기')}
    ${PainUI.group(`<div class="flex items-center gap-3 p-3 px-4 bg-white">
      <input type="number" aria-label="통증 발생 후 기간" oninput="updatePainData('painDurationNum', this.value)" value="${painFormData.painDurationNum}" placeholder="숫자" class="w-24 p-3 text-center rounded-[8px] bg-[#F2F2F7] text-[16px] font-bold outline-none">
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
  SurveyUX.sync('pain-',painCurrentStep,painTotalSteps);
}
function refreshPainStep(){
  if(painCurrentStep===1) return;
  const container=document.getElementById('pain-dynamic-container');
  container.innerHTML = painSections[painCurrentStep].html();
  if(window.lucide) lucide.createIcons();
  if(painCurrentStep===2) renderPainBodyMarkers();
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
    if(painCurrentStep===2) renderPainBodyMarkers();
  }
  painRenderProgress(); if(window.lucide) lucide.createIcons();
  if(scrollContainer) scrollContainer.scrollTo(0,0);
};
window.painNextStep = function(){ if(!SurveyUX.canAdvance('pain-',painCurrentStep)) return;
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
