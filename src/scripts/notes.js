/* ===================== 주치의 치료플랜 / 프리노트 (공통) ===================== */
function doctorNoteBoxHtml(prefix){
  return `<div class="rp-card rp-soft" style="border:1px dashed #fc582b66;">
    <div class="rp-section-title emr-plan-heading"><div class="emr-plan-label"><i data-lucide="stethoscope" class="w-4 h-4 text-[#fc582b]"></i>주치의 치료플랜 <span class="text-[10px] font-normal text-[#8E8E93]">(환자에게 나가는 안내 · 수정 가능)</span></div><div class="emr-plan-tools no-print"><button type="button" onclick="PlanPicker.open('${prefix}','treatment')">＋ 치료방법</button><button type="button" onclick="PlanPicker.open('${prefix}','prescription')">＋ 기초한약</button></div></div>
    <textarea id="${prefix}-doctor-note" class="w-full h-20 text-[13px] text-[#3C3C43] outline-none resize-none bg-transparent" placeholder="환자분께 전달할 안내 말씀을 입력해 주세요."></textarea>
    <div class="flex justify-between items-center mt-1">
      <span id="${prefix}-doctor-note-toast" class="text-[11px] font-bold opacity-0" style="transition:opacity .3s;">저장완료</span>
      <button hidden data-note-retry onclick="saveNote('${prefix}','doctorNote')" class="text-[11px] font-bold text-[#fc582b] px-2 py-1 active:opacity-60">다시 저장</button>
      ${noteCopyButtonHtml(prefix,'doctorNote')}
    </div>
  </div>`;
}
function privateNoteBoxHtml(prefix){
  return `<div class="rp-card" style="background:#FFFBEA;border:1px dashed #d9770699;">
    <div class="rp-section-title"><i data-lucide="lock" class="w-4 h-4 text-amber-600"></i>프리노트 <span class="text-[10px] font-normal text-[#8E8E93]">(의료진 전용 · 환자에게 노출되지 않음)</span></div>
    <textarea id="${prefix}-private-note" class="w-full h-20 text-[13px] text-[#3C3C43] outline-none resize-none bg-transparent" placeholder="진료에 참고할 메모를 남겨 주세요."></textarea>
    <div class="flex justify-between items-center mt-1">
      <span id="${prefix}-private-note-toast" class="text-[11px] font-bold opacity-0" style="transition:opacity .3s;">저장완료</span>
      <button hidden data-note-retry onclick="saveNote('${prefix}','privateNote')" class="text-[11px] font-bold text-amber-700 px-2 py-1 active:opacity-60">다시 저장</button>
      ${noteCopyButtonHtml(prefix,'privateNote')}
    </div>
  </div>`;
}
function interpretationNoteBoxHtml(prefix){
  return `<div class="rp-card">
    <div class="rp-section-title">간호사 메모 <span class="text-[12px] font-normal text-slate-500">(의료진 공유 · 인쇄 제외)</span></div>
    <textarea id="${prefix}-interpretation-note" class="w-full" aria-label="간호사 메모" placeholder="간호 기록과 전달 사항을 입력해 주세요."></textarea>
    <div class="flex justify-between items-center mt-1">
      <span id="${prefix}-interpretation-note-toast" class="text-[11px] opacity-0" role="status"></span>
      <button hidden data-note-retry onclick="saveNote('${prefix}','interpretationNote')">다시 저장</button>
      ${noteCopyButtonHtml(prefix,'interpretationNote')}
    </div>
  </div>`;
}
const EMR_NOTE_SUFFIX={doctorNote:'doctor-note',privateNote:'private-note',interpretationNote:'interpretation-note'};
window._currentRecordTs = null;
window._currentRecordName = '';
window._currentDoctorNote = '';
window._currentPrivateNote = '';
window._currentInterpretationNote = '';
window._currentRecordCategory = '';
function fillNoteBoxes(prefix){
  const d = document.getElementById(`${prefix}-doctor-note`);
  const p = document.getElementById(`${prefix}-private-note`);
  if(d) d.value = window._currentDoctorNote || '';
  if(p) p.value = window._currentPrivateNote || '';
  mountEmrWorkspace(prefix);
  EmrNoteAutosave.bind(prefix);
}
// One queue per exact record and field; callbacks never use a later selection.
const EmrNoteAutosave=(()=>{
  const states=new Map(), globals={doctorNote:'_currentDoctorNote',privateNote:'_currentPrivateNote',interpretationNote:'_currentInterpretationNote'};
  function status(state,message,error=false){
    if(state.element?._noteState!==state||!state.element.isConnected)return;
    const retry=state.element.parentElement?.querySelector('[data-note-retry]');if(retry)retry.hidden=!error;
    const toast=document.getElementById(state.element.id+'-toast');
    if(toast){toast.textContent=message;toast.style.opacity='1';toast.style.color=error?'#dc2626':'#64748b';toast.setAttribute('role','status');}
  }
  function pending(){return [...states.values()].some(s=>s.running||s.value!==s.saved);}
  function commit(state){
    clearTimeout(state.timer);
    if(state.running)return state.running;
    if(state.value===state.saved)return Promise.resolve(true);
    state.running=(async()=>{
      while(state.value!==state.saved){
        const value=state.value;status(state,'자동 저장 중…');
        try{
          // Firebase resolves only after its transaction has committed.
          const response=await emrStoreRequest(CONFIG.STORE_URL,{method:'POST',body:JSON.stringify({...state.target,type:'updateNote',field:state.field,value})});
          const result=await response.json();if(!result.ok)throw Error('Save failed');
          state.saved=value;
          for(const patient of window._patients||[])for(const record of patient.records||[])if(record.id===state.target.recordId)record[state.field]=value;
          if(window._currentRecordId===state.target.recordId)window[globals[state.field]]=value;
        }catch(error){status(state,'저장 실패 · 연결 확인 후 다시 저장',true);return false;}
      }
      status(state,'자동 저장 완료');return true;
    })().finally(()=>{state.running=null;});
    return state.running;
  }
  function schedule(state){
    state.value=state.element.value;clearTimeout(state.timer);
    status(state,state.value===state.saved?'자동 저장 완료':'저장 대기 중…');
    if(!state.composing)state.timer=setTimeout(()=>commit(state),600);
  }
  function bind(prefix){
    for(const [field,suffix] of Object.entries(EMR_NOTE_SUFFIX)){
      const element=document.getElementById(prefix+'-'+suffix);if(!element)continue;
      if(!window._currentRecordId||!window._currentRecordTs){element.oninput=null;element._noteState=null;continue;}
      const key=window._currentRecordId+':'+field;
      let state=states.get(key);
      if(!state){state={field,target:{recordId:window._currentRecordId,ts:window._currentRecordTs,name:window._currentRecordName,category:window._currentRecordCategory},saved:element.value,value:element.value};states.set(key,state);}
      else if(!state.running&&state.value===state.saved){state.saved=element.value;state.value=element.value;}
      state.element=element;element._noteState=state;element.value=state.value;
      element.oninput=()=>schedule(state);
      element.oncompositionstart=()=>{state.composing=true;clearTimeout(state.timer);};
      element.oncompositionend=()=>{state.composing=false;schedule(state);};
      element.onblur=()=>{state.composing=false;state.value=element.value;commit(state);};
      status(state,state.value===state.saved?'자동 저장':'저장 대기 중…');
    }
  }
  async function flush(){
    // Recheck after awaits so typing during a pending write is also committed.
    do{const results=await Promise.all([...states.values()].map(commit));if(results.some(ok=>!ok))return false;}while(pending());
    return true;
  }
  window.addEventListener('beforeunload',event=>{if(pending()){event.preventDefault();event.returnValue='';}});
  window.addEventListener('online',()=>{flush();});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flush();});
  return {bind,flush,pending,save(prefix,field){const element=document.getElementById(prefix+'-'+EMR_NOTE_SUFFIX[field]);const state=element?._noteState;if(!state)return Promise.resolve(false);state.value=element.value;return commit(state);}};
})();
window.saveNote=(prefix,field)=>EmrNoteAutosave.save(prefix,field);

