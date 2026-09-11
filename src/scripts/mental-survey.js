/* M-survey is scoped to avoid sharing state with the seven clinical surveys. */
(() => {
  const root=document.getElementById('mental-survey-view');
  const SPORT_ICONS={student:'일반',soccer:'⚽',baseball:'⚾',basketball:'🏀',volleyball:'🏐',golf:'⛳'};
  const SPORTS = JSON.parse(document.getElementById('sports-data').textContent);
  const SPORT_ORDER = ['student','soccer','baseball','basketball','volleyball','golf'];
  const LIKERT_LABELS = ['전혀 그렇지 않다','그렇지 않다','약간 그렇지 않다','약간 그렇다','그렇다','매우 그렇다'];
  const PAGE_SIZE = 6;

  const state = { name:'', gender:'', dob:'', sport:'', items:[], pages:[], currentPage:0, answers:{} };

  function showScreen(id){
    root.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    root.scrollTo(0,0);
    const back=root.querySelector('.mental-back');
    back.textContent=id==='mentalSportScreen'?'← 메인화면':id==='screenInfo'?'← 종목 선택':id==='screenComplete'?'메인화면':'작성 종료';
  }

  SurveyUX.addClearButton(document.getElementById('inputName'));

  // ---------- Screen 1 ----------
  function renderSportChoices(){
    const box = document.getElementById('sportChoices');
    box.innerHTML = SPORT_ORDER.map(key=>{
      const s = SPORTS[key];
      return `
        <button type="button" class="sport-choice sport-btn rounded-xl p-3 flex flex-col items-center gap-1.5 text-slate-500 font-bold text-sm" data-val="${key}">
          <span class="mental-sport-icon" aria-hidden="true">${SPORT_ICONS[key]}</span>
          <span>${key==='student'?'일반':s.label}</span>
        </button>
      `;
    }).join('');
  }

  function checkStartReady(){
    const ready = state.name.trim() !== '' && state.gender !== '' && SurveyUX.validBirth(state.dob) && state.sport !== '';
    document.getElementById('btnStart').disabled = !ready;
    const dob=document.getElementById('inputDob');
    dob.max=SurveyUX.today();
    const invalid=Boolean(state.dob&&!SurveyUX.validBirth(state.dob));
    dob.setAttribute('aria-invalid',String(invalid));
    document.getElementById('mental-info-hint').textContent=invalid?'생년월일을 오늘 이전의 실제 날짜로 입력해 주세요.':ready?'기본 정보 입력이 완료되었습니다. 서베이를 시작해 주세요.':'이름·성별·생년월일을 모두 입력하면 시작할 수 있습니다.';
  }

  document.getElementById('inputName').addEventListener('input', e=>{
    state.name = e.target.value; checkStartReady();
  });
  document.getElementById('inputDob').addEventListener('change', e=>{
    state.dob = e.target.value; checkStartReady();
  });
  root.addEventListener('click', e=>{
    const g = e.target.closest('.gender-btn');
    if(g){
      root.querySelectorAll('.gender-btn').forEach(b=>{ b.classList.remove('selected'); b.setAttribute('aria-pressed','false'); });
      g.classList.add('selected'); g.setAttribute('aria-pressed','true');
      state.gender = g.dataset.val; checkStartReady();
      return;
    }
    const sp = e.target.closest('.sport-btn');
    if(sp){
      root.querySelectorAll('.sport-btn').forEach(b=>b.classList.remove('selected'));
      sp.classList.add('selected');
      state.sport = sp.dataset.val; checkStartReady();
      document.getElementById('mentalSelectedSport').textContent = state.sport==='student'?'일반':SPORTS[state.sport].label;
      showScreen('screenInfo');
      return;
    }
  });

  document.getElementById('btnStart').addEventListener('click', ()=>{
    if(document.getElementById('btnStart').disabled) return;
    buildItems();
    state.currentPage = 0;
    showScreen('screenSurvey');
    renderPage();
  });

  // ---------- Screen 2 ----------
  function buildItems(){
    const s = SPORTS[state.sport];
    const flat = [];
    s.sections.forEach(sec=>{
      sec.items.forEach(it=>{
        flat.push({ no: it.no, text: it.text, factorKey: sec.key, factorLabel: sec.factor, calc: sec.calc });
      });
    });
    flat.sort((a,b)=>a.no-b.no);
    state.items = flat;
    state.pages = [];
    for(let i=0;i<flat.length;i+=PAGE_SIZE){
      state.pages.push(flat.slice(i, i+PAGE_SIZE));
    }
    state.answers = {};
  }

  function renderPage(){
    const page = state.pages[state.currentPage];
    const qList = document.getElementById('qList');
    qList.innerHTML = page.map(it=>{
      const selected = state.answers[it.no];
      const btns = [1,2,3,4,5,6].map(v=>`
        <button type="button" aria-pressed="${selected===v}" class="likert-btn ${selected===v?'selected':''}" data-no="${it.no}" data-val="${v}">
          <span class="num">${v}</span>
          <span class="lbl">${LIKERT_LABELS[v-1]}</span>
        </button>
      `).join('');
      return `
        <div class="qcard" id="qcard-${it.no}">
          <p class="qtext word-keep" id="qtext-${it.no}">${it.no}. ${it.text}</p>
          <div class="likert-row" role="group" aria-labelledby="qtext-${it.no}">${btns}</div>
        </div>
      `;
    }).join('');

    const totalQ = state.items.length;
    const startNo = page[0].no, endNo = page[page.length-1].no;
    document.getElementById('progressText').innerText = `${state.currentPage+1} / ${state.pages.length} 단계 · 문항 ${startNo}–${endNo}`;

    document.getElementById('btnPrev').disabled = state.currentPage === 0;
    const isLast = state.currentPage === state.pages.length - 1;
    document.getElementById('btnNext').innerHTML = isLast
      ? '제출하기 ✓'
      : '다음 단계 →';
    updateAnswerProgress();
    qList.scrollTo(0,0);
  }

  function updateAnswerProgress(){
    const page=state.pages[state.currentPage]||[];
    const missing=page.filter(item=>!state.answers[item.no]).length;
    const answered=Object.keys(state.answers).length;
    const track=document.getElementById('progressFill').parentElement;
    track.setAttribute('role','progressbar'); track.setAttribute('aria-label','답변 완료 문항');
    track.setAttribute('aria-valuemin','0'); track.setAttribute('aria-valuemax',String(state.items.length));
    track.setAttribute('aria-valuenow',String(answered));
    document.getElementById('progressFill').style.width=`${answered/state.items.length*100}%`;
    document.getElementById('mental-page-feedback').textContent=missing?`이 페이지 ${page.length-missing} / ${page.length} 응답 · ${missing}개 문항에 답하면 다음으로 이동할 수 있습니다.`:`이 페이지 응답 완료 · 전체 ${answered} / ${state.items.length} 응답`;
    document.getElementById('btnNext').disabled=missing>0;
  }

  document.getElementById('qList').addEventListener('click', e=>{
    const btn = e.target.closest('.likert-btn');
    if(!btn) return;
    const no = parseInt(btn.dataset.no,10);
    const val = parseInt(btn.dataset.val,10);
    state.answers[no] = val;
    const card = document.getElementById(`qcard-${no}`);
    card.classList.remove('missing');
    card.querySelectorAll('.likert-btn').forEach(b=>{
      b.classList.toggle('selected', parseInt(b.dataset.val,10) === val);
      b.setAttribute('aria-pressed', String(parseInt(b.dataset.val,10) === val));
    });
    updateAnswerProgress();
  });

  document.getElementById('btnPrev').addEventListener('click', ()=>{
    if(state.currentPage>0){ state.currentPage--; renderPage(); root.scrollTo(0,0); }
  });

  document.getElementById('btnNext').addEventListener('click', ()=>{
    const page = state.pages[state.currentPage];
    const missing = page.filter(it=>!state.answers[it.no]);
    if(missing.length>0){
      missing.forEach(it=>document.getElementById(`qcard-${it.no}`).classList.add('missing'));
      document.getElementById(`qcard-${missing[0].no}`).scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }
    if(state.currentPage === state.pages.length-1){
      finishSurvey();
    } else {
      state.currentPage++;
      renderPage();
      root.scrollTo(0,0);
    }
  });

  // ---------- Screen 3 + Admin ----------
  let saving=false, saved=false, submissionId='';
  async function mentalReceipt(op){
    const params=new URLSearchParams({type:'mpsMental',op,requestId:submissionId,q:'__mental_protocol_probe__'});
    const response=await fetch(CONFIG.SHEET_URL+'?'+params,{signal:AbortSignal.timeout(30000)});
    const json=await response.json();
    if(json.protocol!=='haeon-mental-v1') throw new Error('M-서베이 저장을 위해 최신 Code.gs를 Google Apps Script에 반영하고 새 버전으로 배포해 주세요.');
    if(!json.ok) throw new Error(json.error||'서버 저장 확인에 실패했습니다.');
    return json;
  }
  async function finishSurvey(){
    if(saving||saved) return;
    if(state.items.length!==51||state.items.some(item=>!state.answers[item.no])) return;
    saving=true;
    submissionId=submissionId||crypto.randomUUID();
    const status=document.getElementById('mental-save-status');
    const next=document.getElementById('btnNext'),prev=document.getElementById('btnPrev');
    next.disabled=true;prev.disabled=true;
    root.querySelectorAll('.likert-btn').forEach(button=>button.disabled=true);
    status.textContent='서버에 저장하는 중입니다…';
    try{
      if(!isSheetConfigured()) throw new Error('서버 저장소가 설정되지 않았습니다.');
      if((await mentalReceipt('status')).state!=='complete'){
        await fetch(CONFIG.SHEET_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},signal:AbortSignal.timeout(60000),body:JSON.stringify({
          type:'mpsMental',requestId:submissionId,name:state.name.trim(),gender:state.gender,birthDate:state.dob,
          formData:{name:state.name.trim(),gender:state.gender,dob:state.dob,sport:state.sport,answers:{...state.answers},factorScores:calcFactorScores(),submissionId}
        })});
      }
      for(let attempt=0;attempt<12;attempt++){
        if((await mentalReceipt('status')).state==='complete'){
          saved=true;status.textContent='';showScreen('screenComplete');return;
        }
        await new Promise(resolve=>setTimeout(resolve,1500));
      }
      throw new Error('서버 저장 결과를 아직 확인하지 못했습니다. 응답은 유지됩니다. 제출하기를 눌러 다시 확인해 주세요.');
    }catch(error){status.textContent=error.message||'저장하지 못했습니다. 다시 제출해 주세요.';}
    finally{
      saving=false;next.disabled=false;prev.disabled=Boolean(submissionId)||state.currentPage===0;
      root.querySelectorAll('.likert-btn').forEach(button=>button.disabled=Boolean(submissionId));
    }
  }

  document.getElementById('adminLink').addEventListener('click', openAdmin);

  function calcFactorScores(){
    const factors = {};
    state.items.forEach(it=>{
      if(!factors[it.factorKey]) factors[it.factorKey] = { label: it.factorLabel, calc: it.calc, sum:0, count:0, total:0 };
      factors[it.factorKey].total++;
      const v = state.answers[it.no];
      if(v){ factors[it.factorKey].sum += v; factors[it.factorKey].count++; }
    });
    return Object.entries(factors).map(([key,f])=>{
      const avg = f.count ? f.sum/f.count : 0;
      const score = f.calc === '평균' ? avg : (7-avg);
      return { key, label:f.label, score, answered:f.count, total:f.total };
    });
  }

  let resultChart = null;
  function openAdmin(){
    document.getElementById('adminPanel').classList.remove('hidden');
    const scores = calcFactorScores();
    const sportLabel = SPORTS[state.sport].label;

    document.getElementById('adminInfo').innerHTML = `
      <div class="bg-slate-50 rounded-lg p-3"><p class="text-[11px] text-slate-400">이름</p><p class="font-bold">${escapeHtml(state.name)}</p></div>
      <div class="bg-slate-50 rounded-lg p-3"><p class="text-[11px] text-slate-400">성별</p><p class="font-bold">${state.gender}</p></div>
      <div class="bg-slate-50 rounded-lg p-3"><p class="text-[11px] text-slate-400">생년월일</p><p class="font-bold">${escapeHtml(state.dob)}</p></div>
      <div class="bg-slate-50 rounded-lg p-3"><p class="text-[11px] text-slate-400">종목</p><p class="font-bold">${sportLabel}</p></div>
    `;

    const labels = scores.map(s=>s.label.replace(/\s*\(.+?\)/,''));
    const values = scores.map(s=>Number(s.score.toFixed(2)));

    if(resultChart) resultChart.destroy();
    const ctx = document.getElementById('resultChart').getContext('2d');
    resultChart = new Chart(ctx, {
      type:'radar',
      data:{ labels, datasets:[{ label:'멘탈 점수', data:values, backgroundColor:'rgba(37,99,235,0.15)', borderColor:'#2563EB', borderWidth:2, pointBackgroundColor:'#2563EB' }] },
      options:{ responsive:true, maintainAspectRatio:false, scales:{ r:{ min:0, max:6, ticks:{ stepSize:1 }, pointLabels:{ font:{ size:11 } } } }, plugins:{ legend:{ display:false } } }
    });

    document.getElementById('resultTable').innerHTML = scores.map(s=>`
      <div class="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3">
        <div><p class="font-bold text-slate-700">${s.label}</p><p class="text-[11px] text-slate-400">응답 ${s.answered}/${s.total}</p></div>
        <p class="text-xl font-extrabold text-blue-600">${s.score.toFixed(2)}<span class="text-xs text-slate-400 font-medium"> / 6</span></p>
      </div>
    `).join('');

    document.getElementById('adminPanel').classList.remove('hidden');
  }

  function closeAdmin(){ document.getElementById('adminPanel').classList.add('hidden'); }

  function downloadJSON(){
    const payload = {
      name: state.name, gender: state.gender, dob: state.dob, sport: SPORTS[state.sport].label,
      answers: state.answers, factorScores: calcFactorScores(), completedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload,null,2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `mps_mental_survey_${state.name || 'result'}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  renderSportChoices();

  function escapeHtml(value){
    const element=document.createElement('span');element.textContent=value;return element.innerHTML;
  }
  function chooseSport(){ closeAdmin();showScreen('mentalSportScreen'); }
  function reset(){
    saved=false;submissionId='';document.getElementById('mental-save-status').textContent='';
    Object.assign(state,{name:'',gender:'',dob:'',sport:'',items:[],pages:[],currentPage:0,answers:{}});
    document.getElementById('inputName').value='';document.getElementById('inputDob').value='';
    document.getElementById('inputName').dispatchEvent(new Event('input',{bubbles:true}));
    root.querySelectorAll('.selected').forEach(button=>{button.classList.remove('selected');button.setAttribute('aria-pressed','false');});
    checkStartReady();closeAdmin();showScreen('mentalSportScreen');
    if(resultChart){resultChart.destroy();resultChart=null;}
  }
  function open(){
    reset();document.getElementById('gateway-view').style.display='none';root.hidden=false;
    if(window.lucide) lucide.createIcons();
    triggerFadeIn(root);
  }
  function back(){
    if(document.getElementById('screenInfo').classList.contains('active')) { chooseSport(); return; }
    exit();
  }
  function exit(){
    if(saving) return;
    if(!saved&&(state.name.trim()||state.gender||state.dob||Object.keys(state.answers).length)) {
      document.getElementById('mental-exit-dialog').showModal(); return;
    }
    discardAndExit();
  }
  function discardAndExit(){
    if(saving) return;
    document.getElementById('mental-exit-dialog').close();
    reset();root.hidden=true;backToGateway();
  }
  function recordResult(data){
    if(!SPORTS[data.sport]||!data.answers) throw new Error('저장된 M-서베이 데이터가 올바르지 않습니다.');
    const previous={...state};
    try{
      state.sport=data.sport;buildItems();state.answers={...data.answers};
      return {sportLabel:SPORTS[data.sport].label,scores:calcFactorScores(),items:state.items.map(item=>({...item,answer:state.answers[item.no]}))};
    }finally{Object.assign(state,previous);}
  }
  window.MpsMental=Object.freeze({isSaving:()=>saving,open,exit,back,discardAndExit,chooseSport,closeAdmin,downloadJSON,recordResult});
})();
