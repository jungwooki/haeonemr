function surveyCategoryLabel(category){ return category==='유소년스포츠'?'유소년선수(일반)':(category||'-'); }
/* ===================== 저장 / 검색 (Firebase) ===================== */
function isEmrConfigured(){ return CONFIG.STORE_URL && CONFIG.STORE_URL.trim().length > 0; }

function saveRecordToFirebase(){
  const statusEl = document.getElementById('save-status');
  if(!isEmrConfigured()){
    if(statusEl) statusEl.innerText = '저장소 설정을 확인해 주세요.';
    return;
  }
  if(statusEl) statusEl.innerText = '저장 중...';
  const payload = { category:'소아', name: formData.name, birthDate: formData.birthDate, gender: formData.gender, ageGroup: getAgeGroup(), formData: formData };
  return emrSaveSurvey(statusEl,payload,formData);
}

// The dialog signs in to Firebase; every database operation is also rule-protected.
window.openSearchView = async function(){
  try{await EmrFirebase.requireStaff();clearEmrReadCache();emrImagePassword='firebase-session';enterEmrAfterPassword();}
  catch(error){if(!error.message.includes('취소'))alert('Firebase 로그인에 연결하지 못했습니다. 연결 상태를 확인해 주세요.');}
};
document.getElementById('emr-password-cancel').addEventListener('click',()=>document.getElementById('emr-password-dialog').close());
document.getElementById('emr-password-dialog').addEventListener('close',()=>{
  EmrFirebase.cancelLogin();document.getElementById('emr-password-form').reset();document.getElementById('emr-password-error').textContent='';
});
document.getElementById('emr-password-form').addEventListener('submit',async event=>{
  event.preventDefault();const button=event.target.querySelector('[type=submit]');button.disabled=true;
  try{await EmrFirebase.login(document.getElementById('emr-email').value.trim(),document.getElementById('emr-password').value);}
  catch(error){document.getElementById('emr-password-error').textContent=error.code==='auth/too-many-requests'?'잠시 후 다시 시도해 주세요.':'계정·비밀번호와 EMR 접근 권한을 확인해 주세요.';}
  finally{button.disabled=false;}
});
let emrNavigationVersion=0,emrSearchVersion=0;
function enterEmrAfterPassword(){
  if(!isEmrConfigured()){
    alert('Firebase 저장소 설정을 확인해 주세요.');
    return;
  }
  document.getElementById('gateway-view').style.display='none';
  document.getElementById('hub-view').style.display='none';
  document.getElementById('app-shell').style.display='none';
  document.getElementById('search-view').style.display='flex';
  document.getElementById('search-input').value='';
  window._currentPatientIdx = -1;clinicalPatientQuery='';emrNavigationVersion++;
  resetPatientDetailPlaceholder();mountClinicalToolbar(document.getElementById('search-view'));
  searchRecords('');
};
window.closeSearchView = function(){
  clearEmrReadCache();
  emrImagePassword='';
  document.getElementById('search-view').style.display='none';
  const gw=document.getElementById('gateway-view'); gw.style.display='flex'; triggerFadeIn(gw);
};

function resetPatientDetailPlaceholder(){
  document.getElementById('patient-detail-panel').innerHTML = `
    <div class="h-full flex flex-col items-center justify-center text-center px-8">
      <div class="w-14 h-14 rounded-full bg-[#F5F6F8] flex items-center justify-center mb-3">
        <i data-lucide="user-search" class="w-6 h-6 text-slate-300"></i>
      </div>
      <p class="text-[14px] text-slate-400 font-medium">왼쪽 목록에서 환자를 선택하면<br>기본정보와 문진 기록이 여기에 표시됩니다.</p>
    </div>`;
  if(window.lucide) lucide.createIcons();
}

window.searchRecords = function(query){
  const statusEl=document.getElementById('search-status'), resultsEl=document.getElementById('search-results');
  const version=++emrSearchVersion;clinicalPatientQuery=query||'';emrNavigationVersion++;window._currentPatientIdx=-1;resetPatientDetailPlaceholder();
  statusEl.innerText='검색 중...'; resultsEl.innerHTML='';
  emrStoreRequest(CONFIG.STORE_URL)
    .then(r=>r.json())
    .then(json=>{
      if(version!==emrSearchVersion)return;
      if(!json.ok || !json.patients || !json.patients.length){
        statusEl.innerText='검색 결과가 없습니다.';
        window._patients=[];
        resultsEl.innerHTML='';
        return;
      }
      window._patients = json.patients;
      statusEl.innerText=`환자 ${json.patients.length}명`;
      renderPatientList(json.patients);
    })
    .catch((err)=>{ if(version!==emrSearchVersion)return;console.error('검색 실패:', err); statusEl.innerText='Firebase 조회에 실패했습니다. 로그인과 네트워크를 확인해 주세요.'; });
};

function renderPatientList(patients){
  const resultsEl=document.getElementById('search-results');
  renderClinicalPatientRows(resultsEl,patients);
  const active=document.querySelector('.clinical-report.active');
  if(active){
    const host=active.querySelector('.emr-patients');if(host)renderClinicalPatientRows(host,patients);
    const identity=active.querySelector('.clinical-identity');if(identity)renderClinicalIdentity(identity,patients[window._currentPatientIdx]);
  }

}

