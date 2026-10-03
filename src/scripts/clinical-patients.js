/* Shared presentation for both patient selection and opened records. */
function clinicalPatientInfo(patient,now=new Date()){
 const records=patient?.records||[];
 const latest=records.reduce((best,r)=>!best||new Date(r.ts)>new Date(best.ts)?r:best,null)||{ts:patient?.lastRecordAt};
 const rawBirth=patient?.birthDate||records.find(r=>r.birthDate)?.birthDate||'';
 const match=String(rawBirth).match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})(?:$|[T\s])/);
 let birth='미등록',age='';
 if(match){
  const [,yy,mm,dd]=match.map(Number);const valid=new Date(Date.UTC(yy,mm-1,dd));
  if(valid.getUTCFullYear()===yy&&valid.getUTCMonth()===mm-1&&valid.getUTCDate()===dd){
   const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now).split('-').map(Number);
   const years=today[0]-yy-(today[1]<mm||(today[1]===mm&&today[2]<dd)?1:0);
   birth=`${yy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;
   if(years>=0)age=`만 ${years}세`;
  }
 }
 const date=new Date(latest.ts);const dateText=latest.ts&&!isNaN(date)?new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date):'날짜 미상';
 return {name:patient?.name||'이름 미상',chart:String(patient?.chartNumber||'미지정'),gender:patient?.gender||latest.gender||records.find(r=>r.gender)?.gender||'성별 미등록',birth,age,date:dateText};
}
async function clinicalSelectPatient(index){
 if(!await emrCanNavigate())return;
 document.querySelectorAll('[id$="report-view"].active').forEach(view=>view.classList.remove('active'));
 document.getElementById('search-view').style.display='flex';
 document.getElementById('search-input').value=clinicalPatientQuery;
 openPatientDetail(index);
}
let clinicalPatientQuery='';
function renderClinicalPatientRows(host,patients,query=clinicalPatientQuery){
 clinicalPatientQuery=query;host.replaceChildren();
 const keyword=query.trim().toLocaleLowerCase();let count=0;
 patients.forEach((patient,index)=>{
  if(![patient.name,patient.chartNumber].some(value=>String(value||'').toLocaleLowerCase().includes(keyword)))return;
  count++;const info=clinicalPatientInfo(patient),button=document.createElement('button');button.type='button';button.className='clinical-patient-row';
  button.setAttribute('aria-current',String(index===window._currentPatientIdx));
  const title=document.createElement('span');title.className='clinical-patient-title';
  const name=document.createElement('strong');name.textContent=info.name;const date=document.createElement('time');date.textContent=info.date;date.title='최근 문진 기록일';title.append(name,date);
  const meta=document.createElement('span');meta.className='clinical-patient-meta';meta.textContent='차트 '+info.chart+' · '+info.gender;
  const birth=document.createElement('span');birth.className='clinical-patient-birth';birth.textContent=info.birth+(info.age?' ('+info.age+')':'');
  button.append(title,meta,birth);button.onclick=()=>clinicalSelectPatient(index);host.append(button);
 });
 const pane=host.parentElement;const countNode=pane?.querySelector('.clinical-patient-count');if(countNode)countNode.textContent='환자 '+count+'명';
 if(!count){const empty=document.createElement('p');empty.className='emr-empty';empty.textContent='검색 결과가 없습니다.';host.append(empty);}
}
function renderClinicalIdentity(host,patient){
 const info=clinicalPatientInfo(patient);host.replaceChildren();
 const name=document.createElement('h2');name.textContent=patient?info.name:'문진 결과';
 const detail=document.createElement('div');detail.className='clinical-identity-details';
 for(const [key,value] of [['차트번호',info.chart],['성별',info.gender],['생년월일',info.birth+(info.age?' ('+info.age+')':'')]]){
  const cell=document.createElement('div'),label=document.createElement('span'),text=document.createElement('b');label.textContent=key;text.textContent=value;cell.append(label,text);detail.append(cell);
 }host.append(name,detail);
}
function mountClinicalToolbar(view){
 let bar=view.querySelector('.clinical-unified-toolbar');
 if(!bar){
  bar=document.createElement('header');bar.className='clinical-unified-toolbar no-print';
  bar.innerHTML='<strong>MPS EMR <span>환자 · 진료기록</span></strong><div><button type="button" data-clinical-action="chart">차트번호 수정</button><button type="button" data-clinical-action="list">환자 목록</button><button type="button" data-clinical-action="print">인쇄 / PDF</button><button type="button" data-clinical-action="home">메인화면</button><button type="button" data-clinical-action="audit">활동 이력</button><button type="button" data-clinical-action="logout">로그아웃</button></div>';
  const existing=view.querySelector('.report-toolbar')||view.firstElementChild;existing.classList.add('clinical-legacy-toolbar');existing.before(bar);
  bar.querySelector('[data-clinical-action=chart]').onclick=async()=>{if(await emrCanNavigate())editChartNumber();};
  bar.querySelector('[data-clinical-action=list]').onclick=()=>clinicalSelectPatient(window._currentPatientIdx);
  bar.querySelector('[data-clinical-action=print]').onclick=()=>EmrAudit.print();
  bar.querySelector('[data-clinical-action=audit]').onclick=()=>EmrAudit.open();
  bar.querySelector('[data-clinical-action=logout]').onclick=()=>EmrFirebase.logout();
  bar.querySelector('[data-clinical-action=home]').onclick=()=>goToMainScreen();
 }
 bar.querySelector('[data-clinical-action=chart]').disabled=!window._patients?.[window._currentPatientIdx];
 bar.querySelector('[data-clinical-action=list]').disabled=!window._patients?.[window._currentPatientIdx];
 bar.querySelector('[data-clinical-action=print]').disabled=!view.classList.contains('active');
 const input=view.querySelector('.clinical-patient-search input');if(input)input.value=clinicalPatientQuery;
}
