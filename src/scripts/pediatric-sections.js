/* ===================== 5. 단계별 컨텐츠 ===================== */
const sections = {
  2:{ navTitle:'기본 정보', html:()=>{
    const old = getAgeGroup()==='old';
    return `
    ${UI.header('아이 정보')}
    ${UI.group(`
      ${UI.inputRow('이름','name','이름 입력')}
      <div class="p-3 px-4 border-b border-[#EDEEF1] bg-white">${UI.segmentedControl('gender',['남아','여아'])}</div>
      ${UI.dateRow('생년월일','birthDate')}
      ${UI.inputRow('체중','weight','0','number','kg')}
      ${UI.inputRow('키','height','0','number','cm')}
    `)}
    ${UI.subhead('건강 상태')}
    ${UI.group(`
      <div class="p-3 px-4 border-b border-[#EDEEF1] bg-white">${UI.segmentedControl('healthStatus',['건강한 편','보통','허약하다'])}</div>
      ${UI.switchRow('감기에 자주 걸린다','frequentColds')}
      ${UI.switchRow('최근 갑자기 허약해진 느낌이다','suddenWeakness')}
    `)}
    ${UI.subhead('가장 불편한 증상')}
    ${UI.textarea('chiefComplaint','어디가 불편해서 오셨나요?')}
    ${old ? `
      ${UI.subhead('건강증진 및 예방 관련')}
      ${UI.group(OPT_HEALTH_PROMO.map(v=>UI.checkRow(v,'healthPromotion',v)).join(''))}
      ${UI.subhead('한의원에서')}
      ${UI.group(OPT_ORIENTAL.map(v=>UI.checkRow(v,'orientalTreatment',v)).join(''))}
    ` : `
      ${UI.subhead('출생 관련')}
      ${UI.group(`
        ${UI.inputRow('출생 시 체중','birthWeight','0','number','kg')}
        <div class="p-3 px-4 border-b border-[#EDEEF1] bg-white">${UI.segmentedControl('deliveryType',['자연분만','제왕절개'])}</div>
        ${UI.switchRow('출생 직후 황달, 감염이 있었다','jaundiceInfection')}
        ${UI.inputRow('모유수유 총 개월','breastFeedingMonth','0','number','개월')}
        ${UI.inputRow('임신 중 모친 질환','momPregnancyIllness','없음')}
      `)}
    `}`;
  }},
  3:{ navTitle:'생활 환경', html:()=>{
    const g = getAgeGroup(); const old = g==='old'; const o = opt(g);
    return `
    ${UI.header('생활 환경')}
    ${UI.subhead('자녀와 함께 생활하는 사람 (다중 선택)')}
    ${UI.group(o.caregivers.map(v=>UI.checkRow(v,'caregivers',v)).join(''))}
    ${UI.group(UI.inputRow('기타','caregiversOther','직접 입력'))}
    ${old ? `
      ${UI.subhead('자녀와 함께 지내는 시간')}
      ${UI.group(`
        ${UI.inputRow('평균 시간','withParentTime','예: 2시간/일')}
        ${UI.inputRow('주로 지내는 사람','withParentPerson','누구와 주로 지내나요?')}
      `)}
    ` : `
      ${UI.subhead('놀이 환경')}
      ${UI.group(`
        ${UI.inputRow('주로 놀아주는 사람','mainPlaymate','누구와 주로 노나요?')}
        ${UI.inputRow('하루 평균 놀이 시간','playTimeAvg','0','number','시간')}
      `)}
      ${UI.subhead('가족 중 가장 좋아하는 사람')}
      ${UI.group(UI.inputRow('좋아하는 사람','favoritePerson','이름 또는 관계'))}
    `}
    ${UI.subhead('교육(양육) 방식')}
    ${UI.group(`
      <div class="p-3 px-4 border-b border-[#EDEEF1] bg-white">${UI.segmentedControl('parentingStyle',['자유로운 편','엄격한 편','기타'])}</div>
      ${UI.inputRow('기타 상세','parentingStyleOther','해당 시 입력')}
    `)}
    ${!old ? `
      ${UI.subhead('대소변 습관')}
      ${UI.group(OPT_POTTY.map(v=>UI.checkRow(v,'potty',v)).join(''))}
      ${UI.subhead('변 상태')}
      ${UI.group(`
        ${OPT_STOOL.map(v=>UI.checkRow(v,'stoolStatus',v)).join('')}
        ${UI.inputRow('일주일 평균 대변 횟수','stoolFreq','0','number','회/주')}
      `)}
    ` : ``}`;
  }},
  4:{ navTitle:'생활 습관', html:()=>{
    const g = getAgeGroup(); const old = g==='old'; const o = opt(g);
    return `
    ${UI.header('생활 습관')}
    ${UI.subhead('식사습관 (다중 선택)')}
    ${UI.group(UI.checkGrid(o.dietHabits,'dietHabits'))}
    ${UI.group(UI.inputRow('알레르기 유발 음식','allergyFood','없음'))}

    ${UI.subhead('수면습관')}
    ${UI.group(`
      <div class="p-3 px-4 border-b border-[#EDEEF1] bg-white">${UI.segmentedControl('sleepAlone',['혼자 잔다','부모와 함께 잔다'])}</div>
      ${UI.switchRow('잠자리 시간이 11시 이후이다','sleepLate11')}
      ${!old ? `
        ${UI.inputRow('낮잠 — 하루 횟수','napFreq','0','number','회')}
        ${UI.inputRow('낮잠 — 시간','napHours','0','number','시간')}
      ` : ``}
      ${UI.switchRow('밤에 자다가 자주 깬다','wakesAtNight')}
      ${old ? UI.switchRow('잠자기 직전까지 스마트폰을 본다','phoneBeforeSleep') : ``}
    `)}

    ${UI.subhead('사회성')}
    ${UI.group(UI.checkGrid(OPT_SOCIAL,'socialTraits'))}
    ${UI.group(UI.inputRow(old?'스마트폰/컴퓨터 사용 시간':'TV/스마트폰 시청 시간','screenTimeHours','0','number','시간/일'))}

    ${UI.subhead('정서 (다중 선택)')}
    ${UI.group(UI.checkGrid(o.emotionTraits,'emotionTraits'))}
    ${UI.subhead('화가 나면')}
    ${UI.group(OPT_ANGER.map(v=>UI.checkRow(v,'angerResponse',v)).join(''))}
    ${UI.group(UI.inputRow('기타 정서 변화','angerOther','있다면 입력'))}

    ${UI.subhead('놀이')}
    ${UI.group(`
      ${UI.inputRow('활동적인 놀이','playActive','예: 축구, 술래잡기')}
      ${UI.inputRow('조용하고 정적인 놀이','playQuiet','예: 그림그리기')}
      ${UI.inputRow('실내 놀이','playIndoor','예: 블록')}
      ${UI.inputRow('야외 놀이','playOutdoor','예: 자전거')}
      ${UI.inputRow('특별히 자주 하는 놀이','playSpecial','있다면 입력')}
      ${UI.inputRow('하루 평균 아빠와 노는 시간','playWithDadHours','0','number','시간/일')}
      ${UI.inputRow('순수 야외활동 횟수','outdoorActivityPerMonth','0','number','회/월')}
      ${UI.inputRow('가족 모두 참여 야외활동','familyOutdoorPerMonth','0','number','회/월')}
    `)}

    ${UI.subhead('교육 활동')}
    ${UI.group(`
      ${UI.checkWithNote('영어','eduEnglish','eduEnglishNote','예: 주 3회')}
      ${UI.checkWithNote('미술','eduArt','eduArtNote','예: 주 1회')}
      ${UI.checkWithNote('음악','eduMusic','eduMusicNote','예: 피아노')}
      ${UI.checkWithNote('방문교육','eduHomeVisit','eduHomeVisitNote','과목')}
      ${UI.inputRow('운동 (종류)','eduExerciseType','예: 태권도, 수영')}
      ${UI.inputRow('기타','eduOther','있다면 입력')}
      ${!old
        ? UI.inputRow('어린이집/놀이학교/학원/유치원 하루 평균 시간','institutionHours','0','number','시간/일')
        : UI.inputRow('일주일 과외(학원) 종류 수','weeklyPrivateEduCount','0','number','종류/주')}
    `)}`;
  }},
  5:{ navTitle:'건강 체크', html:()=>{
    const g = getAgeGroup(); const old = g==='old'; const o = opt(g);
    return `
    ${UI.header('의학적 정보')}
    ${UI.subhead('질병 병력')}
    ${UI.group(`
      ${UI.switchRow('지금까지 수술을 받은 적이 있다','surgeryHistory')}
      ${UI.switchRow('지금까지 입원을 한 적이 있다','hospitalHistory')}
      ${UI.inputRow('유전적 질환','geneticDisease','없음')}
      ${UI.inputRow('기타 알고 있어야 하는 부분','otherMedicalNote','있다면 입력')}
    `)}
    ${UI.subhead('특이체질')}
    ${UI.group(['아토피 피부염','천식 증상'].map(v=>UI.checkRow(v,'specialConstitution',v)).join(''))}
    ${UI.group(UI.inputRow('알레르기, 기타(종류)','allergyOtherType','있다면 입력'))}
    ${!old ? `
      ${UI.subhead('가정 의료')}
      ${UI.group(`
        ${UI.inputRow('열이 날 때 먹이는 약','feverMedicine','약 이름')}
        ${UI.inputRow('열날 때 기타 대응','feverOtherResponse','예: 미온수 마사지')}
        ${UI.inputRow('체하거나 설사할 때 먹이는 약','indigestionMedicine','약 이름')}
        ${UI.inputRow('그때 기타 대응','indigestionOtherResponse','예: 소화제, 죽')}
      `)}
    ` : ``}

    ${UI.header('오장육부 계통 문진')}
    ${UI.subhead('간(肝) 기능 계통')}
    ${UI.group(UI.checkGrid(OPT_LIVER,'sysLiver'))}
    ${UI.subhead('심(心) 기능 계통')}
    ${UI.group(UI.checkGrid(OPT_HEART,'sysHeart'))}
    ${UI.subhead('비(脾) 기능 계통')}
    ${UI.group(UI.checkGrid(o.sysSpleen,'sysSpleen'))}
    ${UI.subhead('폐(肺) 기능 계통')}
    ${UI.group(UI.checkGrid(OPT_LUNG,'sysLung'))}
    ${UI.subhead('신(腎) 기능 계통')}
    ${UI.group(UI.checkGrid(OPT_KIDNEY,'sysKidney'))}

    ${UI.header('마무리')}
    ${UI.group(UI.inputRow('보호자 성함','guardianName','이름 입력'))}
    <p class="text-[13px] font-medium text-[#8E8E93] text-center mt-6">입력하신 정보는 안전하게 보호되며 진료 목적으로만 사용됩니다.</p>`;
  }},
  6:{ navTitle:'정서 · 불안 체크', html:()=>`
    ${UI.header('정서 · 불안 체크리스트')}
    <p class="text-[14px] text-[#3C3C43] leading-[21px] px-2 mb-4">
      이제부터는 <b>아이가 직접</b> 하나씩 읽고, 나에게 맞는다고 생각되면 체크해 주세요. 정답은 없으니 평소 느끼는 대로 답하면 됩니다.
    </p>
    ${UI.subhead('아래 항목 중 나에게 맞는 것을 모두 골라주세요')}
    ${UI.group(UI.checkGrid(OPT_ANXIETY,'anxietyChecklist'))}
    <p class="text-[12px] font-medium text-[#8E8E93] text-center mt-6">이 체크리스트는 정식 심리검사가 아닌 예비 선별용입니다.</p>`
  }
};