window.openPatientDetail = async function(idx){
  const p=window._patients[idx];if(!p)return;
  const version=++emrNavigationVersion;window._currentPatientIdx=idx;renderPatientList(window._patients);
  renderPatientDetail(p);
  const host=document.querySelector('#patient-detail-panel .clinical-history-tree');host.textContent='회차별 기록을 불러오는 중…';
  try{await EmrFirebase.loadRecords(p);if(version!==emrNavigationVersion)return;renderPatientDetail(p);}
  catch(error){if(version===emrNavigationVersion)host.textContent='기록을 불러오지 못했습니다. 환자를 다시 선택해 주세요.';}
};

function renderPatientDetail(p){
  const panel=document.getElementById('patient-detail-panel');
  panel.innerHTML = `<div class="emr-overview">
    <header class="clinical-identity emr-overview-identity"></header>
    <section class="emr-overview-records" aria-label="회차와 설문 분야별 기록"><p id="record-delete-status" role="status" aria-live="polite"></p><div class="clinical-history-tree"></div></section>
    <section class="emr-overview-prompt"><h2>프리노트</h2><p>회차별 문진 기록을 선택하면<br>해당 기록의 프리노트가 여기에 열립니다.</p></section>
  </div>`;
  renderClinicalIdentity(panel.querySelector('.clinical-identity'),p);
  mountClinicalToolbar(document.getElementById('search-view'));
  renderClinicalHistory(panel.querySelector('.clinical-history-tree'),p,window._currentPatientIdx,{allowDelete:true});
  if(window.lucide) lucide.createIcons();
}

window.editChartNumber = function(){
  const p = window._patients[window._currentPatientIdx];
  if(!p) return;
  const val = prompt(`${p.name}님의 차트번호를 입력해 주세요.`, p.chartNumber||'');
  if(val === null) return;
  emrStoreRequest(CONFIG.STORE_URL, {
    method:'POST',  
    body: JSON.stringify({ type:'updateChart', patientId:p.id, name:p.name, newChartNumber: val.trim() })
  }).then(()=>{
    p.chartNumber = val.trim();
    renderPatientDetail(p);
    renderPatientList(window._patients);
  }).catch((err)=>{ console.error(err); alert('차트번호 수정 요청 중 오류가 발생했습니다.'); });
};

window.viewPatientRecord = async function(patientIdx, recIdx){
  const p = window._patients[patientIdx];
  const rec = p && p.records[recIdx];
  if(!rec) return;
  const version=++emrNavigationVersion;
  try{await EmrFirebase.loadContent(rec);}catch(error){alert('문진을 불러오지 못했습니다. 네트워크와 로그인 상태를 확인해 주세요.');return;}
  if(version!==emrNavigationVersion)return;
  document.querySelectorAll('[id$="report-view"].active').forEach(view=>view.classList.remove('active'));
  window._currentRecordId=rec.id;
  window._currentPatientIdx=patientIdx;
  const cat = rec.category || '소아';
  let parsed;
  try{ parsed = JSON.parse(rec.data); }catch(e){ alert('저장된 데이터를 불러오지 못했습니다.'); return; }
  window._currentRecordTs = rec.ts;
  window._currentRecordName = p.name;
  window._currentDoctorNote = rec.doctorNote || '';
  window._currentPrivateNote = rec.privateNote || '';
  window._currentInterpretationNote = rec.interpretationNote || '';
  window._currentRecordCategory = cat;
  document.getElementById('search-view').style.display='none';
  if(cat === '교통사고'||cat === '소아감기'||cat === '유산후'){ PaperSurveys.open(parsed,rec); return; }
  if(cat === '유소년스포츠 (성장체질)'){ GrowthConstitution.open(parsed,rec); return; }
  if(cat === 'MPS 멘탈'){ MentalEmr.open(parsed,rec); return; }
  if(cat === '심층진료'){ Object.assign(deepFormData, parsed); deepCameFromSearch=true; generateDeepReportAndShow(true); return; }
  if(cat === '다이어트'){ Object.assign(dietFormData, parsed); dietCameFromSearch=true; generateDietReportAndShow(true); return; }
  if(cat === '여성'){ Object.assign(womenFormData, parsed); womenCameFromSearch=true; generateWomenReportAndShow(true); return; }
  if(cat === '통증'){ Object.assign(painFormData, parsed); painCameFromSearch=true; generatePainReportAndShow(true); return; }
  if(cat === '유소년스포츠' || cat === '유소년선수(일반)'){ Object.assign(sportsFormData, parsed); sportsCameFromSearch=true; generateSportsReportAndShow(true); return; }
  if(cat === '산후'){ Object.assign(postpartumFormData, parsed); postpartumCameFromSearch=true; generatePostpartumReportAndShow(true); return; }
  Object.assign(formData, parsed); cameFromSearch=true; generateReportAndShow(true);
};

