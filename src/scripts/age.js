/* ===================== 2. 나이 분기 ===================== */
function getAgeYears(birthDate=formData.birthDate, today=new Date()){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(birthDate || '')) return null;
  const [year,month,day]=birthDate.split('-').map(Number);
  const birth=new Date(year,month-1,day);
  if(birth.getFullYear()!==year || birth.getMonth()!==month-1 || birth.getDate()!==day || birth>today) return null;
  let age=today.getFullYear()-year;
  if(today.getMonth()<month-1 || (today.getMonth()===month-1 && today.getDate()<day)) age--;
  return age;
}
function formatAgeFromBirthDate(birthDate){
  const age=getAgeYears(birthDate);
  return age===null ? '생년월일 미입력' : `만 ${age}세`;
}
function getAgeGroup(){ const a=getAgeYears(); return (a!==null && a>=8) ? 'old' : 'young'; }
function getTotalSteps(){ return getAgeGroup()==='old' ? 6 : 5; }

