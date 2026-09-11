/* Shared workspace keeps the original result nodes, charts and save handlers. */

function emrCanNavigate(){
  const active=document.querySelector('[id$="report-view"].active');
  if(!active) return true;
  const doctor=active.querySelector('textarea[id$="-doctor-note"]');
  const privateNote=active.querySelector('textarea[id$="-private-note"]');
  const interpretation=active.querySelector('textarea[id$="-interpretation-note"]');
  const dirty=(interpretation && interpretation.value!==(window._currentInterpretationNote||'')) || (doctor && doctor.value!==(window._currentDoctorNote||'')) || (privateNote && privateNote.value!==(window._currentPrivateNote||''));
  return !dirty || confirm('저장하지 않은 메모가 있습니다. 저장하지 않고 다른 기록으로 이동할까요?');
}
function emrOpenRecord(patientIndex,recordIndex){
  if(!emrCanNavigate()) return;
  const record=window._patients?.[patientIndex]?.records?.[recordIndex];
  if(!record) return;
  try{JSON.parse(record.data);}catch{alert('저장된 데이터를 불러오지 못했습니다.');return;}
  document.querySelectorAll('[id$="report-view"].active').forEach(view=>view.classList.remove('active'));
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
    sidebar.innerHTML='<div class="emr-sidebar-head"><div class="emr-brand">환자 목록</div><p>환자 목록 · 문진 기록</p><input type="search" aria-label="결과 화면 환자 검색" placeholder="이름 또는 차트번호 검색"></div><div class="emr-patients"></div><div class="emr-records"></div>';
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
    const title=document.createElement('div');title.className='rp-section-title';title.textContent='한의사 소견';
    const content=document.createElement('div');content.className='emr-opinion-text';
    opinion.append(title,content);left.append(opinion);
    view.addEventListener('input',event=>{
      if(event.target.id===prefix+'-doctor-note') syncEmrOpinion(prefix);
    });
  }
  document.getElementById(prefix+'-interpretation-note').value=window._currentInterpretationNote||'';
  syncEmrOpinion(prefix);
  renderEmrPatients(sidebar,sidebar.querySelector('input').value);
  const records=sidebar.querySelector('.emr-records');
  records.replaceChildren();
  const patient=window._patients?.[window._currentPatientIdx];
  let imageHost=right.querySelector('.emr-report-image-host');
  if(!imageHost){imageHost=document.createElement('div');imageHost.className='emr-report-image-host no-print';right.querySelector('.emr-notes').after(imageHost);}
  const activeRecord=patient?.records.find(record=>record.ts===window._currentRecordTs&&(!window._currentRecordCategory||record.category===window._currentRecordCategory));
  if(patient && activeRecord) mountEmrImages(imageHost,patient,activeRecord);else imageHost.replaceChildren();
  if(patient && window._currentRecordTs){
    const title=document.createElement('h3'); title.textContent='선택 환자의 문진 기록';records.append(title);
    patient.records.forEach((record,index)=>{
      const button=document.createElement('button');button.className='emr-record';
      button.setAttribute('aria-current',String(record.ts===window._currentRecordTs&&(!window._currentRecordCategory||record.category===window._currentRecordCategory)));
      button.textContent=record.category||'소아';
      const date=document.createElement('small');const timestamp=new Date(record.ts);
      date.textContent=isNaN(timestamp)?'날짜 미상':timestamp.toLocaleString('ko-KR');button.append(date);
      button.onclick=()=>emrOpenRecord(window._currentPatientIdx,index);records.append(button);
    });
  }
}
function renderEmrPatients(sidebar,query=''){
  const list=sidebar.querySelector('.emr-patients');list.replaceChildren();
  const patients=window._currentRecordTs ? (window._patients||[]) : [];
  const keyword=query.trim().toLocaleLowerCase();
  patients.forEach((patient,index)=>{
    if(![patient.name,patient.chartNumber].some(value=>String(value||'').toLocaleLowerCase().includes(keyword))) return;
    const button=document.createElement('button');button.className='emr-patient';
    button.setAttribute('aria-current',String(index===window._currentPatientIdx));
    const name=document.createElement('strong');name.textContent=patient.name||'이름 미상';
    const meta=document.createElement('small');meta.textContent=(patient.chartNumber||'차트번호 미지정')+' · '+patient.records.length+'건';
    button.append(name,meta);button.onclick=()=>{
      if(!emrCanNavigate()) return;
      document.querySelectorAll('[id$="report-view"].active').forEach(view=>view.classList.remove('active'));
      document.getElementById('search-view').style.display='flex';
      openPatientDetail(index);
    };list.append(button);
  });
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
  opinion.querySelector('.emr-opinion-text').textContent=note.value||'주치의 안내에 작성한 내용이 이곳에 반영됩니다.';
  opinion.classList.toggle('is-empty',!note.value.trim());
}
window.addEventListener('beforeprint',()=>{
  const active=document.querySelector('[id$="report-view"].active');
  const note=active?.querySelector('textarea[id$="-doctor-note"]');
  if(note) syncEmrOpinion(note.id.replace(/-doctor-note$/,''));
});
