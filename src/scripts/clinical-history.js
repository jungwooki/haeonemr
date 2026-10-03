/* UI grouping only: never change record order, timestamps, categories or IDs. */
function groupClinicalRecords(records){
  const groups=new Map();
  records.forEach((record,index)=>{
    const millis=record.ts==null||record.ts===''?NaN:new Date(record.ts).getTime();
    const key=Number.isFinite(millis)?String(millis):'unknown-'+index;
    if(!groups.has(key))groups.set(key,{key,millis,entries:[],categories:new Map()});
    const group=groups.get(key),category=record.category||'소아';
    const entry={record,index};group.entries.push(entry);
    if(!group.categories.has(category))group.categories.set(category,[]);
    group.categories.get(category).push(entry);
  });
  const sorted=[...groups.values()].sort((a,b)=>{
    if(!Number.isFinite(a.millis))return Number.isFinite(b.millis)?1:a.entries[0].index-b.entries[0].index;
    if(!Number.isFinite(b.millis))return -1;
    return b.millis-a.millis;
  });
  const dated=sorted.filter(group=>Number.isFinite(group.millis));
  dated.forEach((group,i)=>group.number=dated.length-i);
  return sorted;
}
function clinicalRecordTime(millis){
  if(!Number.isFinite(millis))return '작성 시각 미상';
  return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date(millis));
}
const clinicalHistoryOpenState=new WeakMap();
function renderClinicalHistory(host,patient,patientIndex,{allowDelete=false,active=false}={}){
  if(!clinicalHistoryOpenState.has(patient))clinicalHistoryOpenState.set(patient,new Map());
  const openState=clinicalHistoryOpenState.get(patient);
  document.querySelectorAll('[data-clinical-patient]').forEach(tree=>{
    if(tree._clinicalPatient===patient)tree.querySelectorAll('details[data-history-key]').forEach(el=>openState.set(el.dataset.historyKey,el.open));
  });
  host.dataset.clinicalPatient='';host._clinicalPatient=patient;
  host.replaceChildren();
  const groups=groupClinicalRecords(patient.records||[]);
  const heading=document.createElement('header');heading.className='clinical-history-heading';
  const title=document.createElement('h3');title.textContent='회차별 문진 기록 · '+groups.length;
  const help=document.createElement('small');help.textContent='동일 작성 시각 기준 · 최신순';heading.append(title,help);host.append(heading);
  if(!groups.length){const empty=document.createElement('p');empty.className='emr-empty';empty.textContent='등록된 문진 기록이 없습니다.';host.append(empty);return;}
  groups.forEach((group,groupIndex)=>{
    const selected=entry=>active&&(entry.record.id?entry.record.id===window._currentRecordId:entry.record.ts===window._currentRecordTs&&(!window._currentRecordCategory||entry.record.category===window._currentRecordCategory));
    const isCurrent=group.entries.some(selected);
    const visit=document.createElement('details');visit.className='clinical-visit'+(isCurrent?' current':'');visit.dataset.historyKey=group.key;visit.open=isCurrent||(openState.get(group.key)??(groupIndex===0));
    const summary=document.createElement('summary');
    const label=document.createElement('strong');label.textContent=group.number?group.number+'회차':'시각 미상';
    const date=document.createElement('time');date.textContent=clinicalRecordTime(group.millis);if(Number.isFinite(group.millis))date.dateTime=new Date(group.millis).toISOString();
    const count=document.createElement('span');count.textContent=group.categories.size+'분야';summary.append(label,date,count);visit.append(summary);
    group.categories.forEach((entries,category)=>{
      const section=document.createElement('details');section.className='clinical-category';section.dataset.historyKey=group.key+'|'+category;section.open=entries.some(selected)||(openState.get(section.dataset.historyKey)??(groupIndex===0));
      const categorySummary=document.createElement('summary');categorySummary.append(document.createTextNode(surveyCategoryLabel(category)));
      const size=document.createElement('small');size.textContent=entries.length+'건';categorySummary.append(size);section.append(categorySummary);
      entries.forEach(entry=>{
        const {record,index}=entry;
        const row=document.createElement('div');row.className='clinical-history-row';
        const button=document.createElement('button');button.type='button';button.className='clinical-history-record';button.setAttribute('aria-current',String(selected(entry)));
        const line=document.createElement('span');const time=document.createElement('time');time.textContent='기록 '+(entries.indexOf(entry)+1);const status=document.createElement('em');status.textContent=selected(entry)?'열린 기록':'열기 →';line.append(time,status);button.append(line);
        const preview=document.createElement('p');preview.textContent=record.privateNote||record.doctorNote||record.interpretationNote||(record.data?'작성된 메모가 없습니다.':'문진과 프리노트 열기');button.append(preview);
        button.onclick=()=>active?emrOpenRecord(patientIndex,index):viewPatientRecord(patientIndex,index);row.append(button);
        if(allowDelete){const remove=document.createElement('button');remove.type='button';remove.className='clinical-history-delete';remove.textContent='삭제';remove.setAttribute('aria-label',surveyCategoryLabel(category)+' '+clinicalRecordTime(group.millis)+' 기록 삭제');remove.disabled=emrDeletingRecord;remove.onclick=()=>deletePatientRecord(patientIndex,index);row.append(remove);}
        section.append(row);
      });
      visit.append(section);
    });host.append(visit);
  });
}
