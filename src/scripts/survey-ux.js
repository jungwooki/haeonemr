/* Shared presentation and input affordances; no clinical scoring or storage. */
const SurveyUX = (() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
  function validBirth(value) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d=new Date(`${value}T12:00:00`);
    return !Number.isNaN(d.getTime()) && d.getFullYear()>0 &&
      `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`===value && value<=today();
  }
  const optionLabels={healthSelfAssess:'현재 건강 상태',stressLevel:'스트레스 정도',sleepQuality:'수면 상태',coldHeat:'추위와 더위',stool:'대변 상태',urine:'소변 상태',sweat:'땀',surgery:'수술 경험',periodCycle:'월경 주기',periodPain:'월경통',periodClots:'월경 혈괴',periodAmount:'월경량',periodFlow:'월경량',discharge:'분비물',maritalStatus:'결혼 여부',obesityTxHistory:'비만 치료 경험',deliveryMethod:'분만 방법',breastfeedingPlan:'수유 계획',breastMilkAmount:'모유량',immediateState:'출산 직후 상태',recoverySpeed:'회복 속도',surgeryHistory:'수술 경험',exercise:'운동'};
  function radioList(prefix,field,options,value,handler,label=optionLabels[field]||'하나 선택') {
    return `<div class="survey-radio-list" role="radiogroup" aria-label="${escape(label)}">${['stool','urine'].includes(field)?`<p class="survey-option-label">${escape(label)}</p>`:''}${options.map(option=>`<label class="survey-radio-row"><span>${escape(option)}</span><input type="radio" name="${escape(prefix+'-'+field)}" value="${escape(option)}" ${value===option?'checked':''} onchange="${handler}('${escape(field)}',this.value)"></label>`).join('')}</div>`;
  }
  function selectRow(prefix,label,field,options,value,handler) {
    if(options.length<=5) return `<fieldset class="survey-options"><legend>${escape(label)} <small>하나 선택</small></legend>${radioList(prefix,field,options,value,handler,label)}</fieldset>`;
    return `<label class="survey-field-row"><span>${escape(label)}</span><select onchange="${handler}('${escape(field)}',this.value)"><option value="">선택해 주세요</option>${options.map(o=>`<option value="${escape(o)}" ${value===o?'selected':''}>${escape(o)}</option>`).join('')}</select></label>`;
  }
  function fieldMessage(input) {
    if(input.type==='date' && input.value && !validBirth(input.value)) return '오늘 이전의 실제 날짜를 입력해 주세요.';
    if(input.validity.badInput) return input.type==='date'?'실제 날짜를 입력해 주세요.':'숫자를 입력해 주세요.';
    if(input.validity.rangeUnderflow) return '0 이상의 숫자를 입력해 주세요.';
    if(input.required && !input.value.trim()) return '필수 항목을 입력해 주세요.';
    return '';
  }
  function feedback(shell,showErrors=false) {
    const controls=[...shell.querySelectorAll('input:not([type="checkbox"]):not([type="radio"])')];
    let firstInvalid=null;
    controls.forEach(input=>{
      const message=fieldMessage(input);
      if(message&&!firstInvalid) firstInvalid=input;
      const error=document.getElementById(input.id+'-error');
      if(error) {
        const visible=Boolean(message&&(showErrors||input.dataset.touched));
        error.textContent=visible?message:''; error.hidden=!visible;
        input.setAttribute('aria-invalid',String(visible));
      }
    });
    const next=shell.querySelector('[id$="next-btn"]');
    if(next) next.disabled=Boolean(firstInvalid);
    const hint=shell.querySelector('.survey-action-hint');
    if(hint) hint.textContent=firstInvalid ? '필수 항목과 입력 형식을 확인해 주세요.' : '작성한 내용은 이전 단계에서 수정할 수 있습니다.';
    return firstInvalid;
  }
  function addClearButton(input) {
    if(input.type!=='text'||input.closest('.survey-input-wrap')) return;
    const wrap=document.createElement('span'); wrap.className='survey-input-wrap';
    input.before(wrap); wrap.append(input);
    const clear=document.createElement('button'); clear.type='button'; clear.className='survey-clear';
    clear.textContent='×';
    const label=document.getElementById(input.getAttribute('aria-labelledby'))?.textContent||input.labels?.[0]?.textContent||input.getAttribute('aria-label')||'입력 내용';
    clear.setAttribute('aria-label',label.trim()+' 지우기');
    wrap.append(clear);
    const update=()=>{clear.hidden=!input.value;};
    input.addEventListener('input',update);
    clear.addEventListener('click',()=>{
      input.value=''; input.dispatchEvent(new Event('input',{bubbles:true}));
      input.focus(); update();
    });
    update();
  }
  function enhance(shell) {
    shell.querySelectorAll('input:not([type="checkbox"]):not([type="radio"]),textarea,select').forEach((input,index)=>{
      if(input.dataset.uxReady) return;
      input.dataset.uxReady='true';
      input.id ||= shell.id+'-field-'+index;
      const handler=input.getAttribute('oninput')||input.getAttribute('onchange')||'';
      const field=handler.match(/\('([^']+)'/)?.[1]||'';
      const row=input.closest('.survey-field-row')||input.closest('div.flex.items-center.justify-between');
      const title=row?.querySelector(':scope > span');
      if(row) row.classList.add('survey-field-row');
      if(title) { title.id=input.id+'-label'; input.setAttribute('aria-labelledby',title.id); }
      else if(!input.labels?.length&&!input.hasAttribute('aria-label')) input.setAttribute('aria-label',input.placeholder||field||'추가 내용');
      if(input.tagName==='INPUT') {
        if(field==='name'||field==='birthDate'||field==='dob'||handler.includes('updateBirthDate(')) input.required=true;
        if(input.type==='date') { input.max=today(); if(input.required) input.autocomplete='bday'; }
        if(input.type==='number') {
          input.inputMode='decimal'; input.step='any';
          if(!/Change$/.test(field)) input.min='0';
        }
        input.enterKeyHint='next';
        if(field==='name') input.autocomplete='name';
        if(input.required && title) title.classList.add('survey-required');
        const error=document.createElement('small'); error.id=input.id+'-error'; error.className='survey-field-error'; error.hidden=true;
        (row||input.parentElement).append(error); input.setAttribute('aria-describedby',error.id);
        input.addEventListener('blur',()=>{input.dataset.touched='true'; feedback(shell);});
        addClearButton(input);
      }
    });
    shell.querySelectorAll('button[onclick^="set"]').forEach(button=>{
      const selected=button.classList.contains('font-bold')&&(button.classList.contains('bg-white')||button.classList.contains('text-white'));
      button.setAttribute('aria-pressed',String(selected));
      button.classList.add('survey-choice-button');
    });
    if(!shell.dataset.uxEvents) {
      shell.dataset.uxEvents='true';
      shell.addEventListener('input',()=>feedback(shell));
      shell.addEventListener('change',()=>feedback(shell));
      shell.addEventListener('click',e=>{
        if(e.target.closest('button[onclick^="set"]')) {
          enhance(shell);
        }
      });
    }
  }
  function sync(prefix,step,total) {
    const shell=document.getElementById(prefix+'app-shell');
    if(!shell) return;
    const count=total-1, position=Math.max(0,step-1);
    const fill=document.getElementById(prefix+'progress-fill');
    fill.style.width=`${position/count*100}%`;
    fill.parentElement.setAttribute('role','progressbar');
    fill.parentElement.setAttribute('aria-label','문진 단계');
    fill.parentElement.setAttribute('aria-valuemin','0');
    fill.parentElement.setAttribute('aria-valuemax',String(count));
    fill.parentElement.setAttribute('aria-valuenow',String(position));
    shell.querySelector('.survey-step-count').textContent=step===1?'문진 안내':`${position} / ${count} 단계`;
    const back=document.getElementById(prefix+'btn-back-label');
    back.textContent=step===1?'설문 목록':step===2?'문진 안내':'이전 단계';
    shell.dataset.step=String(step);
    enhance(shell); feedback(shell);
    const next=shell.querySelector('[id$="next-btn"]');
    next.textContent=step===total?'문진 제출하기':'다음 단계';
  }
  function canAdvance(prefix,step) {
    if(step===1) return true;
    const shell=document.getElementById(prefix+'app-shell');
    const invalid=feedback(shell,true);
    if(invalid) { invalid.focus(); invalid.scrollIntoView({block:'center'}); return false; }
    return true;
  }
  // VisualViewport follows the visible area when the tablet software keyboard opens.
  function resizeViewport() {
    const viewport=window.visualViewport;
    if(viewport && viewport.scale===1) {
      document.documentElement.style.setProperty('--survey-viewport-height',viewport.height+'px');
      document.documentElement.style.setProperty('--survey-viewport-top',viewport.offsetTop+'px');
    } else {
      document.documentElement.style.removeProperty('--survey-viewport-height');
      document.documentElement.style.removeProperty('--survey-viewport-top');
    }
  }
  window.visualViewport?.addEventListener('resize',resizeViewport);
  window.visualViewport?.addEventListener('scroll',resizeViewport);
  window.addEventListener('resize',resizeViewport); resizeViewport();
  return {sync,canAdvance,radioList,selectRow,validBirth,today,addClearButton};
})();
