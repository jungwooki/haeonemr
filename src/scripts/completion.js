/* ===================== 작성 완료 (환자용 - 결과 비공개) ===================== */
window.showCompletion = function(){
  document.getElementById('completion-view').style.display='flex';
  triggerFadeIn(document.getElementById('completion-view'));
};
window.returnToHubFromCompletion = function(){
  // A new page clears every questionnaire model, textarea, chart and in-memory draft.
  window.location.reload();
};
