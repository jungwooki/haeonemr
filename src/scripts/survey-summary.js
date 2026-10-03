/* Deterministic presentation of saved answers. No AI, inference, score or database writes. */
const SurveySummary=(()=>{
 const labels=JSON.parse(document.getElementById('survey-field-labels').textContent);
 const metadata=new Set(['requestId','submissionId','schemaVersion','factorScores']);
 const identity=new Set(['name','birthDate','dob','gender','guardianName','parent','school']);
 const priority=['misChiefComplaint','misDate','misPregnancyWeeks','misType','misPhysicalEmotional','misFeelings','misAdditionalCare','coldChiefComplaint','trafficPainDetail','trafficBodyMarkers','trafficAccidentDate','trafficSymptoms','coldSymptoms','coldTemperature','coldMedication','chiefComplaint','painAreaDetail','painLocation','painAreaCenter','painAreaSide','painFeel','currentPainScale','maxPainScale','painDurationNum','painDurationUnit','painCause','painWorse','painBetter','symptoms','otherSymptoms','additionalInfo','medication','medicalHistory','history','disease','sleepQuality','digestion','appetite','recoverySpeed','dietReason'];
 const empty=value=>value===null||value===undefined||value===''||(Array.isArray(value)&&value.length===0)||(typeof value==='object'&&!Array.isArray(value)&&value!==null&&Object.keys(value).length===0);
 function format(value){
  if(empty(value))return '미기록';
  if(value===false)return '체크되지 않음 (미응답 여부 확인 필요)';
  if(value===true)return '체크됨';
  if(Array.isArray(value))return value.map(format).join(' / ');
  if(typeof value==='object')return Object.entries(value).map(([key,v])=>(labels[key]||key)+': '+format(v)).join(', ');
  return String(value);
 }
 function entries(record){
  const data=JSON.parse(record.data);if(!data||typeof data!=='object'||Array.isArray(data))throw Error('문진 응답 형식을 확인해 주세요.');
  const rows=[];const add=(key,label,value,group='',scale=null)=>{
   if(['currentPainScale','maxPainScale'].includes(key))scale={min:0,max:10};
   const numeric=(typeof value==='number'||typeof value==='string'&&value.trim()!=='')?Number(value):NaN;
   rows.push({key,label,value:format(value),populated:!empty(value)&&value!==false,group,scale:scale&&Number.isFinite(numeric)&&numeric>=scale.min&&numeric<=scale.max?{...scale,value:numeric}:null});
  };
  for(const [key,value] of Object.entries(data)){
   if(metadata.has(key))continue;
   if(key==='answers'&&value&&typeof value==='object'&&record.category==='MPS 멘탈'){
    const sports=JSON.parse(document.getElementById('sports-data').textContent);
    const questions=new Map((sports[data.sport]?.sections||[]).flatMap(section=>section.items.map(q=>[String(q.no),{...q,group:section.title||section.factor}])));
    for(const [number,answer] of Object.entries(value)){
     const q=questions.get(number);add('answers.'+number,(q?q.no+'. '+q.text:'문항 '+number)+' [1~6점 응답]',answer,q?.group||'문항별 응답',q?{min:1,max:6}:null);
    }
   }else if(['answers','activityAnswers'].includes(key)&&value&&typeof value==='object'&&record.category==='유소년스포츠 (성장체질)'){
    const source=key==='answers'?GrowthConstitutionData.QUESTIONS:GrowthConstitutionData.ACTIVITY_QUESTIONS;
    const questions=new Map(source.map(q=>[String(q.id),q]));
    for(const [number,answer] of Object.entries(value)){
     const q=questions.get(number);add(key+'.'+number,(q?.text||'문항 '+number)+(key==='answers'?' [1~5점 응답]':q?.unit?' ['+q.unit+']':''),answer,key==='answers'?'성장체질 문항 응답':'활동량 응답',q&&key==='answers'?{min:1,max:5}:null);
    }
   }else add(key,labels[key]||'기타 응답 ('+key+')',value);
  }
  return rows;
 }
 function mainRows(rows){
  const questionRows=rows.filter(r=>r.key.startsWith('answers.'));
  if(questionRows.length){
   const groups=new Map();for(const row of questionRows){const group=row.group||'문항 응답';if(!groups.has(group))groups.set(group,[]);groups.get(group).push(row);}
   const facts=[...groups].map(([group,items])=>{
    const counts=new Map();for(const item of items){const value=item.populated?item.value+'점':'미기록';counts.set(value,(counts.get(value)||0)+1);}
    return {key:'distribution.'+group,label:group,value:[...counts].sort(([a],[b])=>a.localeCompare(b,'ko')).map(([value,count])=>value+' '+count+'문항').join(' · '),populated:true};
   });
   // Counts describe stored responses only; no severity ranking, diagnosis or score interpretation.
   return [...rows.filter(r=>r.key.startsWith('activityAnswers.')&&r.populated),...facts];
  }
  const duration=rows.find(r=>r.key==='painDurationNum'&&r.populated),unit=rows.find(r=>r.key==='painDurationUnit'&&r.populated);
  const available=rows.filter(r=>r.populated&&!identity.has(r.key)&&!(duration&&unit&&r.key==='painDurationUnit')).map(r=>r===duration&&unit?{...r,label:'통증 지속 기간',value:r.value+unit.value}:r);
  const order=key=>{const n=priority.indexOf(key);return n<0?priority.length:n;};
  return [...available].sort((a,b)=>order(a.key)-order(b.key)).slice(0,8);
 }
 function header(patient,record){
  return ['문진 응답 — '+(record.category||'소아'),'이름: '+(patient?.name||'미기록'),'차트번호: '+(patient?.chartNumber||'미기록'),'작성 시각: '+(record.ts||'미기록')].join('\n');
 }
 function exportText(patient,record,mode='all'){
  const rows=entries(record),selected=mode==='summary'?mainRows(rows):rows;
  return header(patient,record)+'\n'+(mode==='summary'?'[입력내용 요약 · 주요 '+selected.length+'항목]':'[환자 문진 응답 전체]')+'\n저장된 응답을 그대로 정리했습니다. 기본값과 직접 선택은 구분되지 않을 수 있으며, 미기록을 증상 없음으로 해석하지 않습니다.\n\n'+selected.map(r=>r.label+': '+r.value).join('\n')+'\n';
 }
 function manualCopy(text){
  let dialog=document.getElementById('survey-copy-dialog');
  if(!dialog){
   dialog=document.createElement('dialog');dialog.id='survey-copy-dialog';dialog.className='survey-copy-dialog';dialog.setAttribute('aria-labelledby','survey-copy-title');
   const title=document.createElement('h2');title.id='survey-copy-title';title.textContent='문진 응답 복사';
   const help=document.createElement('p');help.textContent='자동 복사를 사용할 수 없습니다. 아래 텍스트를 선택해 복사해 주세요.';
   const field=document.createElement('textarea');field.readOnly=true;field.setAttribute('aria-label','복사할 문진 응답');
   const select=document.createElement('button');select.type='button';select.textContent='전체 선택';select.onclick=()=>{field.focus();field.select();};
   const close=document.createElement('button');close.type='button';close.textContent='닫기';close.onclick=()=>dialog.close();
   dialog.addEventListener('close',()=>{field.value='';});dialog.append(title,help,field,select,close);document.body.append(dialog);
  }
  const field=dialog.querySelector('textarea');field.value=text;if(!dialog.open)dialog.showModal();field.focus();field.select();
 }
 async function copy(text,status,recordId,field){
  if(!await EmrAudit.record('copy_request',recordId,field))return;
  try{if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');await navigator.clipboard.writeText(text);status.textContent='복사했습니다. 메모장에 붙여넣으세요.';EmrAudit.record('copy_success',recordId,field);}
  catch{await EmrAudit.record('copy_manual',recordId,field);manualCopy(text);status.textContent='텍스트를 직접 선택해 복사해 주세요.';}
 }
 async function download(patient,record){
  if(!await EmrAudit.record('export_text',record.id,'survey_all'))return;
  const blob=new Blob(['\ufeff'+exportText(patient,record)],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  const safe=value=>String(value||'문진').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_').slice(0,60);
  link.href=url;link.download=safe(patient?.name)+'_'+safe(record.category)+'_'+safe(record.ts)+'.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function list(rows){
  const dl=document.createElement('dl');dl.className='survey-answer-list';
  for(const row of rows){const pair=document.createElement('div'),label=document.createElement('dt'),value=document.createElement('dd');label.textContent=row.label;value.textContent=row.value;
   if(row.scale){
    value.className='survey-scale-value';value.replaceChildren();
    const number=document.createElement('strong');number.textContent=row.value+' / '+row.scale.max;
    const track=document.createElement('span');track.className='survey-scale-track';track.setAttribute('role','meter');track.setAttribute('aria-label',row.label);track.setAttribute('aria-valuemin',String(row.scale.min));track.setAttribute('aria-valuemax',String(row.scale.max));track.setAttribute('aria-valuenow',String(row.scale.value));track.setAttribute('aria-valuetext',row.scale.value+'점 ('+row.scale.min+'~'+row.scale.max+'점 척도)');
    const fill=document.createElement('span');fill.className='survey-scale-fill';fill.style.width=(row.scale.value/row.scale.max*100)+'%';track.append(fill);
    const bounds=document.createElement('span');bounds.className='survey-scale-bounds';bounds.textContent=row.scale.min+'–'+row.scale.max+'점 척도';
    value.append(number,track,bounds);
   }
   pair.append(label,value);dl.append(pair);}
  return dl;
 }
 function mount(view,right,patient,record){
  let section=right.querySelector('.survey-response-summary');
  if(!record?.data){section?.remove();return;}
  if(!section){section=document.createElement('section');section.className='survey-response-summary no-print';right.querySelector('.clinical-editor-heading')?.after(section);if(!section.isConnected)right.prepend(section);}
  section.replaceChildren();section.dataset.recordId=record.id||'';
  const heading=document.createElement('header');heading.className='survey-summary-heading';const title=document.createElement('h3');title.textContent='문진 응답 요약';const badge=document.createElement('span');badge.textContent='입력내용 정리';heading.append(title,badge);
  const help=document.createElement('p');help.className='survey-summary-help';help.textContent='환자가 작성한 저장값을 정리합니다. 미기록·미체크는 증상 없음이 아니며, 기본값과 직접 선택은 구분되지 않을 수 있습니다.';
  section.append(heading,help);
  let rows;
  try{rows=entries(record);}catch{const message=document.createElement('p');message.textContent='응답 형식을 읽지 못했습니다. 원문 기록을 확인해 주세요.';section.append(message);return;}
  const selected=mainRows(rows);section.append(list(selected));
  if(rows.filter(r=>r.populated&&!identity.has(r.key)).length>selected.length){const more=document.createElement('p');more.className='survey-summary-help';more.textContent='나머지 입력내용은 아래 전체 응답에서 확인할 수 있습니다.';section.append(more);}
  if(!selected.length){const empty=document.createElement('p');empty.textContent='요약할 입력내용이 없습니다.';section.append(empty);}
  const status=document.createElement('p');status.className='survey-copy-status';status.setAttribute('role','status');
  const actions=document.createElement('div');actions.className='survey-summary-actions';
  for(const [label,action] of [['요약 복사',()=>copy(exportText(patient,record,'summary'),status,record.id,'survey_summary')],['응답 전체 복사',()=>copy(exportText(patient,record),status,record.id,'survey_all')],['텍스트 파일 저장',()=>download(patient,record)]]){const button=document.createElement('button');button.type='button';button.textContent=label;button.onclick=action;actions.append(button);}
  const detail=document.createElement('details');detail.className='survey-all-answers';const summary=document.createElement('summary');summary.textContent='전체 응답 '+rows.length+'항목 보기';detail.append(summary);
  const groups=new Map();for(const row of rows){const key=row.group||(identity.has(row.key)?'기본정보':'문진 응답');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(row);}
  for(const [group,items] of groups){const h=document.createElement('h4');h.textContent=group;detail.append(h,list(items));}
  section.append(actions,status,detail);
 }
 return {entries,mainRows,exportText,mount,format};
})();
