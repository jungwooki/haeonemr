/* iPad portrait forms transcribed from supplied PDFs; patient answers only. */
const PaperSurveys=(()=>{
 let kind=null,data={},step=0,saving=false,prepared=null;
 const el=id=>document.getElementById(id),spec=()=>PaperSurveyData[kind];
 const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const visible=(field,answers)=>!field.when||(Array.isArray(answers[field.when[0]])?answers[field.when[0]].includes(field.when[1]):answers[field.when[0]]===field.when[1]);
 function node(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
 function clean(answers,definition){const result={...answers};for(const section of definition.steps)for(const field of section.fields)if(!visible(field,answers))delete result[field.key];return result;}
 function validate(answers,definition,index){
  for(const field of definition.steps[index].fields){
   if(!visible(field,answers))continue;const value=answers[field.key];
   if(field.required&&(value===undefined||value===null||typeof value==='string'&&!value.trim()||Array.isArray(value)&&!value.length))return field.label+' 항목을 작성해 주세요.';
   if(value!==undefined&&value!==''){
    if(field.type==='date'&&(!/^\d{4}-\d{2}-\d{2}$/.test(value)||isNaN(new Date(value))||new Date(value).toISOString().slice(0,10)!==value||field.past&&value>today()))return field.label+' 날짜를 확인해 주세요.';
    if(field.type==='number'&&(!Number.isFinite(Number(value))||field.min!==undefined&&Number(value)<field.min))return field.label+' 수치를 확인해 주세요.';
   }
  }return '';
 }
 function bodyMap(markers,editable){
  const box=node('div',undefined,'paper-body'),img=node('img');img.src='assets/surveys/traffic-body.png';img.alt='불편한 부위를 표시하는 신체 그림: 왼쪽 옆면, 뒷면, 앞면, 오른쪽 옆면';box.append(img);
  markers.forEach((marker,index)=>{const dot=node(editable?'button':'span',String(index+1));if(!editable)dot.style.cssText='position:absolute;transform:translate(-50%,-50%);width:24px;height:24px;border-radius:50%;background:#5278be;color:white;text-align:center;';else{dot.type='button';dot.setAttribute('aria-label','표시 '+(index+1)+' 삭제');dot.onclick=event=>{event.stopPropagation();markers.splice(index,1);box.replaceWith(bodyMap(markers,true));};}dot.style.left=marker.x+'%';dot.style.top=marker.y+'%';box.append(dot);});
  if(editable){img.style.cursor='crosshair';img.onclick=event=>{const rect=img.getBoundingClientRect();markers.push({x:Number(((event.clientX-rect.left)/rect.width*100).toFixed(2)),y:Number(((event.clientY-rect.top)/rect.height*100).toFixed(2))});box.replaceWith(bodyMap(markers,true));};}
  return box;
 }
 function enter(type){
  if(saving)return;if(!PaperSurveyData[type])return;
  kind=type;data={};step=0;prepared=null;el('hub-view').style.display='none';el('paper-survey').hidden=false;render();
 }
 function updateConditions(){for(const field of spec().steps[step].fields){const wrapper=el('paper-field-'+field.key);if(!wrapper)continue;wrapper.hidden=!visible(field,data);wrapper.querySelectorAll('input,textarea').forEach(input=>{input.disabled=wrapper.hidden;});}}
 function fieldNode(field){
  const wrapper=node('fieldset',undefined,'paper-field');wrapper.id='paper-field-'+field.key;
  const legend=node('legend',field.label+(field.unit?' ('+field.unit+')':''));if(field.required)legend.append(node('small','필수'));wrapper.append(legend);
  if(field.type==='body'){
   if(!Array.isArray(data[field.key]))data[field.key]=[];
   wrapper.append(node('p','불편한 곳을 터치해 표시하세요. 번호를 다시 누르면 지워집니다. 아래 설명란에 부위를 직접 적어도 됩니다.','paper-body-caption'),bodyMap(data[field.key],true));
   const clear=node('button','표시 모두 지우기','paper-body-edit');clear.type='button';clear.onclick=()=>{data[field.key]=[];wrapper.querySelector('.paper-body').replaceWith(bodyMap(data[field.key],true));};wrapper.append(clear);return wrapper;
  }
  if(['radio','checks'].includes(field.type)){
   const options=node('div',undefined,'paper-options');field.options.forEach(option=>{
    const label=node('label',undefined,'paper-option'),input=node('input');input.type=field.type==='checks'?'checkbox':'radio';input.name=field.key;input.value=option;input.checked=field.type==='checks'?(data[field.key]||[]).includes(option):data[field.key]===option;
    input.onchange=()=>{if(field.type==='radio')data[field.key]=option;else{let values=new Set(data[field.key]||[]);if(input.checked){values.add(option);if(field.exclusive){if(option===field.exclusive)values=new Set([option]);else values.delete(field.exclusive);}}else values.delete(option);data[field.key]=[...values];options.querySelectorAll('input').forEach(i=>i.checked=values.has(i.value));}updateConditions();};label.append(input,node('span',option));options.append(label);
   });wrapper.append(options);
  }else{
   const input=node(field.type==='textarea'?'textarea':'input');if(field.type!=='textarea')input.type=field.type;input.value=data[field.key]??'';input.id='paper-input-'+field.key;input.setAttribute('aria-label',field.label);if(field.required)input.setAttribute('aria-required','true');input.maxLength=field.maxLength||4000;
   if(field.type==='date'&&field.past)input.max=today();if(field.type==='number'){input.step=field.step||'any';input.inputMode='decimal';if(field.min!==undefined)input.min=field.min;}
   input.oninput=()=>{data[field.key]=input.value;};wrapper.append(input);
  }return wrapper;
 }
 function review(answers,definition){
  const host=node('div');for(const section of definition.steps){const part=node('section',undefined,'paper-review-section');part.append(node('h2',section.title));const dl=node('dl');for(const field of section.fields){if(!visible(field,answers))continue;const row=node('div');let value=answers[field.key];if(field.type==='body'){part.append(bodyMap(value||[],false));value=(value||[]).map((m,i)=>'표시 '+(i+1)+' (가로 '+m.x+'%, 세로 '+m.y+'%)').join(' / ');}else if(Array.isArray(value))value=value.join(' / ');row.append(node('dt',field.label),node('dd',value===undefined||value===''?'미기록':String(value)+(field.unit?' '+field.unit:'')));dl.append(row);}part.append(dl);host.append(part);}return host;
 }
 function render(){
  const definition=spec(),content=el('paper-content');content.replaceChildren();el('paper-status').textContent='';el('paper-back').disabled=saving||Boolean(prepared);el('paper-back').onclick=back;
  const isReview=step===definition.steps.length;el('paper-counter').textContent=isReview?'작성 내용 확인':(step+1)+' / '+definition.steps.length;el('paper-progress-fill').style.width=(step+1)/(definition.steps.length+1)*100+'%';
  content.append(node('span',definition.title,'paper-eyebrow'),node('h1',isReview?'작성 내용을 확인해 주세요.':definition.steps[step].title),node('p',isReview?'제출한 응답은 의료진이 EMR에서 확인합니다.':definition.steps[step].help||'해당하는 항목을 선택해 주세요. 필수 표시가 없는 항목은 모르면 비워둘 수 있습니다.','paper-survey-help'));
  if(isReview)content.append(review(clean(data,definition),definition));else for(const field of definition.steps[step].fields)content.append(fieldNode(field));
  const next=node('button',isReview?'작성 완료 · 제출하기':'다음','paper-next');next.type='button';next.id='paper-next';next.onclick=isReview?submit:()=>{const message=validate(data,definition,step);if(message){el('paper-status').textContent=message;el('paper-status').scrollIntoView({block:'nearest'});return;}step++;render();};content.append(next);if(!isReview)updateConditions();el('paper-survey').scrollTop=0;
 }
 function back(){if(saving||prepared)return;if(step>0){step--;render();}else{el('paper-survey').hidden=true;returnToHub();}}
 async function submit(){
  if(saving)return;for(let i=0;i<spec().steps.length;i++){const message=validate(data,spec(),i);if(message){step=i;render();el('paper-status').textContent=message;return;}}
  if(!prepared){const answers=clean(data,spec());answers.name=answers.name.trim();prepared=EmrFirebase.payloadWithId({category:spec().category,name:answers.name,birthDate:answers.birthDate,gender:answers.gender,formData:answers},data);}
  saving=true;emrPendingSaves++;el('paper-back').disabled=true;el('paper-next').disabled=true;el('paper-survey').setAttribute('aria-busy','true');el('paper-status').textContent='응답을 저장하고 있습니다…';
  try{const result=await emrStoreRequest(CONFIG.STORE_URL,{method:'POST',body:JSON.stringify(prepared)});if(!(await result.json()).ok)throw Error('Save failed');prepared=null;el('paper-survey').hidden=true;data={};showCompletion();}
  catch(error){el('paper-status').textContent='저장 완료를 확인하지 못했습니다. 입력 내용은 유지됩니다. 연결을 확인하고 다시 제출해 주세요.';el('paper-next').textContent='저장 확인 · 다시 제출';}
  finally{saving=false;emrPendingSaves--;el('paper-next').disabled=false;el('paper-survey').removeAttribute('aria-busy');}
 }
 function open(answers,record){
  const definition=Object.values(PaperSurveyData).find(s=>s.category===record.category);if(!definition)return;
  el('paper-report-view').classList.add('active');el('paper-rp-title').textContent=definition.title;el('paper-rp-info').textContent=[answers.name,answers.birthDate,answers.gender,new Date(record.ts).toLocaleString('ko-KR')].filter(Boolean).join(' · ');
  el('paper-rp-answers').replaceChildren(review(answers,definition));el('paper-rp-doctor-note-slot').innerHTML=doctorNoteBoxHtml('paper-rp');el('paper-rp-private-note-slot').innerHTML=privateNoteBoxHtml('paper-rp');fillNoteBoxes('paper-rp');
 }
 async function close(){if(!await emrCanNavigate())return;el('paper-report-view').classList.remove('active');el('search-view').style.display='flex';}
 return {enter,open,close,isSaving:()=>saving,validate,clean};
})();