function noteCopyButtonHtml(prefix,field){
 const labels={privateNote:'프리노트',interpretationNote:'간호사 메모',doctorNote:'주치의 치료플랜'};
 return `<span class="emr-note-copy"><button type="button" onclick="copyEmrNote('${prefix}','${field}')" aria-label="${labels[field]} 복사하기">복사하기</button><span id="${prefix}-${EMR_NOTE_SUFFIX[field]}-copy-status" role="status"></span></span>`;
}
window.copyEmrNote=async function(prefix,field){
 if(!EMR_NOTE_SUFFIX[field])return;
 const input=document.getElementById(prefix+'-'+EMR_NOTE_SUFFIX[field]);
 const status=document.getElementById(prefix+'-'+EMR_NOTE_SUFFIX[field]+'-copy-status');
 if(!input||!status)return;
 const text=input.value,recordId=window._currentRecordId||'';
 if(!text){status.textContent='복사할 내용이 없습니다.';return;}
 if(!await EmrAudit.record('copy_request',recordId,field))return;
 try{await navigator.clipboard.writeText(text);status.textContent='복사했습니다.';EmrAudit.record('copy_success',recordId,field);}
 catch{
  await EmrAudit.record('copy_manual',recordId,field);
  let dialog=document.getElementById('emr-note-copy-dialog');
  if(!dialog){
   dialog=document.createElement('dialog');dialog.id='emr-note-copy-dialog';dialog.className='survey-copy-dialog no-print';dialog.setAttribute('aria-labelledby','emr-note-copy-title');
   const heading=document.createElement('h2');heading.id='emr-note-copy-title';heading.textContent='메모 복사';
   const help=document.createElement('p');help.textContent='자동 복사를 사용할 수 없습니다. 아래 내용을 선택해 복사해 주세요.';
   const area=document.createElement('textarea');area.readOnly=true;area.setAttribute('aria-label','복사할 메모');
   const select=document.createElement('button');select.type='button';select.textContent='전체 선택';select.onclick=()=>{area.focus();area.select();};
   const close=document.createElement('button');close.type='button';close.textContent='닫기';close.onclick=()=>dialog.close();
   dialog.addEventListener('close',()=>{area.value='';});dialog.append(heading,help,area,select,close);document.body.append(dialog);
  }
  const area=dialog.querySelector('textarea');area.value=text;if(!dialog.open)dialog.showModal();area.focus();area.select();status.textContent='직접 선택해 복사해 주세요.';
 }
};
