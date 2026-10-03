/* Audit labels distinguish requested actions from OS-level completion. */
const EmrAudit=(()=>{
 const names={login:'로그인',logout:'로그아웃',session_resume:'로그인 세션 재개',patient_list:'환자 목록 조회',patient_open:'환자 기록 목록 조회',record_open:'문진 열람',record_create:'설문 기록 접수',note_update:'메모 수정',chart_update:'차트번호 수정',record_delete:'문진 삭제',copy_request:'복사 요청',copy_success:'클립보드 복사 완료',copy_manual:'수동 복사 창 열기',print_request:'인쇄 창 열기',export_text:'텍스트 저장 요청',export_json:'JSON 저장 요청'};
 const fields={privateNote:'프리노트',doctorNote:'주치의 치료플랜',interpretationNote:'간호사 메모',chartNumber:'차트번호',survey_summary:'문진 요약',survey_all:'문진 전체'};
 async function record(action,targetId=window._currentRecordId||'',field=''){
  try{await EmrFirebase.audit(action,targetId,{field});return true;}catch(error){alert('작업 이력을 저장하지 못했습니다. 연결과 로그인 상태를 확인해 주세요.');return false;}
 }
 let printLogged=false;
 async function print(){if(!await emrCanNavigate()||!await record('print_request'))return;printLogged=true;window.print();setTimeout(()=>{printLogged=false;},1000);}
 window.addEventListener('beforeprint',()=>{if(!printLogged&&window._currentRecordId)record('print_request');});
 async function open(){
  let dialog=document.getElementById('emr-audit-dialog');if(!dialog){dialog=document.createElement('dialog');dialog.id='emr-audit-dialog';dialog.className='plan-picker no-print';dialog.style.width='min(840px,calc(100vw - 28px))';dialog.setAttribute('aria-label','활동 이력');dialog.innerHTML='<header><h2>활동 이력 · 최근 100건</h2><button type="button">닫기</button></header><p>로그인 계정과 서버 시각 기준입니다. 복사·인쇄는 앱에서 확인할 수 있는 요청과 처리 단계로 기록합니다.</p><div data-audit-rows></div>';dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.querySelector('[data-audit-rows]').replaceChildren());document.body.append(dialog);}
  if(!dialog.open)dialog.showModal();const host=dialog.querySelector('[data-audit-rows]');host.textContent='이력을 불러오는 중…';
  try{const rows=await EmrFirebase.auditLog();if(!dialog.open)return;host.replaceChildren();if(!rows.length){host.textContent='아직 기록된 활동이 없습니다.';return;}for(const row of rows){const entry=document.createElement('details');entry.style.cssText='border-bottom:1px solid #e2e8f0;padding:12px 0;font-size:12px';const summary=document.createElement('summary');const date=row.createdAt?.toDate?.();summary.textContent=[date?date.toLocaleString('ko-KR'):'시각 확인 중',row.actorName===CONFIG.ADMIN_EMAIL?'admin':row.actorName,names[row.action]||row.action,fields[row.field]||row.field].filter(Boolean).join(' · ');const info=document.createElement('p');info.textContent='대상 ID: '+(row.targetId||'—')+' · 계정 ID: '+row.actorUid;entry.append(summary,info);if(['note_update','chart_update'].includes(row.action)){for(const [label,value] of [['변경 전',row.before],['변경 후',row.after]]){const pre=document.createElement('pre');pre.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;margin-top:8px';pre.textContent=label+'\n'+(value||'(비어 있음)');entry.append(pre);}}host.append(entry);}}
  catch{host.textContent='이력을 불러오지 못했습니다. 연결과 로그인 상태를 확인해 주세요.';}
 }
 return {record,print,open};
})();
