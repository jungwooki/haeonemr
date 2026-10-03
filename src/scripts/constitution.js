window.GrowthConstitution=(()=>{
  const {QUESTIONS,CATEGORY_INFO,ACTIVITY_QUESTIONS}=GrowthConstitutionData;
  const category='유소년스포츠 (성장체질)', labels=['전혀 아니에요','아닌 편이에요','보통이에요','그런 편이에요','매우 그래요'];
  let step=-1, data={}, saving=false, attempted=false;
  const el=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function enter(){data={name:'',parent:'',dob:'',gender:'',answers:{},activityAnswers:{},requestId:crypto.randomUUID(),schemaVersion:1};step=-1;attempted=false;el('hub-view').style.display='none';el('constitution-survey').hidden=false;render();}
  function render(){
    el('gc-status').textContent='';el('gc-counter').textContent=step<0?'성장체질':`${Math.min(step+1,38)} / 38`;
    el('gc-progress-fill').style.width=`${Math.max(0,step)/38*100}%`;
    if(step<0){el('gc-content').innerHTML=`<span class="gc-eyebrow">GROWTH & BALANCE</span><h1>유소년스포츠<br>(성장체질)</h1><p>선수의 훈련과 회복, 몸의 신호를 살펴봅니다.<br>보호자와 선수가 함께 38개 문항에 답해주세요.</p><form id="gc-intro"><div class="gc-fields"><label>선수 이름<input name="name" required maxlength="80" value="${esc(data.name)}" autocomplete="name"></label><label>보호자 이름<input name="parent" required maxlength="80" value="${esc(data.parent)}"></label><label>생년월일<input name="dob" type="date" required max="${new Date().toLocaleDateString('en-CA')}" value="${esc(data.dob)}"></label><label>성별<select name="gender" required><option value="">선택해주세요</option><option ${data.gender==='남'?'selected':''}>남</option><option ${data.gender==='여'?'selected':''}>여</option></select></label></div><p>작성 결과는 진료 시 의료진이 EMR에서 확인합니다.</p><button class="gc-primary">문진 시작하기</button></form>`;el('gc-intro').onsubmit=e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.target));if(!values.name.trim()||!values.parent.trim())return;Object.assign(data,values,{name:values.name.trim(),parent:values.parent.trim()});step=0;render();};return;}
    if(step===38){el('gc-content').innerHTML='<span class="gc-eyebrow">READY TO SUBMIT</span><h1>모든 문항을 작성했어요.</h1><p>활동량 8문항과 성장체질 30문항을 작성했습니다.<br>제출 후 결과는 의료진의 EMR 기록으로 전달됩니다.</p><button class="gc-primary" id="gc-submit">제출하기</button>';el('gc-submit').onclick=submit;return;}
    const activity=step<8,q=activity?ACTIVITY_QUESTIONS[step]:QUESTIONS[step-8],selected=activity?data.activityAnswers[q.id]:data.answers[q.id];
    el('gc-content').innerHTML=`<span class="gc-eyebrow">${activity?'01 · 활동량 / '+esc(q.section):'02 · 성장체질'}</span><h1>${esc(q.text)}</h1><p>${esc(q.help||'평소 몸의 상태를 기준으로 가장 가까운 답을 선택해주세요.')}</p><div id="gc-options" class="gc-options"></div><button id="gc-next" class="gc-primary">${step===37?'작성 내용 확인':'다음 문항'}</button>`;
    if(q.type==='number'){
      el('gc-options').innerHTML=`<label>${esc(q.unit)}<input id="gc-number" class="gc-number" type="number" min="${q.min}" max="${q.max}" step="${q.step}" required value="${esc(selected??'')}" aria-label="${esc(q.text)}"></label>`;
      el('gc-next').onclick=()=>{const input=el('gc-number');if(!input.reportValidity())return;data.activityAnswers[q.id]=Number(input.value);step++;render();};
    }else{
      const opts=activity?q.options:labels.map((label,i)=>({label,value:i+1}));
      opts.forEach(o=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',String((activity?selected?.value:selected)===o.value));b.innerHTML=esc(o.label)+(o.sub?`<small>${esc(o.sub)}</small>`:'');b.onclick=()=>{if(activity)data.activityAnswers[q.id]={...o};else data.answers[q.id]=o.value;step++;render();};el('gc-options').append(b);});
      el('gc-next').hidden=true;
    }
    el('constitution-survey').scrollTop=0;
  }
  function back(){if(saving||attempted){el('gc-status').textContent='제출 결과를 확인 중입니다. 제출 버튼으로 저장 여부를 다시 확인해주세요.';return;}if(step<0){el('constitution-survey').hidden=true;returnToHub();}else{step--;render();}}
  async function findSaved(){return (await EmrFirebase.receipt(data.requestId)).state==='complete';}
  async function submit(){
    if(saving)return;if(!isEmrConfigured()){el('gc-status').textContent='저장소 설정이 필요합니다.';return;}saving=true;el('gc-submit').disabled=true;
    try{
      el('gc-status').textContent='저장 여부를 확인하고 있습니다…';
      let saved=await findSaved();
      if(!saved&&!attempted){attempted=true;await emrStoreRequest(CONFIG.STORE_URL,{method:'POST',body:JSON.stringify({category,name:data.name,birthDate:data.dob,gender:data.gender,formData:data})});for(let i=0;i<4&&!saved;i++){await new Promise(r=>setTimeout(r,1000));saved=await findSaved();}}
      if(!saved)throw Error('저장 확인이 지연되고 있습니다. 잠시 후 다시 확인해주세요. 중복 제출은 하지 않습니다.');
      attempted=false;el('constitution-survey').hidden=true;showCompletion();
    }catch(error){attempted=false;el('gc-status').textContent=attempted?'저장 완료를 확인하지 못했습니다. 잠시 후 저장 확인을 다시 눌러주세요.': '연결하지 못했습니다. 연결 상태를 확인하고 다시 제출해주세요.';el('gc-submit').textContent=attempted?'저장 확인 다시 하기':'다시 제출하기';}finally{saving=false;el('gc-submit').disabled=false;}
  }
  function scores(answers){return Object.keys(CATEGORY_INFO).map(subject=>{const qs=QUESTIONS.filter(q=>q.category===subject);return {subject,value:Math.round(qs.reduce((n,q)=>n+answers[q.id]*(q.weight/10),0)/qs.reduce((n,q)=>n+5*(q.weight/10),0)*100)};});}
  function open(record,meta){
    if(!record.answers||!record.activityAnswers||QUESTIONS.some(q=>!Number.isInteger(record.answers[q.id])||record.answers[q.id]<1||record.answers[q.id]>5)){alert('성장체질 응답 데이터가 올바르지 않습니다.');el('search-view').style.display='flex';return;}
    const result=scores(record.answers),top=[...result].sort((a,b)=>b.value-a.value)[0],info=CATEGORY_INFO[top.subject],a=record.activityAnswers;
    el('constitution-report-view').classList.add('active');
    el('gc-rp-info').innerHTML=[['선수',record.name],['보호자',record.parent],['생년월일',record.dob],['성별',record.gender],['작성일',new Date(meta.ts).toLocaleDateString('ko-KR')]].map(([k,v])=>`<div class="rp-info-item"><div class="rp-info-label">${k}</div><div class="rp-info-value">${esc(v)}</div></div>`).join('');
    el('gc-rp-result').innerHTML=`<div class="gc-result-hero"><div class="gc-eyebrow">성장체질 · 주요 응답 경향</div><h2>${esc(top.subject)} · ${esc(info.name)}</h2><p>${esc(info.desc)}</p></div><div>${result.map(r=>`<div class="gc-score"><b>${r.subject}</b><div class="gc-score-track"><i style="width:${r.value}%"></i></div><span>${r.value}%</span></div>`).join('')}</div><div class="gc-guidance"><h3>주간 활동량</h3><p>총 훈련 ${Number(a.team_training_sessions)+Number(a.individual_training_sessions)}회 · ${Number(a.team_training_hours)+Number(a.individual_training_hours)}시간<br>Training Load: ${Math.round((Number(a.team_training_hours)+Number(a.individual_training_hours))*60*Number(a.intensity?.rpe||0))} AU · 경기 ${Number(a.matches_per_week)*Number(a.match_minutes)}분 / 주<br>완전 휴식 ${esc(a.rest_days)}일 / 주</p><h3>유형별 식사 안내</h3>${[['평소',info.diet.daily],['경기 전',info.diet.pre],['경기 후',info.diet.post],['수면',info.sleep]].map(([k,v])=>`<p><b>${k}</b><br>${esc(v)}</p>`).join('')}<h3>아침 회복 루틴</h3>${info.morning.map(v=>`<p>${esc(v)}</p>`).join('')}<h3>성장체질 유형 안내</h3>${Object.entries(CATEGORY_INFO).map(([k,v])=>`<p><b>${k} · ${esc(v.name)}</b><br>${esc(v.fullDefinition)}</p>`).join('')}</div>`;
    el('gc-rp-answers').innerHTML=ACTIVITY_QUESTIONS.map(q=>`<p class="gc-answer">${esc(q.text)}<br><b>${esc(q.type==='choice'?a[q.id]?.label:a[q.id])} ${esc(q.unit||'')}</b></p>`).join('')+QUESTIONS.map(q=>`<p class="gc-answer">${q.id}. ${esc(q.text)}<br><b>${esc(labels[record.answers[q.id]-1])} (${record.answers[q.id]}/5)</b></p>`).join('');
    el('gc-rp-doctor-note-slot').innerHTML=doctorNoteBoxHtml('gc-rp');el('gc-rp-private-note-slot').innerHTML=privateNoteBoxHtml('gc-rp');fillNoteBoxes('gc-rp');
  }
  async function close(){if(!await emrCanNavigate())return;el('constitution-report-view').classList.remove('active');el('search-view').style.display='flex';}
  return {enter,back,open,close,scores,isSaving:()=>saving};
})();
