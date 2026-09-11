/* ===================== 메인 화면 내비게이션 ===================== */
window.enterChildSurvey = function(){
  document.getElementById('hub-view').style.display='none';
  const shell=document.getElementById('app-shell'); shell.style.display='flex'; triggerFadeIn(shell);
  currentStep=1; updateUI();
};
window.enterPlaceholder = function(label){
  alert(`${label} 문진은 준비 중입니다. 곧 추가될 예정이에요.`);
};
window.showSurveyList = function(){
  document.getElementById('gateway-view').style.display='none';
  const hub=document.getElementById('hub-view'); hub.style.display='flex'; triggerFadeIn(hub);
};
window.backToGateway = function(){
  document.getElementById('hub-view').style.display='none';
  const gw=document.getElementById('gateway-view'); gw.style.display='flex'; triggerFadeIn(gw);
};
window.returnToHub = function(){
  document.getElementById('app-shell').style.display='none';
  const hub=document.getElementById('hub-view'); hub.style.display='flex'; triggerFadeIn(hub);
};


// Returning home discards in-memory drafts only after explicit confirmation.
window.goToMainScreen = function(){
  const dialog=document.getElementById('main-screen-confirm');
  document.getElementById('main-screen-confirm-status').textContent='';
  if(!dialog.open) dialog.showModal();
};
window.confirmMainScreen = function(){
  if(window.MpsMental && MpsMental.isSaving()){
    document.getElementById('main-screen-confirm-status').textContent='저장 중입니다. 저장이 끝난 후 다시 이동해 주세요.';
    return;
  }
  window.location.reload();
};
