const EmrStaffAccounts=(()=>{
 const users=[['admin','admin'],['jung-jieun','정지은'],['han-yookyung','한유경'],['lee-jungwook','이정욱'],['park-soohyun','박수현'],['yoo-seungmi','유승미'],['lee-namhee','이남희'],['lim-sehee','임세희'],['cho-naekyung','조내경'],['jung-kyungah','정경아']];
 function email(id){if(!users.some(u=>u[0]===id))throw Error('등록된 계정을 선택해 주세요.');return id==='admin'?CONFIG.ADMIN_EMAIL:id+'@staff.mps-emr.invalid';}
 return {users,email};
})();
