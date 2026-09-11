/* ===================== 7. 한의학 분석 (오장/기혈수) ===================== */
function ratio(list,total){ return Math.min(1, list.length/total); }
function healthScore(list,total){ return Math.max(8, Math.round(100 - ratio(list,total)*90)); }
function statusOf(score){
  if(score>=70) return {label:'좋음',color:'#16a34a'};
  if(score>=40) return {label:'보통',color:'#d97706'};
  return {label:'관찰필요',color:'#dc2626'};
}
function calcOrganHealth(){
  const f=formData, spleenTotal = opt(getAgeGroup()).sysSpleen.length;
  return {
    '간': healthScore(f.sysLiver, OPT_LIVER.length),
    '심': healthScore(f.sysHeart, OPT_HEART.length),
    '비': healthScore(f.sysSpleen, spleenTotal),
    '폐': healthScore(f.sysLung, OPT_LUNG.length),
    '신': healthScore(f.sysKidney, OPT_KIDNEY.length)
  };
}
function calcQiHyeolSu(organ){
  const f=formData;
  const sleepIssue = ((f.wakesAtNight?1:0)+(f.sleepLate11?1:0))/2;
  const sleepScore = Math.max(8, Math.round(100 - sleepIssue*90));
  return {
    '기': Math.round((organ['비']+organ['폐'])/2),
    '혈': Math.round((organ['간']+organ['심'])/2),
    '수': Math.round((organ['신']+sleepScore)/2)
  };
}
const ORGAN_MODERN = {'간':'피로회복력 · 예민도','심':'정서안정 · 수면의 질','비':'소화흡수 · 식욕','폐':'호흡기 면역력','신':'성장 · 비뇨계 기초체력'};
const QHS_MODERN = {'기':'에너지 · 활력','혈':'혈액순환 · 영양공급','수':'수분대사 · 회복력'};

function drawRadar(data, containerId){
  const keys=Object.keys(data); const size=220, center=size/2, radius=center*0.6, n=keys.length;
  let svg=`<svg width="${size}" height="${size}" class="overflow-visible">`;
  [0.25,0.5,0.75,1].forEach(lvl=>{
    const pts=keys.map((_,i)=>{ const a=(Math.PI*2*i)/n - Math.PI/2; const r=lvl*radius; return `${center+r*Math.cos(a)},${center+r*Math.sin(a)}`; }).join(' ');
    svg+=`<polygon points="${pts}" fill="none" stroke="#EDEEF1" stroke-width="1.2"/>`;
  });
  keys.forEach((_,i)=>{ const a=(Math.PI*2*i)/n - Math.PI/2; svg+=`<line x1="${center}" y1="${center}" x2="${center+radius*Math.cos(a)}" y2="${center+radius*Math.sin(a)}" stroke="#EDEEF1" stroke-width="1.2"/>`; });
  const dPts=keys.map((k,i)=>{ const a=(Math.PI*2*i)/n - Math.PI/2; const r=(data[k]/100)*radius; return `${center+r*Math.cos(a)},${center+r*Math.sin(a)}`; }).join(' ');
  svg+=`<polygon points="${dPts}" fill="rgba(99,102,241,0.16)" stroke="#6366F1" stroke-width="2.5" stroke-linejoin="round"/>`;
  keys.forEach((k,i)=>{ const a=(Math.PI*2*i)/n - Math.PI/2; const r=radius+20; svg+=`<text x="${center+r*Math.cos(a)}" y="${center+r*Math.sin(a)}" text-anchor="middle" dominant-baseline="middle" font-size="12" font-weight="800" fill="#8E8E93">${k}</text>`; });
  svg+='</svg>';
  document.getElementById(containerId).innerHTML=svg;
}
function renderLegend(containerId, data, modernMap){
  const html=Object.entries(data).map(([k,v])=>{
    const st=statusOf(v);
    return `<div class="rp-organ-row"><span><span class="rp-status-dot" style="background:${st.color}"></span><b>${k}</b> · ${modernMap[k]}</span><span style="color:${st.color};font-weight:700">${st.label}</span></div>`;
  }).join('');
  document.getElementById(containerId).innerHTML=html;
}

