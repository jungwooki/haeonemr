/* ===================== 1. State ===================== */
let currentStep = 1;
const formData = {
  name:'', gender:'남아', birthDate:'', weight:'', height:'',
  healthStatus:'건강한 편', frequentColds:false, suddenWeakness:false, chiefComplaint:'',
  // 0~7세 전용
  birthWeight:'', deliveryType:'자연분만', jaundiceInfection:false, breastFeedingMonth:'', momPregnancyIllness:'',
  // 8세 이상 전용
  healthPromotion:[], orientalTreatment:[],
  // 생활환경
  caregivers:[], caregiversOther:'', mainPlaymate:'', playTimeAvg:'', favoritePerson:'',
  withParentTime:'', withParentPerson:'', parentingStyle:'자유로운 편', parentingStyleOther:'',
  potty:[], stoolStatus:[], stoolFreq:'',
  // 생활습관
  dietHabits:[], allergyFood:'', sleepAlone:'혼자 잔다', sleepLate11:false,
  napFreq:'', napHours:'', wakesAtNight:false, phoneBeforeSleep:false,
  socialTraits:[], screenTimeHours:'', emotionTraits:[], angerResponse:[], angerOther:'',
  playActive:'', playQuiet:'', playIndoor:'', playOutdoor:'', playSpecial:'',
  playWithDadHours:'', outdoorActivityPerMonth:'', familyOutdoorPerMonth:'',
  eduEnglish:false, eduEnglishNote:'', eduArt:false, eduArtNote:'', eduMusic:false, eduMusicNote:'',
  eduHomeVisit:false, eduHomeVisitNote:'', eduExerciseType:'', eduOther:'',
  institutionHours:'', weeklyPrivateEduCount:'',
  // 건강 Part4
  surgeryHistory:false, hospitalHistory:false, geneticDisease:'', otherMedicalNote:'',
  specialConstitution:[], allergyOtherType:'',
  feverMedicine:'', feverOtherResponse:'', indigestionMedicine:'', indigestionOtherResponse:'',
  sysLiver:[], sysHeart:[], sysSpleen:[], sysLung:[], sysKidney:[],
  guardianName:'',
  // 정서 · 불안 체크(8세 이상)
  anxietyChecklist:[]
};

window.updateData = function(key,val){ formData[key]=val; };
window.updateCheck = function(cat,val,checked){
  if(checked){ if(!formData[cat].includes(val)) formData[cat].push(val); }
  else{ formData[cat]=formData[cat].filter(i=>i!==val); }
};
window.setSegmented = function(field,val,btnEl){
  formData[field]=val;
  const parent=btnEl.parentElement;
  parent.querySelectorAll('button').forEach(b=>{ b.className="flex-1 py-2 text-[15px] font-medium rounded-[7px] text-[#8E8E93] transition-all duration-200"; });
  btnEl.className="flex-1 py-2 text-[15px] font-bold rounded-[7px] bg-white shadow-[0_3px_8px_rgba(0,0,0,0.12)] text-black transition-all duration-200";
};
window.updateBirthDate = function(val){ formData.birthDate=val; refreshStep(); };

