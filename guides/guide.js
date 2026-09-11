const guide=JSON.parse(document.getElementById('guide-data').textContent);
const grid=document.getElementById('guide-grid'),filters=document.getElementById('guide-filters'),search=document.getElementById('guide-search'),dialog=document.getElementById('guide-detail');
let category='전체';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={indication:'적응 증상들',summary:guide.kind==='diagnostic'?'검사 소개':'치료 소개',tcm_story:'한의학적 설명',analogy:'쉽게 이해하기',scientific_evidence:'작용 설명',mechanism:guide.kind==='diagnostic'?'검사 원리':'치료 원리',ingredients:'구성 약재',note:'복용 및 참고 안내'};
const prescriptionNotice = guide.kind==='prescription' ? `<p class="prescription-notice">참고로, 한약은 다른 병이라도 같은 약이 처방 될 수 있으며, 같은 병이라도 다른 약이 처방 될 수 있습니다. '변증'이 우선되기 때문입니다</p>` : '';
function chart(data){
 const names={diag_precision:'정밀도',diag_speed:'신속성',diag_comfort:'편안함',diag_scope:'정보량',qi_def:'기허',qi_stag:'기울',qi_counter:'기역',blood_def:'혈허',blood_stasis:'어혈',fluid:'수체',yin_def:'음허',phase_inflam:'어혈/염증기',phase_prolif:'재생/증식기',phase_remodel:'리모델링기',phase_maint:'유지/재활기'};
 const keys=Object.keys(data),point=(i,r)=>{const a=i*2*Math.PI/keys.length-Math.PI/2;return [180+Math.cos(a)*r,180+Math.sin(a)*r];};
 return `<svg viewBox="0 0 360 360" role="img" aria-label="${esc(keys.map(k=>names[k]+': '+data[k]).join(', '))}">${[25,50,75,100].map(r=>`<polygon points="${keys.map((_,i)=>point(i,r).join(',')).join(' ')}" fill="none" stroke="#E2E8F0"/>`).join('')}<polygon points="${keys.map((k,i)=>point(i,data[k]).join(',')).join(' ')}" fill="#2563EB22" stroke="#2563EB" stroke-width="2"/>${keys.map((k,i)=>{const [x,y]=point(i,138);return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#475569">${names[k]} ${data[k]}</text>`;}).join('')}</svg>`;
}
function treatmentIcon(item){
 return ['treatment','diagnostic'].includes(guide.kind) && item.icon ? `<span class="treatment-icon" aria-hidden="true">${esc(item.icon)}</span>` : '';
}
function openItem(item){
 document.getElementById('guide-detail-title').innerHTML=treatmentIcon(item)+esc(item.name);
 const style=guide.styles[item.type]||{};
 dialog.querySelector('article').innerHTML=`${prescriptionNotice}<span class="guide-tag">${esc(item.category)}</span><p class="guide-muted">${esc(style.label||'')} ${esc(style.desc||'')}</p>${(item.symptoms||item.tags||[]).map(t=>`<span class="guide-tag">${esc(t)}</span>`).join('')}${Object.entries(labels).filter(([k])=>item[k]).map(([k,label])=>`<section><h3>${label}</h3>${Array.isArray(item[k])?`<ul>${item[k].map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`:`<p>${esc(item[k])}</p>`}</section>`).join('')}${item.chart?chart(item.chart):''}`;
 dialog.showModal();
}
function render(){
 const term=search.value.trim().toLowerCase();const items=guide.data.filter(item=>(category==='전체'||item.category===category)&&[item.name,item.code,item.indication,item.summary,...(item.tags||item.symptoms||[])].join(' ').toLowerCase().includes(term));
 document.getElementById('guide-count').textContent=items.length+'개 안내';grid.replaceChildren();
 for(const item of items){const button=document.createElement('button');button.className='guide-card';button.setAttribute('aria-label',item.name+' ('+item.category+') 상세 보기');button.innerHTML=guide.kind==='prescription' ? `<h2>${esc(item.name)}</h2><p class="guide-muted">${esc(item.indication)}</p>` : `<span class="guide-tag">${esc(item.category)}</span><h2>${treatmentIcon(item)}${esc(item.name)}</h2><p class="guide-muted">${esc(item.summary||item.indication)}</p><p style="color:#2563EB;margin-top:20px;font-weight:700">자세히 보기 →</p>`;button.onclick=()=>openItem(item);grid.append(button);}
 if(!items.length)grid.textContent='검색 결과가 없습니다. 다른 단어로 검색해 주세요.';
 for(const button of filters.children)button.setAttribute('aria-pressed',String(button.textContent===category));
}
for(const name of guide.categories){const button=document.createElement('button');button.textContent=name;button.onclick=()=>{category=name;render();};filters.append(button);}
search.addEventListener('input',render);dialog.querySelector('button').onclick=()=>dialog.close();render();
