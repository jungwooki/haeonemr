/* ===================== 작성 완료 (환자용 - 결과 비공개) ===================== */
window.showCompletion = function(){
  document.getElementById('completion-view').style.display='flex';
  triggerFadeIn(document.getElementById('completion-view'));
};
window.returnToHubFromCompletion = function(){
  document.getElementById('completion-view').style.display='none';
  ['app-shell','deep-app-shell','diet-app-shell','women-app-shell','pain-app-shell','sports-app-shell','postpartum-app-shell'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display='none';
  });
  returnToHub();
};


