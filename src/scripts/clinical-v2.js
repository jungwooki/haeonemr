/* Presentation layer only. Keep existing note fields, save handlers and chart nodes. */
function decorateClinicalWorkspace(view, columns, right, patient){
  view.classList.add('clinical-report');
  mountClinicalToolbar(view);
  let consultation=columns.querySelector('.clinical-consultation');
  if(!consultation){
    consultation=document.createElement('div');consultation.className='clinical-consultation';
    const identity=document.createElement('header');identity.className='clinical-identity no-print';
    consultation.append(identity);
    const heading=document.createElement('header');heading.className='clinical-editor-heading no-print';
    heading.innerHTML='<div><span class="clinical-kicker">CONSULTATION</span><h2>프리노트 · 진료 기록</h2></div><span>입력한 메모는 자동 저장됩니다.</span>';
    right.prepend(heading);
    const left=columns.querySelector('.report-col-left');
    const fold=document.createElement('details');fold.className='clinical-record-fold';fold.open=true;
    const toggle=document.createElement('summary');toggle.className='clinical-record-toggle';
    fold.append(toggle,right,left);columns.append(consultation);consultation.append(fold);
  }
  const identity=consultation.querySelector('.clinical-identity');
  renderClinicalIdentity(identity,patient);
  const record=patient?.records?.find(r=>r.id===window._currentRecordId);
  SurveySummary.mount(view,right,patient,record);
  const time=record?new Date(record.ts):null;
  const group=patient?groupClinicalRecords(patient.records).find(g=>g.entries.some(e=>e.record===record)):null;
  const toggle=consultation.querySelector('.clinical-record-toggle');
  toggle.replaceChildren();
  const recordTitle=document.createElement('span');recordTitle.textContent=(group?.number?group.number+'회차 · ':'')+surveyCategoryLabel(window._currentRecordCategory||'현재 문진');
  const recordDate=document.createElement('time');recordDate.textContent=record?clinicalRecordTime(time.getTime()):'';
  toggle.append(recordTitle,recordDate);
  consultation.querySelector('.clinical-record-fold').open=true;


}
async function clinicalPatientList(){
  const active=document.querySelector('[id$="report-view"].active');
  if(!active)return;
  if(!await emrCanNavigate())return;
  // Use the report's existing return handler: it retains authentication and survey state.
  active.querySelector('.report-toolbar > button')?.click();
}
function clinicalFocus(section){
  const active=document.querySelector('[id$="report-view"].active');
  if(!active)return;
  const target=active.querySelector(section==='notes'?'.report-col-right':'.report-col-left');
  const fold=active.querySelector('.clinical-record-fold');if(fold)fold.open=true;
  target?.scrollIntoView({behavior:'instant',block:'start'});
}
(()=>{
  const nav=document.getElementById('clinical-navigation');
  const search=document.getElementById('search-view');
  const reports=[...document.querySelectorAll('body > [id$="report-view"]')];
  const sync=()=>{
    const report=reports.find(el=>el.classList.contains('active'));
    const visible=!!report||search.style.display==='flex';
    if(visible)mountClinicalToolbar(report||search);
    nav.hidden=!visible;document.body.classList.toggle('clinical-mode',visible);
    nav.querySelectorAll('[data-clinical-record]').forEach(button=>button.disabled=!report);
  };
  const observer=new MutationObserver(sync);
  [search,...reports].forEach(el=>observer.observe(el,{attributes:true,attributeFilter:['class','style']}));
  sync();
})();

// Print all report content even when the consultation accordion is closed.
let clinicalPrintFoldState=[];
window.addEventListener('beforeprint',()=>{
 clinicalPrintFoldState=[...document.querySelectorAll('.clinical-record-fold')].map(el=>[el,el.open]);
 clinicalPrintFoldState.forEach(([el])=>el.open=true);
});
window.addEventListener('afterprint',()=>{
 clinicalPrintFoldState.forEach(([el,open])=>el.open=open);clinicalPrintFoldState=[];
});
