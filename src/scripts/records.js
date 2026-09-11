/* ===================== 저장 / 검색 (Google Sheet) ===================== */
function isSheetConfigured(){ return CONFIG.SHEET_URL && CONFIG.SHEET_URL.trim().length > 0; }

function saveRecordToSheet(){
  const statusEl = document.getElementById('save-status');
  if(!isSheetConfigured()){
    if(statusEl) statusEl.innerText = '저장소 미설정 (검색 기능을 쓰려면 CONFIG.SHEET_URL 설정 필요)';
    return;
  }
  if(statusEl) statusEl.innerText = '저장 중...';
  const payload = { category:'소아', name: formData.name, birthDate: formData.birthDate, gender: formData.gender, ageGroup: getAgeGroup(), formData: formData };
  // 구글 앱스크립트 웹앱은 응답 전에 googleusercontent.com으로 리다이렉트되는데,
  // 이 과정에서 브라우저가 CORS를 이유로 fetch를 실패 처리하는 경우가 많습니다.
  // 저장은 "보내기만" 하면 되므로 no-cors 모드로 전송해 이 문제를 피합니다.
  fetch(CONFIG.SHEET_URL, {
    method:'POST',
    mode:'no-cors',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body: JSON.stringify(payload)
  })
    .then(()=>{ if(statusEl) statusEl.innerText = '저장 요청 완료 ✓'; })
    .catch((err)=>{
      console.error('저장 실패:', err);
      if(statusEl) statusEl.innerText = '저장 실패 - CONFIG.SHEET_URL 및 배포 설정을 확인해 주세요';
    });
}

