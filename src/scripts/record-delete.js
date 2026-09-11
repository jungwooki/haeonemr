let emrDeletingRecord=false;
async function emrDeleteRequest(op,extra={}){
  if(!emrImagePassword) throw new Error('EMR에 다시 로그인한 뒤 삭제해 주세요.');
  const params=new URLSearchParams({type:'recordDelete',op,password:emrImagePassword,q:'__haeon_delete_api_probe__',...extra});
  const response=await fetch(CONFIG.SHEET_URL+'?'+params,{signal:AbortSignal.timeout(30000)});
  const result=await response.json();
  if(result.protocol!=='haeon-record-delete-v1') throw new Error('삭제 기능을 사용하려면 Google Apps Script의 Code.gs를 업데이트하고 다시 배포해 주세요.');
  if(!result.ok) throw new Error(result.error||'삭제 요청에 실패했습니다.');
  return result;
}
window.deletePatientRecord=async function(patientIndex,recordIndex){
  if(emrDeletingRecord) return;
  const patient=window._patients?.[patientIndex],record=patient?.records[recordIndex];
  if(!record) return;
  const date=new Date(record.ts).toLocaleString('ko-KR');
  if(!confirm(`${patient.name}님의 ${record.category||'소아'} 문진을 삭제할까요?\n작성일: ${date}\n\n선택한 문진만 EMR 목록에서 삭제됩니다.`)) return;
  emrDeletingRecord=true;
  document.querySelectorAll('.emr-delete-record').forEach(button=>button.disabled=true);
  const status=document.getElementById('record-delete-status');if(status) status.textContent='선택한 문진을 삭제하는 중입니다…';
  try{
    await emrDeleteRequest('capabilities');
    const requestId=crypto.randomUUID();
    await fetch(CONFIG.SHEET_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},signal:AbortSignal.timeout(60000),body:JSON.stringify({type:'recordDelete',password:emrImagePassword,requestId,name:patient.name,chartNumber:patient.chartNumber||'',category:record.category||'소아',ts:record.ts})});
    let complete=false;
    for(let attempt=0;attempt<10;attempt++){
      const receipt=await emrDeleteRequest('status',{requestId});
      if(receipt.state==='failed') throw new Error(receipt.error||'삭제하지 못했습니다.');
      if(receipt.state==='complete'){complete=true;break;}
      await new Promise(resolve=>setTimeout(resolve,1000));
    }
    if(!complete) throw new Error('삭제 결과를 확인하지 못했습니다. 목록을 다시 조회해 주세요.');
    const selected=window._patients?.[window._currentPatientIdx];
    const cached=(window._patients||[]).find(p=>p.name===patient.name&&(p.chartNumber||'')===(patient.chartNumber||''));
    if(cached) cached.records=cached.records.filter(r=>!(r.ts===record.ts&&(r.category||'소아')===(record.category||'소아')));
    window._patients=(window._patients||[]).filter(p=>p.records.length);
    window._currentPatientIdx=window._patients.indexOf(selected);
    renderPatientList(window._patients);
    document.getElementById('search-status').textContent=`환자 ${window._patients.length}명`;
    if(selected===cached){
      document.querySelectorAll('[id$="report-view"].active').forEach(view=>view.classList.remove('active'));
      window._currentRecordTs=null;window._currentDoctorNote='';window._currentPrivateNote='';
      document.getElementById('search-view').style.display='flex';
      if(cached.records.length) renderPatientDetail(cached);else resetPatientDetailPlaceholder();
    }
    const nextStatus=document.getElementById('record-delete-status');
    if(nextStatus) nextStatus.textContent='선택한 문진을 삭제했습니다.';
    else document.getElementById('search-status').textContent+=' · 문진 삭제 완료';
  }catch(error){
    const target=document.getElementById('record-delete-status');
    if(target) target.textContent=error.message;else alert(error.message);
  }finally{
    emrDeletingRecord=false;document.querySelectorAll('.emr-delete-record').forEach(button=>button.disabled=false);
  }
};

