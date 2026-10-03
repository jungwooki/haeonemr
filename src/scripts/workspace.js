/* Shared workspace keeps the original result nodes, charts and save handlers. */

async function emrCanNavigate(){
  const saved=await EmrNoteAutosave.flush();
  if(!saved)alert('메모를 저장하지 못했습니다. 연결을 확인한 후 다시 시도해 주세요. 입력 내용은 현재 화면에 유지됩니다.');
  return saved;
}
async function emrOpenRecord(patientIndex,recordIndex){
  if(!await emrCanNavigate()) return;
  const record=window._patients?.[patientIndex]?.records?.[recordIndex];
  if(!record) return;
  window._currentPatientIdx=patientIndex;
  viewPatientRecord(patientIndex,recordIndex);
}
function mountEmrWorkspace(prefix){
  const note=document.getElementById(prefix+'-doctor-note-slot');
  const view=note?.closest('[id$="report-view"]');
  if(!view) return;
  const columns=view.querySelector('.report-columns');
  const right=columns.querySelector('.report-col-right');
  let sidebar=columns.querySelector('.emr-sidebar');
  if(!sidebar){
    sidebar=document.createElement('aside');
    sidebar.className='emr-sidebar no-print';
    sidebar.setAttribute('aria-label','환자 및 문진 기록');
    sidebar.innerHTML='<div class="emr-patient-rail"><div class="clinical-list-heading"><h2>환자 목록</h2><span>PATIENTS</span></div><div class="clinical-patient-search"><input type="search" aria-label="결과 화면 환자 검색" placeholder="이름 또는 차트번호 검색"><span class="clinical-patient-count"></span></div><div class="emr-patients"></div></div><div class="emr-records" aria-label="문진 기록 탐색"></div>';
    columns.prepend(sidebar);
    sidebar.querySelector('input').addEventListener('input',event=>renderEmrPatients(sidebar,event.target.value));
    const notes=document.createElement('section');
    notes.className='emr-notes'; notes.setAttribute('aria-label','진료 메모');
    right.prepend(notes);
    // Keep editable notes on the clinician side; only a text mirror is printed.
    [document.getElementById(prefix+'-private-note-slot'),note].filter(Boolean).forEach(slot=>notes.append(slot));
    const interpretation=document.createElement('div');
    interpretation.id=prefix+'-interpretation-note-slot';
    interpretation.innerHTML=interpretationNoteBoxHtml(prefix);notes.append(interpretation);
    // Move existing result nodes, preserving all IDs, charts and rendering handlers.
    const left=columns.querySelector('.report-col-left');
    [...right.children].filter(child=>child!==notes).forEach(child=>{
      if(child.classList.contains('a4-page')) left.append(child);
      else{
        let appendix=left.querySelector('.emr-response-page');
        if(!appendix){appendix=document.createElement('div');appendix.className='a4-page emr-response-page';left.append(appendix);}
        appendix.append(child);
      }
    });
    const opinion=document.createElement('section');opinion.className='rp-card emr-doctor-opinion';
    const title=document.createElement('div');title.className='rp-section-title';title.textContent='주치의 치료플랜';
    const content=document.createElement('div');content.className='emr-opinion-text';
    opinion.append(title,content);left.append(opinion);
    view.addEventListener('input',event=>{
      if(event.target.id===prefix+'-doctor-note') syncEmrOpinion(prefix);
    });
  }
  document.getElementById(prefix+'-interpretation-note').value=window._currentInterpretationNote||'';
  syncEmrOpinion(prefix);
  renderEmrPatients(sidebar,clinicalPatientQuery);
  const records=sidebar.querySelector('.emr-records');
  records.replaceChildren();
  const patient=window._patients?.[window._currentPatientIdx];
  let imageHost=right.querySelector('.emr-report-image-host');
  if(!imageHost){imageHost=document.createElement('div');imageHost.className='emr-report-image-host no-print';right.querySelector('.emr-notes').after(imageHost);}
  imageHost.hidden=!CONFIG.STORAGE_ENABLED;
  const activeRecord=patient?.records.find(record=>record.id===window._currentRecordId);
  if(patient && activeRecord) mountEmrImages(imageHost,patient,activeRecord);else imageHost.replaceChildren();
  if(patient && window._currentRecordTs){
    renderClinicalHistory(records,patient,window._currentPatientIdx,{active:true});
  }
  decorateClinicalWorkspace(view, columns, right, patient);
}
function renderEmrPatients(sidebar,query=''){
  const list=sidebar.querySelector('.emr-patients');list.replaceChildren();
  const patients=window._currentRecordTs ? (window._patients||[]) : [];
  renderClinicalPatientRows(list,patients,query);
  if(!list.childElementCount){
    const empty=document.createElement('p');empty.className='emr-empty';
    empty.textContent=patients.length?'검색 결과가 없습니다.':'현재 문진 결과입니다. 환자 목록은 홈의 EMR에서 조회할 수 있습니다.';list.append(empty);
  }
}
// The report mirror is text, so long notes wrap and print without textarea clipping.
function syncEmrOpinion(prefix){
  const note=document.getElementById(prefix+'-doctor-note');
  const view=note?.closest('[id$="report-view"]');
  if(!view) return;
  const left=view.querySelector('.report-col-left');
  const opinion=left.querySelector('.emr-doctor-opinion');
  if(!opinion) return;
  const pages=[...left.querySelectorAll(':scope > .a4-page')].filter(page=>page.style.display!=='none'&&!page.hidden);
  const last=pages[pages.length-1];
  if(last) last.append(opinion);
  opinion.querySelector('.emr-opinion-text').textContent=note.value||'주치의 치료플랜에 작성한 내용이 이곳에 반영됩니다.';
  opinion.classList.toggle('is-empty',!note.value.trim());
}
window.addEventListener('beforeprint',()=>{
  const active=document.querySelector('[id$="report-view"].active');
  const note=active?.querySelector('textarea[id$="-doctor-note"]');
  if(note) syncEmrOpinion(note.id.replace(/-doctor-note$/,''));
});
