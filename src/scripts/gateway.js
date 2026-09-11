/* ===================== 허브(입구) 내비게이션 ===================== */
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

