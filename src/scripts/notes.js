/* ===================== 주치의 안내 / 프리노트 (공통) ===================== */
function doctorNoteBoxHtml(prefix){
  return `<div class="rp-card rp-soft" style="border:1px dashed #fc582b66;">
    <div class="rp-section-title"><i data-lucide="stethoscope" class="w-4 h-4 text-[#fc582b]"></i>주치의 안내 <span class="text-[10px] font-normal text-[#8E8E93]">(환자에게 보이는 안내 · 직접 수정 가능)</span></div>
    <textarea id="${prefix}-doctor-note" class="w-full h-20 text-[13px] text-[#3C3C43] outline-none resize-none bg-transparent" placeholder="환자분께 전달할 안내 말씀을 입력해 주세요."></textarea>
    <div class="flex justify-between items-center mt-1">
      <span id="${prefix}-doctor-note-toast" class="text-[11px] font-bold opacity-0" style="transition:opacity .3s;">저장완료</span>
      <button onclick="saveNote('${prefix}','doctorNote')" class="text-[11px] font-bold text-[#fc582b] px-2 py-1 active:opacity-60">저장</button>
    </div>
  </div>`;
}
function privateNoteBoxHtml(prefix){
  return `<div class="rp-card" style="background:#FFFBEA;border:1px dashed #d9770699;">
    <div class="rp-section-title"><i data-lucide="lock" class="w-4 h-4 text-amber-600"></i>프리노트 <span class="text-[10px] font-normal text-[#8E8E93]">(한의사 전용 · 환자에게 노출되지 않음)</span></div>
    <textarea id="${prefix}-private-note" class="w-full h-20 text-[13px] text-[#3C3C43] outline-none resize-none bg-transparent" placeholder="원장님만 보는 참고 메모를 남겨보세요."></textarea>
    <div class="flex justify-between items-center mt-1">
      <span id="${prefix}-private-note-toast" class="text-[11px] font-bold opacity-0" style="transition:opacity .3s;">저장완료</span>
      <button onclick="saveNote('${prefix}','privateNote')" class="text-[11px] font-bold text-amber-700 px-2 py-1 active:opacity-60">저장</button>
    </div>
  </div>`;
}
function interpretationNoteBoxHtml(prefix){
  return `<div class="rp-card">
    <div class="rp-section-title">판독결과 메모 <span class="text-[12px] font-normal text-slate-500">(진료 참고용 · 인쇄 제외)</span></div>
    <textarea id="${prefix}-interpretation-note" class="w-full" aria-label="판독결과 메모" placeholder="검사 및 이미지 판독 내용을 기록해 주세요."></textarea>
    <div class="flex justify-between items-center mt-1">
      <span id="${prefix}-interpretation-note-toast" class="text-[11px] opacity-0" role="status"></span>
      <button onclick="saveNote('${prefix}','interpretationNote')">저장</button>
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
}
function showNoteToast(prefix, field, ok, message){
  const idSuffix = EMR_NOTE_SUFFIX[field];
  const toast = document.getElementById(`${prefix}-${idSuffix}-toast`);
  if(!toast) return;
  toast.style.color = ok ? '#16a34a' : '#dc2626';
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(()=>{ toast.style.opacity='0'; }, ok ? 1800 : 3200);
}
window.saveNote = async function(prefix, field){
  if(!EMR_NOTE_SUFFIX[field]) return;
  const idSuffix = EMR_NOTE_SUFFIX[field];
  const ta = document.getElementById(`${prefix}-${idSuffix}`);
  if(!ta) return;
  const value = ta.value;
  if(!window._currentRecordTs){
    showNoteToast(prefix, field, false, '결과검색에서 불러온 기록에서만 저장 가능');
    return;
  }
  if(!isSheetConfigured()){ showNoteToast(prefix, field, false, '저장소 미설정'); return; }
  const ts = window._currentRecordTs, name = window._currentRecordName, category=window._currentRecordCategory;
  if(field==='interpretationNote'){
    try{
      const params=new URLSearchParams({type:'noteCapabilities',q:'__emr_note_probe__'});
      const json=await cachedEmrRead('noteCapabilities',async()=>{
        const response=await fetch(CONFIG.SHEET_URL+'?'+params,{signal:AbortSignal.timeout(15000)});
        const result=await response.json();
        if(result.protocol!=='haeon-notes-v2') throw new Error('Unsupported note server');
        return result;
      },{ttl:300000});
      if(json.protocol!=='haeon-notes-v2') throw new Error('판독 메모 저장을 위해 최신 Code.gs를 배포해 주세요.');
    }catch(error){showNoteToast(prefix,field,false,'판독 메모 저장을 위해 최신 Code.gs를 배포해 주세요.');return;}
  }
  showNoteToast(prefix, field, true, '저장 중...');
  // no-cors 응답은 실제 성공 여부를 알려주지 않으므로, 저장 후 다시 조회해서
  // 값이 실제로 반영됐는지 확인한 뒤에만 "저장완료"로 표시한다.
  return fetch(CONFIG.SHEET_URL, {
    method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'},
    body: JSON.stringify({ type:'updateNote', ts, name, category, field, value })
  })
  .then(()=> fetch(CONFIG.SHEET_URL+'?'+new URLSearchParams({type:'noteRead',q:name,ts,category,field}),{signal:AbortSignal.timeout(15000)}))
  .then(r=>r.json())
  .then(json=>{
    let verified = false;
    if(json && json.ok && json.patients){
      json.patients.forEach(p=>{
        if(p.name !== name) return;
        p.records.forEach(r=>{
          const rt = new Date(r.ts).getTime(), tt = new Date(ts).getTime();
          if(!isNaN(rt) && !isNaN(tt) && rt===tt && (!category||r.category===category)){
            const savedVal = r[field];
            if((savedVal||'') === value) verified = true;
          }
        });
      });
    }
    if(verified){
      if(window._currentRecordTs===ts&&window._currentRecordName===name&&window._currentRecordCategory===category){
        if(field==='doctorNote') window._currentDoctorNote=value;
        else if(field==='privateNote') window._currentPrivateNote=value;
        else window._currentInterpretationNote=value;
      }
      // 검색 목록 캐시(window._patients)에도 반영 - 뒤로가기 후 다시 열어도 최신 메모가 보이도록
      if(window._patients){
        window._patients.forEach(p=>{
          if(p.name !== name) return;
          p.records.forEach(r=>{
            const rt = new Date(r.ts).getTime(), tt = new Date(ts).getTime();
            if(!isNaN(rt) && !isNaN(tt) && rt===tt && (!category||r.category===category)){
              r[field] = value;
            }
          });
        });
      }
      showNoteToast(prefix, field, true, '저장완료');
    } else {
      showNoteToast(prefix, field, false, '저장 확인 실패 - 재시도해 주세요');
    }
  })
  .catch((err)=>{ console.error(err); showNoteToast(prefix, field, false, '저장 중 오류 발생'); });
};

