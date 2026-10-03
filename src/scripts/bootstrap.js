/* Separate entry URLs and authentication sessions for shared patient tablets. */
window.unlockStaffEntry=async function(){
 const status=document.getElementById('staff-entry-status');status.textContent='';
 try{await EmrFirebase.requireStaff();document.body.dataset.audience='staff';}
 catch(error){status.textContent=error.message.includes('취소')?'로그인 후 이용할 수 있습니다.':'로그인 연결을 확인해 주세요.';}
};
window.onload=()=>{
 const role=window.location.hash;
 const choice=document.getElementById('entry-choice');
 if(role!=='#staff'&&role!=='#patient'){
  document.body.dataset.audience='choice';document.title='해온한의원 · 고객용 / 병원용';
  document.getElementById('gateway-view').style.display='none';if(choice)choice.hidden=false;return;
 }
 if(choice)choice.hidden=true;
 const staff=role==='#staff';
 document.body.dataset.audience=staff?'staff-locked':'patient';
 document.title=staff?'MPS EMR · 의료진·간호사':'해온한의원 · 환자 문진';
 if(staff){
  document.getElementById('entry-title').textContent='MPS EMR';
  document.getElementById('entry-subtitle').textContent='의료진 · 간호사가 함께하는 진료 공간';
 }
 document.getElementById('gateway-view').style.display='flex';
 if(staff)unlockStaffEntry();
};
// Reload on role changes so previous patient answers and staff UI cannot carry over.
window.addEventListener('hashchange',()=>window.location.reload());
