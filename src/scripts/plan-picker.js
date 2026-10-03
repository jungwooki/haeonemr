/* Search the existing guide content; insert only clinician-selected keywords. */
const PlanPicker=(()=>{
 const sources={treatment:'치료방법',prescription:'기초한약'},cache=new Map();let target=null,kind='',version=0;
 const flatten=value=>value==null?'':typeof value==='object'?Object.values(value).map(flatten).join(' '):String(value);
 const normalize=value=>String(value).normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
 function search(rows,query){const terms=normalize(query).split(' ').filter(Boolean);return rows.filter(row=>terms.every(term=>normalize(flatten(row)).includes(term))).sort((a,b)=>Number(normalize(b.name).includes(normalize(query)))-Number(normalize(a.name).includes(normalize(query)))||a.name.localeCompare(b.name,'ko'));}
 function keyword(name){return '['+name+']';}
 function add(input,name){const token=keyword(name);if(input.value.includes(token))return false;input.value+=(input.value&&!/\s$/.test(input.value)?' ':'')+token;input.dispatchEvent(new Event('input',{bubbles:true}));return true;}
 function dialog(){
  let root=document.getElementById('plan-picker');if(root)return root;
  root=document.createElement('dialog');root.id='plan-picker';root.className='plan-picker no-print';root.setAttribute('aria-labelledby','plan-picker-title');
  root.innerHTML='<header><h2 id="plan-picker-title"></h2><button type="button" data-close aria-label="선택 창 닫기">닫기</button></header><input type="search" id="plan-picker-search" aria-label="이름·효능·적응증 검색" placeholder="이름, 효능, 적응증으로 검색"><p class="plan-picker-help">선택한 항목의 이름만 치료플랜에 추가됩니다.</p><p id="plan-picker-status" role="status"></p><div id="plan-picker-results"></div>';
  root.querySelector('[data-close]').onclick=()=>root.close();root.addEventListener('close',()=>{version++;target=null;root.querySelector('input').value='';root.querySelector('#plan-picker-results').replaceChildren();});root.querySelector('input').oninput=()=>render();document.body.append(root);return root;
 }
 function render(){
  const root=dialog(),list=root.querySelector('#plan-picker-results'),rows=search(cache.get(kind)||[],root.querySelector('input').value);list.replaceChildren();root.querySelector('#plan-picker-status').textContent=rows.length+'개 항목';
  for(const row of rows){const button=document.createElement('button');button.type='button';button.className='plan-picker-result';const selected=!!target?.value.includes(keyword(row.name));button.disabled=selected;const title=document.createElement('strong');title.textContent=row.name;const info=document.createElement('small');info.textContent=[row.category,row.indication||row.summary].filter(Boolean).join(' · ');const state=document.createElement('span');state.textContent=selected?'추가됨':'＋';button.append(title,info,state);button.onclick=()=>{if(!target?.isConnected||target!==document.getElementById(target.id)){root.close();return;}add(target,row.name);render();};list.append(button);}
 }
 async function open(prefix,type){
  if(!sources[type])return;const input=document.getElementById(prefix+'-doctor-note');if(!input)return;
  const root=dialog();target=input;kind=type;const request=++version;root.querySelector('h2').textContent=sources[type]+' 선택';root.querySelector('input').value='';root.querySelector('#plan-picker-results').replaceChildren();root.querySelector('#plan-picker-status').textContent='가이드 항목을 불러오는 중…';if(!root.open)root.showModal();root.querySelector('input').focus();
  try{if(!cache.has(type)){const response=await fetch('guides/'+type+'.json');if(!response.ok)throw Error('Guide unavailable');const json=await response.json();if(!Array.isArray(json.data))throw Error('Invalid guide');cache.set(type,json.data);}if(request===version)render();}
  catch{if(request===version)root.querySelector('#plan-picker-status').textContent='가이드를 불러오지 못했습니다. 닫은 뒤 다시 시도해 주세요.';}
 }
 return {open,search,add,keyword};
})();
