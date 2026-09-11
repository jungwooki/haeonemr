/* Keep the completed survey mounted while the patient reads the guides. */
window.openHaeonGuide=function(page='index'){
  if(!['index','process','prescription','treatment'].includes(page)) return;
  const dialog=document.getElementById('haeon-guide-dialog');
  dialog.querySelector('iframe').src='guides/'+page+'.html';
  if(!dialog.open)dialog.showModal();
};
document.getElementById('haeon-guide-close').addEventListener('click',()=>document.getElementById('haeon-guide-dialog').close());
document.getElementById('haeon-guide-dialog').addEventListener('close',()=>document.querySelector('#haeon-guide-dialog iframe').src='about:blank');
