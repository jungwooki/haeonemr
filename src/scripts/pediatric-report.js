/* ===================== 9. 리포트 생성 ===================== */
function generateReportAndShow(skipSave){
  const f=formData, ageGroup=getAgeGroup(), isOld=ageGroup==='old', todayStr=new Date().toLocaleDateString('ko-KR');
  let ageYears=getAgeYears(), ageLabel='미입력';
  if(ageYears!==null){
    const b=new Date(f.birthDate), t=new Date(); const ms=t-b; const exact=ms/(1000*60*60*24*365.25);
    const y=Math.floor(exact), m=Math.floor((exact-y)*12);
    ageLabel=`${f.gender} · 만 ${y}세 ${m}개월`;
  }

  // 인쇄/PDF 저장 시 파일명 = 이름_생년월일_날짜 (브라우저가 문서 제목을 기본 파일명으로 사용)
  const compactDate = (d) => { const p=n=>String(n).padStart(2,'0'); return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}`; };
  const birthCompact = f.birthDate ? f.birthDate.replaceAll('-','') : '생년월일미상';
  const nameForFile = (f.name || '이름미상').trim().replace(/\s+/g,'');
  document.title = `${nameForFile}_${birthCompact}_${compactDate(new Date())}`;

  document.getElementById('rp-name').innerText=f.name||'미입력';
  document.getElementById('rp-age').innerText=ageLabel;
  document.getElementById('rp-body').innerText=`${f.height||'0'}cm / ${f.weight||'0'}kg`;
  document.getElementById('rp-guardian').innerText=f.guardianName||'미입력';
  document.getElementById('rp-date').innerText=todayStr;
  document.getElementById('rp-complaint').innerText=f.chiefComplaint||'특이 호소 증상 없음';
  document.getElementById('rp-footer-1').innerText=`측정일: ${todayStr}`;
  document.getElementById('rp-footer-2').innerText=`측정일: ${todayStr}`;
  document.getElementById('rp-footer-3').innerText=`측정일: ${todayStr}`;

  // 페이지 배지 & 3페이지 표시 여부
  document.getElementById('rp-badge-1').innerText = isOld ? '1 / 3' : '1 / 2';
  document.getElementById('rp-badge-2').innerText = isOld ? '2 / 3' : '2 / 2';
  document.getElementById('rp-page-3').style.display = isOld ? 'flex' : 'none';

  // 오장 · 기혈수
  const organ=calcOrganHealth(); const qhs=calcQiHyeolSu(organ);
  drawRadar(organ,'rp-radar'); drawRadar(qhs,'rp-qhs-radar');
  renderLegend('rp-organ-legend', organ, ORGAN_MODERN);
  renderLegend('rp-qhs-legend', qhs, QHS_MODERN);

  // 종합 건강 스코어 (H-Scale) — 오장 평균 + 기혈수 평균 (+8세 이상은 정서 체크 반영)
  const organAvg = Object.values(organ).reduce((a,b)=>a+b,0)/Object.values(organ).length;
  const qhsAvg = Object.values(qhs).reduce((a,b)=>a+b,0)/Object.values(qhs).length;
  const hscaleParts = [organAvg, qhsAvg];
  if(isOld){ const anxCount=f.anxietyChecklist.length; hscaleParts.push(Math.max(8, 100-(anxCount/10)*90)); }
  const hscaleScore = Math.round(hscaleParts.reduce((a,b)=>a+b,0)/hscaleParts.length);
  let hscaleGrade='관찰필요', hscaleColor='#dc2626';
  if(hscaleScore>=80){ hscaleGrade='우수'; hscaleColor='#16a34a'; }
  else if(hscaleScore>=60){ hscaleGrade='양호'; hscaleColor='#65a30d'; }
  else if(hscaleScore>=40){ hscaleGrade='보통'; hscaleColor='#d97706'; }
  document.getElementById('rp-hscale-score').innerText = hscaleScore;
  document.getElementById('rp-hscale-ring').style.background = `conic-gradient(${hscaleColor} ${hscaleScore}%, #EDEEF1 0)`;
  document.getElementById('rp-hscale-grade').innerText = `종합 건강 스코어 ${hscaleScore}점 · ${hscaleGrade}`;
  document.getElementById('rp-hscale-comment').innerText = `오장 균형과 기혈수 밸런스${isOld?', 정서 체크리스트':''}를 종합한 해온 자체 지표입니다. 점수가 높을수록 전반적인 컨디션이 안정적임을 의미합니다.`;

  const weakestOrgan=Object.entries(organ).sort((a,b)=>a[1]-b[1])[0];
  const weakestQhs=Object.entries(qhs).sort((a,b)=>a[1]-b[1])[0];
  const growthText = `현재 아이는 오장 중 <b>${weakestOrgan[0]}(${ORGAN_MODERN[weakestOrgan[0]]})</b> 관련 신호가, 기혈수 중에서는 <b>${weakestQhs[0]}(${QHS_MODERN[weakestQhs[0]]})</b> 영역이 또래 대비 상대적으로 약한 편으로 나타났습니다. `
    + `쉽게 말해 ${weakestOrgan[0]==='간'?'쉽게 예민해지거나 피로가 잘 회복되지 않는 경향':weakestOrgan[0]==='심'?'정서적으로 불안정하거나 잠을 깊이 못 자는 경향':weakestOrgan[0]==='비'?'소화흡수력이 약해 잘 못 먹거나 살이 잘 안 붙는 경향':weakestOrgan[0]==='폐'?'감기·비염 등 호흡기 쪽에 취약한 경향':'성장·비뇨기계 기초 체력이 다소 약한 경향'}이 있을 수 있어, 진료실에서 이 부분을 중심으로 체질에 맞는 관리 계획을 세워드리겠습니다.`;
  document.getElementById('rp-growth-diagnosis').innerHTML=growthText;

  // 성장 백분위
  const genderKey = f.gender==='여아' ? 'female' : 'male';
  const ref = growthReferenceData[genderKey];
  const height=parseFloat(f.height)||0, weight=parseFloat(f.weight)||0;
  const ageForChart = ageYears!==null ? Math.min(Math.max(ageYears,2),18) : 6;
  const rH={p3:interpolateAtAge(ageForChart,ref.ages,ref.height.p3),p10:interpolateAtAge(ageForChart,ref.ages,ref.height.p10),p25:interpolateAtAge(ageForChart,ref.ages,ref.height.p25),p50:interpolateAtAge(ageForChart,ref.ages,ref.height.p50),p75:interpolateAtAge(ageForChart,ref.ages,ref.height.p75),p90:interpolateAtAge(ageForChart,ref.ages,ref.height.p90),p97:interpolateAtAge(ageForChart,ref.ages,ref.height.p97)};
  const rW={p3:interpolateAtAge(ageForChart,ref.ages,ref.weight.p3),p10:interpolateAtAge(ageForChart,ref.ages,ref.weight.p10),p25:interpolateAtAge(ageForChart,ref.ages,ref.weight.p25),p50:interpolateAtAge(ageForChart,ref.ages,ref.weight.p50),p75:interpolateAtAge(ageForChart,ref.ages,ref.weight.p75),p90:interpolateAtAge(ageForChart,ref.ages,ref.weight.p90),p97:interpolateAtAge(ageForChart,ref.ages,ref.weight.p97)};
  const pctH = height?calcPercentile(height,rH):50, pctW = weight?calcPercentile(weight,rW):50;
  document.getElementById('rp-height-comment').innerText = height?`${height}cm · 약 ${pctH}th 백분위 · ${getHeightComment(pctH)}`:'키 정보 미입력';
  document.getElementById('rp-weight-comment').innerText = weight?`${weight}kg · 약 ${pctW}th 백분위 · ${getWeightComment(pctW)}`:'체중 정보 미입력';
  if(rpHeightChart) rpHeightChart.destroy(); if(rpWeightChart) rpWeightChart.destroy();
  rpHeightChart = drawGrowthChart('rp-height-chart', ref, ref.ages, 'height', ageForChart, height||rH.p50, '#0284c7');
  rpWeightChart = drawGrowthChart('rp-weight-chart', ref, ref.ages, 'weight', ageForChart, weight||rW.p50, '#059669');

  const bmi = (height&&weight) ? (weight/((height/100)*(height/100))) : null;
  let bmiText='BMI를 계산하려면 키와 체중을 입력해 주세요.';
  if(bmi){
    let status='정상 범위'; if(bmi<15) status='저체중 경향'; else if(bmi>21) status='과체중 경향';
    bmiText=`BMI ${bmi.toFixed(1)} · ${status}. 키 백분위(${pctH}th)와 체중 백분위(${pctW}th)를 함께 고려하면, ${pctH>pctW+15?'체중 대비 마른 체형':pctW>pctH+15?'키 대비 체중이 많이 나가는 체형':'키와 체중의 균형이 잡힌 체형'}으로 판단됩니다.`;
  }
  document.getElementById('rp-bmi-summary').innerText=bmiText;

  const lifestyleLines=[];
  if(f.sleepAlone) lifestyleLines.push(`수면: ${f.sleepAlone}${f.sleepLate11?' · 취침 11시 이후':''}${f.wakesAtNight?' · 자다가 자주 깸':''}`);
  if(f.dietHabits.length) lifestyleLines.push(`식습관: ${f.dietHabits.slice(0,3).join(', ')}${f.dietHabits.length>3?' 등':''}`);
  if(!isOld && (f.stoolStatus.length||f.stoolFreq)) lifestyleLines.push(`배변: ${f.stoolStatus.join(', ')||'특이사항 없음'}${f.stoolFreq?` · 주 ${f.stoolFreq}회`:''}`);
  if(f.screenTimeHours) lifestyleLines.push(`${isOld?'스마트폰/컴퓨터':'영상 시청'}: 하루 약 ${f.screenTimeHours}시간`);
  if(f.caregivers.length) lifestyleLines.push(`동거인: ${f.caregivers.join(', ')}`);
  document.getElementById('rp-lifestyle').innerHTML = lifestyleLines.length? lifestyleLines.map(l=>`<div class="mb-1.5">• ${l}</div>`).join('') : '<div>입력된 생활습관 정보가 없습니다.</div>';

  const tips=[];
  tips.push('단백질(살코기·생선·계란·콩류)과 칼슘(멸치·우유·두부)을 매일 고루 섭취하도록 해주세요.');
  tips.push('성장호르몬은 깊은 잠에서 많이 분비되므로, 밤 10시 이전 취침과 하루 9~11시간 수면을 지켜주세요.');
  tips.push('줄넘기·농구·수영처럼 성장판을 자극하는 운동을 주 3회 이상, 하루 30분 이상 해주면 좋습니다.');
  if(parseFloat(f.screenTimeHours)>=3) tips.push('현재 화면 시청 시간이 다소 긴 편이니, 야외활동 시간을 조금씩 늘려보는 것을 권해드립니다.');
  if(pctH<25) tips.push('키 백분위가 다소 낮은 편이니, 정기적인 성장 경과 관찰을 함께 해보시길 권합니다.');
  document.getElementById('rp-growth-tips').innerHTML = tips.map(t=>`<div class="mb-1.5">• ${t}</div>`).join('');

  const topPatternLabel = weakestOrgan[0]+'('+ORGAN_MODERN[weakestOrgan[0]]+')';
  document.getElementById('rp-overall-opinion').innerText =
    `주소증 "${f.chiefComplaint||'특이 증상 없음'}"과 문진 응답을 종합하면 ${topPatternLabel} 영역의 관리가 우선적으로 필요해 보입니다. 성장은 ${getHeightComment(pctH)} 진료실에서 아이 체질과 성장 속도에 맞춘 한방 관리 계획과 생활습관 코칭을 함께 안내해 드리겠습니다.`;

  // 정서 · 불안 (8세 이상)
  if(isOld){
    const count=f.anxietyChecklist.length;
    document.getElementById('rp-anxiety-count').innerText=`${count}/10`;
    const pct=(count/10)*100;
    let color='#16a34a', level='낮음 — 특별한 정서적 어려움 신호는 적어 보입니다.', comment='현재 응답만으로는 뚜렷한 불안 신호가 크지 않습니다. 평소처럼 아이의 마음 상태에 관심을 가져주세요.';
    if(count>=6){ color='#dc2626'; level='상담 권장 — 정서적으로 힘든 부분이 있어 보입니다.'; comment='체크된 항목이 많은 편입니다. 전문 심리상담 또는 정신건강의학과 평가를 함께 받아보시길 권해 드립니다.'; }
    else if(count>=3){ color='#d97706'; level='관찰 필요 — 몇 가지 긴장·불안 신호가 있습니다.'; comment='일상에서 아이가 스트레스를 받는 상황이 없는지 살펴봐 주시고, 지속되면 전문가 상담을 고려해 보세요.'; }
    document.getElementById('rp-anxiety-ring').style.background=`conic-gradient(${color} ${pct}%, #EDEEF1 0)`;
    document.getElementById('rp-anxiety-level').innerText=level;
    document.getElementById('rp-anxiety-comment').innerText=comment;
    document.getElementById('rp-anxiety-items').innerHTML = f.anxietyChecklist.length
      ? f.anxietyChecklist.map(v=>`<span class="rp-chip">${v}</span>`).join('')
      : `<span class="text-[13px] text-[#8E8E93]">체크된 항목이 없습니다.</span>`;
  }

  document.getElementById('app-shell').style.display='none';
  const _rv=document.getElementById('report-view'); _rv.classList.add('active'); triggerFadeIn(_rv.querySelector('.report-scroll'));
  if(window.lucide) lucide.createIcons();
  const statusEl=document.getElementById('save-status'); if(statusEl) statusEl.innerText='';
    document.getElementById('rp-doctor-note-slot').innerHTML = doctorNoteBoxHtml('rp');
  document.getElementById('rp-private-note-slot').innerHTML = privateNoteBoxHtml('rp');
  fillNoteBoxes('rp');
  if(window.lucide) lucide.createIcons();
if(!skipSave) saveRecordToSheet();
}