// The standalone HTML uses an entry gate; server authorization is separate.
window.openSearchView = function(){
  const dialog=document.getElementById('emr-password-dialog');
  document.getElementById('emr-password-form').reset();
  document.getElementById('emr-password-error').textContent='';
  document.getElementById('emr-password').removeAttribute('aria-invalid');
  if(!dialog.open) dialog.showModal();
};
document.getElementById('emr-password-cancel').addEventListener('click',()=>{
  document.getElementById('emr-password-dialog').close();
});
document.getElementById('emr-password-dialog').addEventListener('close',()=>{
  document.getElementById('emr-password-form').reset();
  document.getElementById('emr-password-error').textContent='';
});
document.getElementById('emr-password-form').addEventListener('submit',event=>{
  event.preventDefault();
  const input=document.getElementById('emr-password');
  if(input.value!=='1824'){
    document.getElementById('emr-password-error').textContent='비밀번호가 올바르지 않습니다. 다시 입력해 주세요.';
    input.setAttribute('aria-invalid','true');
    input.value=''; input.focus();
    return;
  }
  clearEmrReadCache();
  emrImagePassword=input.value;
  document.getElementById('emr-password-dialog').close();
  enterEmrAfterPassword();
});
function enterEmrAfterPassword(){
  if(!isSheetConfigured()){
    alert('아직 검색 저장소(Google Sheet)가 설정되지 않았습니다. CONFIG.SHEET_URL 을 설정한 뒤 사용해 주세요.');
    return;
  }
  document.getElementById('gateway-view').style.display='none';
  document.getElementById('hub-view').style.display='none';
  document.getElementById('app-shell').style.display='none';
  document.getElementById('search-view').style.display='flex';
  document.getElementById('search-input').value='';
  window._currentPatientIdx = -1;
  resetPatientDetailPlaceholder();
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
  statusEl.innerText='검색 중...'; resultsEl.innerHTML='';
  fetch(`${CONFIG.SHEET_URL}?q=${encodeURIComponent(query||'')}`)
    .then(r=>r.json())
    .then(json=>{
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
    .catch((err)=>{ console.error('검색 실패:', err); statusEl.innerText='검색 중 오류가 발생했습니다. (배포 접근권한이 "모든 사용자"인지 확인해 주세요)'; });
};

function renderPatientList(patients){
  const resultsEl=document.getElementById('search-results');
  resultsEl.innerHTML = patients.map((p,i)=>{
    const cats = [...new Set(p.records.map(r=>r.category||'-'))];
    const d = p.records[0] ? new Date(p.records[0].ts) : null;
    const dateLabel = (d && !isNaN(d)) ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '';
    const active = i===window._currentPatientIdx;
    return `<button onclick="openPatientDetail(${i})" class="w-full text-left px-4 py-3 border-b border-[#F0F0F2] flex justify-between items-center transition-colors ${active?'bg-blue-50':'hover:bg-[#FAFAFA]'}">
      <div class="min-w-0">
        <div class="font-bold text-[14px] ${active?'text-blue-700':'text-black'} truncate">${p.name||'이름 미상'}</div>
        <div class="text-[11px] text-[#8E8E93] mt-0.5">${p.chartNumber ? '차트#'+p.chartNumber : '차트번호 미지정'}${(p.records[0]&&p.records[0].birthDate)?' · '+p.records[0].birthDate:''}</div>
        <div class="text-[10px] text-[#8E8E93] mt-1 flex flex-wrap gap-1">${cats.slice(0,3).map(c=>`<span class="bg-[#F2F2F7] px-1.5 py-0.5 rounded-full">${c}</span>`).join('')}${cats.length>3?`<span>+${cats.length-3}</span>`:''}</div>
      </div>
      <div class="text-[10px] text-[#8E8E93] shrink-0 ml-2 text-right">${dateLabel}<br>${p.records.length}건</div>
    </button>`;
  }).join('');
}

window.openPatientDetail = function(idx){
  const p = window._patients[idx];
  if(!p) return;
  window._currentPatientIdx = idx;
  renderPatientList(window._patients);
  renderPatientDetail(p);
};

function renderPatientDetail(p){
  const panel=document.getElementById('patient-detail-panel');
  const recordsHtml = p.records.map((r,ri)=>{
    const d=new Date(r.ts);
    const dateLabel = isNaN(d) ? '' : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    return `<div class="emr-record-list-row"><button onclick="viewPatientRecord(${window._currentPatientIdx},${ri})" class="w-full text-left bg-white border border-[#EDEEF1] rounded-[12px] p-4 flex justify-between items-center active:bg-gray-50 mb-2 hover:shadow-sm transition-shadow">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-[9px] bg-[#F5F6F8] flex items-center justify-center shrink-0"><i data-lucide="file-text" class="w-4 h-4 text-[#8E8E93]"></i></div>
        <div><span class="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">${r.category||'-'}</span><div class="text-[12px] text-[#8E8E93] mt-1">${dateLabel}</div></div>
      </div>
      <i data-lucide="chevron-right" class="w-4 h-4 text-[#8E8E93] shrink-0"></i>
    </button><button type="button" class="emr-delete-record" onclick="deletePatientRecord(${window._currentPatientIdx},${ri})" ${emrDeletingRecord?'disabled':''}>삭제</button></div>`;
  }).join('');
  const cats = [...new Set(p.records.map(r=>r.category||'-'))];
  const latest = p.records[0] || {};
  panel.innerHTML = `
    <div class="max-w-2xl mx-auto p-5 md:p-8">
      <div class="bg-white border border-[#EDEEF1] rounded-[16px] p-5 md:p-6 mb-5">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <div class="font-extrabold text-[24px] text-black">${p.name||'이름 미상'}</div>
              ${latest.gender?`<span class="text-[11px] font-bold text-[#8E8E93] bg-[#F5F6F8] px-2 py-0.5 rounded-full">${latest.gender}</span>`:''}
            </div>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[13px] text-[#3C3C43]">
              <div><span class="text-[#8E8E93]">생년월일</span> · <b>${p.birthDate || latest.birthDate || '미상'}</b></div>
              <div><span class="text-[#8E8E93]">차트번호</span> · <b>${p.chartNumber || '미지정'}</b></div>
            </div>
          </div>
          <button onclick="editChartNumber()" class="bg-black text-white text-[13px] font-semibold px-4 py-2.5 rounded-[10px] shrink-0 flex items-center gap-1.5">
            <i data-lucide="pencil" class="w-3.5 h-3.5"></i> 차트번호 수정
          </button>
        </div>
        <div class="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-[#F0F0F2]">
          ${cats.map(c=>`<span class="text-[11px] font-bold text-[#3C3C43] bg-[#F5F6F8] px-2.5 py-1 rounded-full">${c}</span>`).join('')}
        </div>
      </div>

      <div class="flex items-center justify-between mb-2">
        <div class="text-[13px] font-bold text-[#8E8E93]">문진 기록 (${p.records.length}건)</div>
      </div>
      <p id="record-delete-status" role="status" aria-live="polite" class="text-[13px] text-slate-600 mb-3"></p>
      ${recordsHtml}
    </div>
  `;
  if(window.lucide) lucide.createIcons();
}

window.editChartNumber = function(){
  const p = window._patients[window._currentPatientIdx];
  if(!p) return;
  const val = prompt(`${p.name}님의 차트번호를 입력해 주세요.`, p.chartNumber||'');
  if(val === null) return;
  fetch(CONFIG.SHEET_URL, {
    method:'POST', mode:'no-cors', headers:{'Content-Type':'text/plain;charset=utf-8'},
    body: JSON.stringify({ type:'updateChart', name:p.name, newChartNumber: val.trim() })
  }).then(()=>{
    p.chartNumber = val.trim();
    renderPatientDetail(p);
    renderPatientList(window._patients);
  }).catch((err)=>{ console.error(err); alert('차트번호 수정 요청 중 오류가 발생했습니다.'); });
};

window.viewPatientRecord = function(patientIdx, recIdx){
  const p = window._patients[patientIdx];
  const rec = p && p.records[recIdx];
  if(!rec) return;
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
  if(cat === 'MPS 멘탈'){ MentalEmr.open(parsed,rec); return; }
  if(cat === '심층진료'){ Object.assign(deepFormData, parsed); deepCameFromSearch=true; generateDeepReportAndShow(true); return; }
  if(cat === '다이어트'){ Object.assign(dietFormData, parsed); dietCameFromSearch=true; generateDietReportAndShow(true); return; }
  if(cat === '여성'){ Object.assign(womenFormData, parsed); womenCameFromSearch=true; generateWomenReportAndShow(true); return; }
  if(cat === '통증'){ Object.assign(painFormData, parsed); painCameFromSearch=true; generatePainReportAndShow(true); return; }
  if(cat === '유소년스포츠'){ Object.assign(sportsFormData, parsed); sportsCameFromSearch=true; generateSportsReportAndShow(true); return; }
  if(cat === '산후'){ Object.assign(postpartumFormData, parsed); postpartumCameFromSearch=true; generatePostpartumReportAndShow(true); return; }
  Object.assign(formData, parsed); cameFromSearch=true; generateReportAndShow(true);
};

