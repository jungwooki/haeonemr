/* Patient images are stored on Drive through the configured Apps Script. */
const emrImageWidgets=new Set();
let emrImagePassword='';
const EMR_IMAGE_PROTOCOL='haeon-images-v2';
function emrImageRecordKey(patient,record){
  return JSON.stringify(['record',patient.name,new Date(record.ts).toISOString(),record.category||'소아']);
}
async function emrImageRequest(key,op,extra={}){
  if(!emrImagePassword) throw new Error('EMR 홈에서 비밀번호를 입력한 뒤 다시 접속해 주세요.');
  const params=new URLSearchParams({type:'haeonImages',op,key,password:emrImagePassword,q:'__haeon_image_api_probe__',...extra});
  const response=await fetch(CONFIG.SHEET_URL+'?'+params,{signal:AbortSignal.timeout(30000)});
  const result=await response.json();
  if(result.protocol!==EMR_IMAGE_PROTOCOL) throw new Error('이미지 서버 연결 대기 중입니다. Apps Script 이미지 기능 업데이트가 필요합니다.');
  if(!result.ok) throw new Error(result.error||'이미지 서버 요청에 실패했습니다.');
  return result;
}
function readEmrImages(key){return cachedEmrRead('images:'+key,async()=>(await emrImageRequest(key,'list')).images);}
async function changeEmrImages(key,operation,images=[],id=''){
  // An older deployment must never receive an unknown POST and create a blank record.
  const existing=await readEmrImages(key);
  if(operation==='upload' && existing.length+images.length>3) throw new Error('문진 기록별 이미지 자료는 최대 3개까지 첨부할 수 있습니다.');
  const requestId=crypto.randomUUID();
  const files=await Promise.all(images.map(item=>new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onerror=()=>reject(reader.error);
    reader.onload=()=>resolve({name:item.name,mimeType:item.blob.type,data:reader.result.split(',')[1]});
    reader.readAsDataURL(item.blob);
  })));
  invalidateEmrReadCache('images:'+key);
  await fetch(CONFIG.SHEET_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({type:'haeonImages',operation,key,password:emrImagePassword,requestId,files,id}),signal:AbortSignal.timeout(60000)});
  for(let attempt=0;attempt<12;attempt++){
    const result=await emrImageRequest(key,'status',{requestId});
    if(result.state==='complete'){invalidateEmrReadCache('images:'+key);return result;}
    if(result.state==='failed') throw new Error(result.error||'이미지 저장에 실패했습니다.');
    await new Promise(resolve=>setTimeout(resolve,1500));
  }
  throw new Error('서버 저장 결과를 확인하지 못했습니다. 첨부 목록을 새로고침한 뒤 확인해 주세요.');
}
async function previewEmrImage(item,key){
  const dialog=document.getElementById('emr-image-preview'),image=dialog.querySelector('img');
  const message=dialog.querySelector('.emr-preview-status');
  const token=crypto.randomUUID();dialog.dataset.request=token;
  image.removeAttribute('src');image.alt=item.name;
  dialog.querySelector('h3').textContent=item.name;message.textContent='이미지를 불러오는 중입니다…';dialog.showModal();
  try{
    const result=await emrImageRequest(key,'read',{id:item.id});
    if(!dialog.open||dialog.dataset.request!==token) return;
    image.src='data:'+result.mimeType+';base64,'+result.data;message.textContent='';
  }catch(error){if(dialog.dataset.request===token) message.textContent=error.message;}
}
async function refreshEmrImageWidgets(key){
  const pending=[];
  for(const widget of [...emrImageWidgets]){
    if(!widget.element.isConnected){widget.urls.forEach(URL.revokeObjectURL);emrImageWidgets.delete(widget);}
    else if(widget.key===key) pending.push(widget.refresh());
  }
  await Promise.all(pending);
}
function mountEmrImages(host,patient,record){
  if(!host||!patient) return;
  for(const widget of [...emrImageWidgets]){
    if(!widget.element.isConnected||host.contains(widget.element)){widget.urls.forEach(URL.revokeObjectURL);emrImageWidgets.delete(widget);}
  }
  host.replaceChildren();
  const section=document.createElement('section');section.className='emr-image-card no-print';
  section.innerHTML='<div class="emr-image-header"><h3>검사(이미지자료) <span class="emr-image-count">0 / 3</span></h3><label class="emr-image-upload">이미지 첨부<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple aria-label="환자 이미지 자료 첨부"></label></div><p class="emr-image-help">서버 보관 · 이 문진 기록에 최대 3개 · JPG, PNG, WEBP, GIF · 파일당 10MB<br>이미지를 클릭하면 크게 볼 수 있습니다. 다른 기기에서도 같은 문진 기록의 자료를 확인할 수 있습니다.</p><button type="button" class="emr-image-reload" style="color:#2563EB;font-size:13px;margin-bottom:12px">목록 새로고침</button><div class="emr-image-grid"></div><p class="emr-image-status" role="status" aria-live="polite"></p>';
  host.append(section);
  const key=emrImageRecordKey(patient,record),input=section.querySelector('input'),status=section.querySelector('.emr-image-status');
  const widget={key,element:section,urls:[],version:0,refresh:async()=>{
    const version=++widget.version;
    input.disabled=true;status.textContent='첨부 목록을 불러오는 중입니다…';
    try{
      const items=await readEmrImages(key);
      if(version!==widget.version||!section.isConnected) return;
      widget.urls.forEach(URL.revokeObjectURL);widget.urls=[];
      const grid=section.querySelector('.emr-image-grid');grid.replaceChildren();
      section.querySelector('.emr-image-count').textContent=items.length+' / 3';
      input.disabled=items.length>=3;status.textContent='';
      items.forEach(item=>{
        const tile=document.createElement('div');tile.className='emr-image-tile';
        const open=document.createElement('button');open.type='button';open.className='emr-image-thumb';open.setAttribute('aria-label',item.name+' 미리보기');
        const img=document.createElement('img');img.alt=item.name;
        if(item.thumbnail) img.src='data:'+(item.thumbnailMime||'image/jpeg')+';base64,'+item.thumbnail;
        open.append(img);open.onclick=()=>previewEmrImage(item,key);
        const name=document.createElement('p');name.textContent=item.name;name.title=item.name;
        const remove=document.createElement('button');remove.type='button';remove.className='emr-image-remove';remove.textContent='삭제';remove.setAttribute('aria-label',item.name+' 삭제');
        remove.onclick=async()=>{
          if(!confirm('이 이미지 자료를 삭제할까요?')) return;
          remove.disabled=true;
          try{await changeEmrImages(key,'delete',[],item.id);await refreshEmrImageWidgets(key);status.textContent='이미지 자료를 삭제했습니다.';}
          catch(error){status.textContent=error.message;remove.disabled=false;}
        };
        tile.append(open,name,remove);grid.append(tile);
      });
      for(let i=items.length;i<3;i++){const empty=document.createElement('div');empty.className='emr-image-empty';empty.textContent='자료 '+(i+1);grid.append(empty);}
    }catch(error){status.textContent=error.message||'이미지 서버에 연결하지 못했습니다.';input.disabled=true;}
  }};
  section.querySelector('.emr-image-reload').onclick=()=>{invalidateEmrReadCache('images:'+key);return widget.refresh();};
  emrImageWidgets.add(widget);widget.refresh();
  input.addEventListener('change',async()=>{
    const files=[...input.files];input.value='';if(!files.length) return;
    input.disabled=true;status.textContent='이미지를 확인하고 저장하는 중입니다…';
    try{
      if(files.length>3) throw new Error('한 번에 최대 3개까지 선택해 주세요.');
      const images=[];
      for(const file of files){
        if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) throw new Error('JPG, PNG, WEBP, GIF 이미지 파일만 첨부할 수 있습니다.');
        if(file.size>10*1024*1024) throw new Error('파일당 10MB 이하의 이미지를 선택해 주세요.');
        const url=URL.createObjectURL(file);
        try{const img=new Image();img.src=url;await img.decode();}catch{throw new Error('읽을 수 없는 이미지입니다. 다른 파일을 선택해 주세요.');}finally{URL.revokeObjectURL(url);}
        images.push({id:crypto.randomUUID(),name:file.name,blob:file,createdAt:new Date().toISOString()});
      }
      await changeEmrImages(key,'upload',images);
      await refreshEmrImageWidgets(key);status.textContent='이미지 자료를 서버에 저장했습니다.';
    }catch(error){await widget.refresh();status.textContent=error.message;}
  });
}

document.getElementById('emr-image-preview').addEventListener('close',()=>{
  const img=document.querySelector('#emr-image-preview img');
  if(img.dataset.url) URL.revokeObjectURL(img.dataset.url);
  img.removeAttribute('src');delete img.dataset.url;
});
