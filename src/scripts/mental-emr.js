/* Stored M-survey results share the existing EMR notes and record images. */
window.MentalEmr=(()=>{
  let chart=null, current=null;
  function open(data,record){
    let result;
    try{result=MpsMental.recordResult(data);}catch(error){alert(error.message);document.getElementById('search-view').style.display='flex';return;}
    current={data,record,result};
    document.getElementById('mental-survey-view').hidden=true;
    document.getElementById('mental-report-view').classList.add('active');
    const info=document.getElementById('mental-rp-info');info.replaceChildren();
    const patient=window._patients?.[window._currentPatientIdx];
    for(const [label,value] of [['이름',patient?.name||data.name],['성별',record.gender],['생년월일',record.birthDate],['종목',result.sportLabel],['작성일',new Date(record.ts).toLocaleString('ko-KR')]]){
      const cell=document.createElement('div');cell.className='rp-info-item';
      const title=document.createElement('div');title.className='rp-info-label';title.textContent=label;
      const content=document.createElement('div');content.className='rp-info-value';content.textContent=value||'-';cell.append(title,content);info.append(cell);
    }
    const scores=document.getElementById('mental-rp-scores');scores.replaceChildren();
    result.scores.forEach(factor=>{
      const card=document.createElement('div');card.className='rp-card';
      const title=document.createElement('strong');title.textContent=factor.label;
      const value=document.createElement('p');value.textContent=factor.score.toFixed(2)+' / 6 · 응답 '+factor.answered+'/'+factor.total;card.append(title,value);scores.append(card);
    });
    const answers=document.getElementById('mental-rp-answers');answers.replaceChildren();
    result.items.forEach(item=>{
      const row=document.createElement('p');row.className='mental-answer';
      row.textContent=item.no+'. '+item.text+' — '+(item.answer??'미응답');answers.append(row);
    });
    for(const [suffix,html] of [['doctor',doctorNoteBoxHtml('mental-rp')],['private',privateNoteBoxHtml('mental-rp')]]){
      const slot=document.getElementById('mental-rp-'+suffix+'-note-slot');
      if(!slot.childElementCount) slot.innerHTML=html;
    }
    fillNoteBoxes('mental-rp');
    if(chart) chart.destroy();
    chart=new Chart(document.getElementById('mental-rp-chart').getContext('2d'),{
      type:'radar',data:{labels:result.scores.map(s=>s.label.replace(/\s*\(.+?\)/,'')),datasets:[{label:'멘탈 점수',data:result.scores.map(s=>Number(s.score.toFixed(2))),backgroundColor:'rgba(37,99,235,0.15)',borderColor:'#2563EB',borderWidth:2,pointBackgroundColor:'#2563EB'}]},
      options:{responsive:true,maintainAspectRatio:false,scales:{r:{min:0,max:6,ticks:{stepSize:1},pointLabels:{font:{size:11}}}},plugins:{legend:{display:false}}}
    });
    if(window.lucide) lucide.createIcons();
  }
  function close(){
    if(!emrCanNavigate()) return;
    document.getElementById('mental-report-view').classList.remove('active');
    document.getElementById('search-view').style.display='flex';
    const patient=window._patients?.[window._currentPatientIdx];if(patient) renderPatientDetail(patient);
  }
  function download(){
    if(!current) return;
    const {data,record,result}=current;
    const payload={name:window._currentRecordName,gender:record.gender,dob:record.birthDate,sport:result.sportLabel,answers:data.answers,factorScores:result.scores,completedAt:new Date(record.ts).toISOString()};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='mps_mental_survey_'+payload.name+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  return Object.freeze({open,close,download});
})();
