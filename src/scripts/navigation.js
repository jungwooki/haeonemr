/* ===================== 6. 진행 · 네비게이션 ===================== */
function renderProgress(){
  const fill=document.getElementById('progress-fill');
  const total=getTotalSteps();
  const pct = currentStep<=1 ? 0 : ((currentStep-1)/total)*100;
  fill.style.width=pct+'%';
}
function refreshStep(){
  if(currentStep===1) return;
  const container=document.getElementById('dynamic-container');
  container.innerHTML = sections[currentStep].html();
  if(window.lucide) lucide.createIcons();
  renderProgress();
}
window.updateUI = function(){
  const container=document.getElementById('dynamic-container');
  triggerFadeIn(container);
  document.querySelectorAll('.step-content').forEach(s=>s.classList.remove('active'));
  const bottomAction=document.getElementById('bottom-action'), nextBtn=document.getElementById('next-btn'),
        backBtnLabel=document.getElementById('btn-back-label'), navTitle=document.getElementById('nav-title'),
        scrollContainer=document.getElementById('scroll-container');
  if(currentStep===1){
    document.getElementById('step-1').classList.add('active');
    bottomAction.classList.add('hidden'); backBtnLabel.innerText='메인으로'; navTitle.innerText='소개';
  } else {
    const config=sections[currentStep];
    container.innerHTML=config.html(); container.classList.add('active');
    bottomAction.classList.remove('hidden'); backBtnLabel.innerText='이전'; navTitle.innerText=config.navTitle;
    nextBtn.innerText = (currentStep===getTotalSteps()) ? '완료 및 리포트 생성' : '다음 단계';
  }
  renderProgress(); if(window.lucide) lucide.createIcons();
  if(scrollContainer) scrollContainer.scrollTo(0,0);
};
window.nextStep=function(){ if(currentStep<getTotalSteps()){ currentStep++; updateUI(); } else { saveRecordToSheet(); document.getElementById('app-shell').style.display='none'; showCompletion(); } };
window.prevStep=function(){ if(currentStep>1){ currentStep--; updateUI(); } else { returnToHub(); } };
window.backToForm=function(){
  document.title='해온 AI EMR';
  document.getElementById('report-view').classList.remove('active');
  if(cameFromSearch){
    cameFromSearch=false;
    document.getElementById('search-view').style.display='flex';
  } else {
    document.getElementById('app-shell').style.display='flex';
    currentStep=getTotalSteps(); updateUI();
  }
};
window.resetAll=function(){ if(confirm('모든 입력 내용이 초기화됩니다. 계속하시겠습니까?')) window.location.reload(); };

