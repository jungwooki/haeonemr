/* Firebase is the only live EMR store. Legacy Apps Script files are archival.
   Lists contain demographics only; records and their original JSON load on demand. */
const EmrFirebase=(()=>{
 let readyPromise,loginPromise,resolveLogin,rejectLogin,sessionAuditPromise;
 const submissionIds=new WeakMap();
 async function ready(){
  if(!readyPromise)readyPromise=(async()=>{
   const base='https://www.gstatic.com/firebasejs/11.6.1/';
   const [app,auth,db,storage]=await Promise.all(['app','auth','firestore','storage'].map(name=>import(base+'firebase-'+name+'.js')));
   const instance=app.initializeApp(CONFIG.FIREBASE,window.location?.hash==='#staff'?'mps-emr':'mps-emr-patient');
   const a=auth.getAuth(instance);await auth.setPersistence(a,auth.browserSessionPersistence);await a.authStateReady();
   return {a,db:db.getFirestore(instance),storage:storage.getStorage(instance),...auth,...db,storageSdk:storage};
  })().catch(error=>{readyPromise=null;throw error;});
  return readyPromise;
 }
 async function auditEvent(f,action,targetId='',details={}){
  const token=await f.a.currentUser.getIdTokenResult();
  return {actorUid:f.a.currentUser.uid,actorName:token.claims.emrName||token.claims.email||f.a.currentUser.email||f.a.currentUser.uid,action,targetId,patientId:details.patientId||'',field:details.field||'',before:details.before??'',after:details.after??'',createdAt:f.serverTimestamp()};
 }
 async function audit(action,targetId='',details={}){
  const f=await requireStaff(),id=crypto.randomUUID();await f.setDoc(ref(f,'emr_audit',id),await auditEvent(f,action,targetId,details));
 }
 async function auditLog(){const f=await requireStaff();const rows=await f.getDocsFromServer(f.query(f.collection(f.db,'emr_audit'),f.orderBy('createdAt','desc'),f.limit(100)));return rows.docs.map(d=>({id:d.id,...d.data()}));}
 async function authorized(){const f=await ready();if(!f.a.currentUser)return false;const token=await f.a.currentUser.getIdTokenResult();return token.claims.emrAdmin===true||token.claims.emrStaff===true;}
 async function requireStaff(force=false){
  if(window.location&&window.location.hash!=='#staff')throw Error('의료진 전용 주소 emr.html에서 로그인해 주세요.');
  if(!force&&await authorized()){const f=await ready();if(!sessionAuditPromise)sessionAuditPromise=(async()=>{await f.setDoc(ref(f,'emr_audit',crypto.randomUUID()),await auditEvent(f,'session_resume'));})().catch(error=>{sessionAuditPromise=null;throw error;});await sessionAuditPromise;return f;}
  if(!loginPromise){
   loginPromise=new Promise((resolve,reject)=>{resolveLogin=resolve;rejectLogin=reject;});
   const dialog=document.getElementById('emr-password-dialog');
   document.getElementById('emr-password-error').textContent='';
   if(!dialog.open)dialog.showModal();
  }
  await loginPromise;return ready();
 }
 async function login(email,password){
  const f=await ready();await f.signInWithEmailAndPassword(f.a,EmrStaffAccounts.email(email),password);
  await f.a.currentUser.getIdToken(true);
  if(!await authorized()){await f.signOut(f.a);throw Error('EMR 접근 권한이 없는 계정입니다.');}
  try{await f.setDoc(ref(f,'emr_audit',crypto.randomUUID()),await auditEvent(f,'login'));}catch(error){await f.signOut(f.a);throw Error('로그인 이력을 저장하지 못했습니다. 다시 시도해 주세요.');}
  sessionAuditPromise=Promise.resolve();const resolve=resolveLogin;loginPromise=null;resolveLogin=rejectLogin=null;
  emrImagePassword='firebase-session';document.getElementById('emr-password-dialog').close();resolve?.();
 }
 function cancelLogin(){const reject=rejectLogin;loginPromise=null;resolveLogin=rejectLogin=null;reject?.(Error('로그인이 취소되었습니다. 입력한 응답은 유지됩니다.'));}
 async function logout(){if(!await emrCanNavigate())return;const f=await ready();try{await audit('logout');}finally{await f.signOut(f.a);window.location.reload();}}
 function ref(f,collection,id){return f.doc(f.db,collection,id);}
 async function read(f,collection,id){const snap=await f.getDocFromServer(ref(f,collection,id));return snap.exists()?{id:snap.id,...snap.data()}:null;}
 async function patients(){const f=await requireStaff();await importIntakes();await audit('patient_list');const snap=await f.getDocsFromServer(f.collection(f.db,'emr_patients'));return snap.docs.map(d=>({id:d.id,...d.data(),records:[],_recordsLoaded:false})).filter(p=>p.recordCount>0).sort((a,b)=>new Date(b.lastRecordAt)-new Date(a.lastRecordAt));}
 async function loadRecords(patient){
  const f=await requireStaff();await audit('patient_open',patient.id);const snap=await f.getDocsFromServer(f.query(f.collection(f.db,'emr_records'),f.where('patientId','==',patient.id)));
  patient.records=snap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>!r.deleted).sort((a,b)=>new Date(b.ts)-new Date(a.ts));patient._recordsLoaded=true;return patient.records;
 }
 async function loadContent(record){
  const f=await requireStaff();await audit('record_open',record.id);const [meta,data]=await Promise.all([read(f,'emr_records',record.id),read(f,'emr_record_content',record.id)]);if(!meta||meta.deleted||!data)throw Error('문진을 찾을 수 없거나 삭제되었습니다.');
  const {id,...content}=data;Object.assign(record,content);return record;
 }
 function selectedRecord(payload){
  if(payload.recordId)return {id:payload.recordId};
  const patient=window._patients?.[window._currentPatientIdx];
  const records=(patient?.records||[]).filter(r=>new Date(r.ts).getTime()===new Date(payload.ts).getTime()&&(r.category||'소아')===payload.category);
  if(patient?.name!==payload.name||records.length!==1)throw Error('선택한 문진을 다시 열어 주세요.');return records[0];
 }
 async function receipt(requestId){const publicResult=await publicReceipt(requestId);if(publicResult.state==='complete')return publicResult;if(!await authorized())return {state:'pending'};const f=await ready();return await read(f,'emr_requests',requestId)||{state:'pending'};}
 function payloadWithId(payload,form){const fingerprint=JSON.stringify(payload),previous=submissionIds.get(form);if(!previous||previous.fingerprint!==fingerprint)submissionIds.set(form,{fingerprint,id:crypto.randomUUID()});return {...payload,requestId:submissionIds.get(form).id};}
 function beginSurvey(form){submissionIds.delete(form);}
 async function hash(text){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(n=>n.toString(16).padStart(2,'0')).join('');}
 function birth(value){return String(value||'').slice(0,10).replace(/[./]/g,'-');}
 async function submitStaff(payload,intakeTime){
  const f=await requireStaff();const requestId=payload.requestId||payload.formData?.requestId||payload.formData?.submissionId;
  if(!requestId)throw Error('제출 식별자가 없습니다. 화면을 새로 열어 주세요.');
  const requestRef=ref(f,'emr_requests',requestId);const prior=await f.getDocFromServer(requestRef);if(prior.exists())return prior.data();
  if(!payload.name?.trim()||!payload.formData)throw Error('환자 이름과 문진 응답이 필요합니다.');
  const snap=await f.getDocsFromServer(f.query(f.collection(f.db,'emr_patients'),f.where('name','==',payload.name.trim())));
  const candidates=snap.docs.filter(d=>{const p=d.data();return payload.chartNumber?String(p.chartNumber)===String(payload.chartNumber):birth(p.birthDate)===birth(payload.birthDate)&&String(p.gender||'')===String(payload.gender||'');});
  const patientId=candidates.length===1?candidates[0].id:'new_'+await hash(JSON.stringify([payload.name.trim(),birth(payload.birthDate),payload.gender||'',payload.chartNumber||'',candidates.length>1?requestId:'']));
  const patientRef=ref(f,'emr_patients',patientId),recordId='r_'+requestId,ts=intakeTime||new Date().toISOString();
  const auditId=crypto.randomUUID(),event=await auditEvent(f,'record_create',recordId,{patientId});
  await f.runTransaction(f.db,async tx=>{
   const existing=await tx.get(requestRef);if(existing.exists())return;
   const patient=await tx.get(patientRef),old=patient.exists()?patient.data():{};
   const result={state:'complete',patientId,recordId,ts};
   tx.set(patientRef,{...old,name:payload.name.trim(),chartNumber:old.chartNumber||payload.chartNumber||'',birthDate:old.birthDate||payload.birthDate||'',gender:old.gender||payload.gender||'',lastRecordAt:new Date(old.lastRecordAt||0)>new Date(ts)?old.lastRecordAt:ts,recordCount:(old.recordCount||0)+1,_auditId:auditId});
   tx.set(ref(f,'emr_records',recordId),{patientId,ts,category:payload.type==='mpsMental'?'MPS 멘탈':payload.category,gender:payload.gender||'',birthDate:payload.birthDate||'',ageGroup:payload.ageGroup||'',deleted:false,images:[],_auditId:auditId});
   tx.set(ref(f,'emr_record_content',recordId),{patientId,data:JSON.stringify(payload.formData),doctorNote:'',privateNote:'',interpretationNote:'',_auditId:auditId});
   tx.set(ref(f,'emr_audit',auditId),event);
   tx.set(requestRef,result);
  });return read(f,'emr_requests',requestId);
 }
 // Public clients can submit immutable responses, never read patient records.
 async function publicReceipt(requestId){
  if(!/^[a-f0-9-]{36}$/.test(requestId||''))return {state:'pending'};
  const f=await ready();return await read(f,'emr_intake_receipts',requestId)||{state:'pending'};
 }
 async function submitPublic(payload){
  const f=await ready(),requestId=payload.requestId||payload.formData?.requestId||payload.formData?.submissionId;
  if(!/^[a-f0-9-]{36}$/.test(requestId||''))throw Error('제출 식별자가 없습니다.');
  if((await publicReceipt(requestId)).state==='complete')return {state:'complete'};
  const intake={requestId,name:payload.name.trim(),birthDate:payload.birthDate||'',gender:payload.gender||'',ageGroup:payload.ageGroup||'',category:payload.type==='mpsMental'?'MPS 멘탈':payload.category,data:JSON.stringify(payload.formData),createdAt:f.serverTimestamp(),imported:false};
  const batch=f.writeBatch(f.db);batch.set(ref(f,'emr_intakes',requestId),intake);batch.set(ref(f,'emr_intake_receipts',requestId),{state:'complete'});
  try{await batch.commit();}catch(error){if((await publicReceipt(requestId)).state!=='complete')throw error;}
  return {state:'complete'};
 }
 let importPromise;
 function importIntakes(){
  if(importPromise)return importPromise;
  importPromise=(async()=>{
   const f=await requireStaff();
   for(;;){
    const pending=await f.getDocsFromServer(f.query(f.collection(f.db,'emr_intakes'),f.where('imported','==',false),f.limit(100)));
    if(!pending.docs.length)break;
    for(const doc of pending.docs){
     const intake=doc.data();
     let formData;try{formData=JSON.parse(intake.data);if(!formData||typeof formData!=='object'||Array.isArray(formData))throw Error('Invalid input');}catch(error){await f.updateDoc(ref(f,'emr_intakes',doc.id),{imported:true,rejected:true});continue;}
     const result=await submitStaff({requestId:intake.requestId,name:intake.name,birthDate:intake.birthDate,gender:intake.gender,ageGroup:intake.ageGroup,category:intake.category,formData},intake.createdAt.toDate().toISOString());
     await f.updateDoc(ref(f,'emr_intakes',doc.id),{imported:true,recordId:result.recordId});
    }
   }
  })().finally(()=>{importPromise=null;});return importPromise;
 }
 async function submit(payload){
  // A retry must resolve the existing public receipt even if staff logged in meanwhile.
  const id=payload.requestId||payload.formData?.requestId||payload.formData?.submissionId;
  if((await publicReceipt(id)).state==='complete')return {state:'complete'};
  return await authorized()?submitStaff(payload):submitPublic(payload);
 }
 async function updateNote(payload){
  if(!['doctorNote','privateNote','interpretationNote'].includes(payload.field))throw Error('지원하지 않는 메모입니다.');
  const f=await requireStaff(),record=selectedRecord(payload);
  const auditId=crypto.randomUUID(),event=await auditEvent(f,'note_update',record.id,{field:payload.field,after:payload.value});
  await f.runTransaction(f.db,async tx=>{const meta=await tx.get(ref(f,'emr_records',record.id)),content=await tx.get(ref(f,'emr_record_content',record.id));if(!meta.exists()||meta.data().deleted||!content.exists())throw Error('삭제된 문진입니다.');tx.update(ref(f,'emr_record_content',record.id),{[payload.field]:payload.value,_auditId:auditId});tx.set(ref(f,'emr_audit',auditId),{...event,patientId:meta.data().patientId,before:content.data()[payload.field]||''});});
 }
 async function updateChart(payload){const f=await requireStaff(),p=window._patients?.find(p=>p.id===payload.patientId);if(!p)throw Error('환자를 다시 선택해 주세요.');const auditId=crypto.randomUUID(),event=await auditEvent(f,'chart_update',p.id,{patientId:p.id,field:'chartNumber',after:payload.newChartNumber});await f.runTransaction(f.db,async tx=>{const patient=await tx.get(ref(f,'emr_patients',p.id));if(!patient.exists())throw Error('환자를 찾을 수 없습니다.');tx.update(ref(f,'emr_patients',p.id),{chartNumber:payload.newChartNumber,_auditId:auditId});tx.set(ref(f,'emr_audit',auditId),{...event,before:patient.data().chartNumber||''});});}
 async function removeRecord(payload){
  const f=await requireStaff(),record=selectedRecord(payload),rr=ref(f,'emr_records',record.id),receiptRef=ref(f,'emr_requests',payload.requestId);
  const meta=await read(f,'emr_records',record.id);if(!meta)throw Error('문진을 찾을 수 없습니다.');
  const other=await f.getDocsFromServer(f.query(f.collection(f.db,'emr_records'),f.where('patientId','==',meta.patientId)));
  const latest=other.docs.map(d=>({id:d.id,...d.data()})).filter(r=>r.id!==record.id&&!r.deleted).sort((a,b)=>new Date(b.ts)-new Date(a.ts))[0];
  const auditId=crypto.randomUUID(),event=await auditEvent(f,'record_delete',record.id,{patientId:meta.patientId});
  await f.runTransaction(f.db,async tx=>{
   const previous=await tx.get(receiptRef);if(previous.exists())return;
   const current=await tx.get(rr),pr=ref(f,'emr_patients',meta.patientId),patient=await tx.get(pr);
   if(current.exists()&&!current.data().deleted){tx.update(rr,{deleted:true,deletedAt:new Date().toISOString(),_auditId:auditId});const p=patient.data();tx.update(pr,{recordCount:Math.max(0,p.recordCount-1),lastRecordAt:p.lastRecordAt===meta.ts?(latest?.ts||''):p.lastRecordAt,_auditId:auditId});tx.set(ref(f,'emr_audit',auditId),event);}
   tx.set(receiptRef,{state:'complete',recordId:record.id});
  });
 }
 async function imageRecord(key){
  const parts=JSON.parse(key),patient=window._patients?.[window._currentPatientIdx];
  const matches=patient?.records?.filter(r=>new Date(r.ts).toISOString()===parts[2]&&(r.category||'소아')===parts[3])||[];
  const record=matches.find(r=>r.id===window._currentRecordId)|| (matches.length===1?matches[0]:null);
  if(patient?.name!==parts[1]||!record)throw Error('해당 문진을 다시 선택해 주세요.');return record;
 }
 async function images(payload){
  const f=await requireStaff(),record=await imageRecord(payload.key),meta=await read(f,'emr_records',record.id);
  if(!meta||meta.deleted)throw Error('문진을 찾을 수 없습니다.');
  const op=payload.operation||payload.op;
  if(op==='list')return {images:meta.images||[]};
  if(op==='status')return receipt(payload.requestId);
  const sdk=f.storageSdk;
  if(op==='read'||op==='thumbnail'){
   const item=meta.images?.find(i=>i.id===payload.id);if(!item)throw Error('이미지를 찾을 수 없습니다.');
   const blob=await sdk.getBlob(sdk.ref(f.storage,op==='thumbnail'?(item.thumbnailPath||item.path):item.path));const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});return {mimeType:blob.type,data};
  }
  if(!CONFIG.STORAGE_ENABLED)throw Error('Firebase Storage 설정이 아직 완료되지 않았습니다. 관리자에게 문의해 주세요.');
  const receiptRef=ref(f,'emr_requests',payload.requestId);if((await f.getDocFromServer(receiptRef)).exists())return receipt(payload.requestId);
  if(op==='delete'){
   const item=meta.images?.find(i=>i.id===payload.id);
   await f.runTransaction(f.db,async tx=>{const snap=await tx.get(ref(f,'emr_records',record.id));tx.update(ref(f,'emr_records',record.id),{images:(snap.data().images||[]).filter(i=>i.id!==payload.id)});tx.set(receiptRef,{state:'complete'});});
   if(item)await Promise.all([item.path,item.thumbnailPath].filter(Boolean).map(path=>sdk.deleteObject(sdk.ref(f.storage,path)).catch(()=>{})));return {state:'complete'};
  }
  if(op!=='upload')throw Error('지원하지 않는 이미지 작업입니다.');
  if((meta.images||[]).length+payload.files.length>3)throw Error('문진별 이미지는 최대 3개입니다.');
  const uploaded=[];
  try{
   for(const [i,file] of payload.files.entries()){
    if(!['image/jpeg','image/png','image/webp','image/gif'].includes(file.mimeType)||file.data.length*3/4>10*1024*1024)throw Error('이미지 형식 또는 용량을 확인해 주세요.');
    const id=payload.requestId+'_'+i,path='emr/'+record.id+'/'+id;
    await sdk.uploadString(sdk.ref(f.storage,path),file.data,'base64',{contentType:file.mimeType});
    const bitmap=await createImageBitmap(await (await fetch('data:'+file.mimeType+';base64,'+file.data)).blob());
    const canvas=document.createElement('canvas'),scale=Math.min(1,256/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
    const thumbnailPath=path+'_thumb';await sdk.uploadString(sdk.ref(f.storage,thumbnailPath),canvas.toDataURL('image/jpeg',0.75).split(',')[1],'base64',{contentType:'image/jpeg'});
    uploaded.push({id,path,thumbnailPath,name:file.name,createdAt:new Date().toISOString(),mimeType:file.mimeType});
   }
   await f.runTransaction(f.db,async tx=>{const receipt=await tx.get(receiptRef);if(receipt.exists())return;const current=await tx.get(ref(f,'emr_records',record.id));const existing=current.data().images||[];if(current.data().deleted||existing.length+uploaded.length>3)throw Error('첨부 가능한 이미지 수를 초과했습니다.');tx.update(ref(f,'emr_records',record.id),{images:[...existing,...uploaded]});tx.set(receiptRef,{state:'complete'});});
  }catch(error){
   // A lost acknowledgement may follow a committed transaction. Never remove a referenced object.
   const confirmed=await read(f,'emr_requests',payload.requestId).catch(()=>null);
   if(confirmed?.state==='complete')return confirmed;
   throw error;
  }
  return {state:'complete'};
 }
 async function request(url,options={}){
  const p=options.method==='POST'?JSON.parse(options.body):Object.fromEntries(new URL(url,'https://emr.local').searchParams);
  if(p.type&&!['updateNote','updateChart','recordDelete','haeonImages','mpsMental','noteCapabilities','noteRead'].includes(p.type))throw Error('지원하지 않는 저장 요청입니다.');
  let value={};
  if(options.method==='POST'){
   if(p.type==='updateNote')await updateNote(p);
   else if(p.type==='updateChart')await updateChart(p);
   else if(p.type==='recordDelete')await removeRecord(p);
   else if(p.type==='haeonImages')value=await images(p);
   else value=await submit(p);
  }else if(p.type==='noteCapabilities'){await requireStaff();value={protocol:'haeon-notes-v2'};}
  else if(p.type==='noteRead'){
   const f=await requireStaff(),record=selectedRecord({...p,name:p.q}),data=await read(f,'emr_record_content',record.id);
   value={patients:[{name:p.q,records:[{ts:p.ts,category:p.category,[p.field]:data[p.field]}]}]};
  }else if(p.type==='mpsMental'||p.type==='recordDelete'){
   if(p.type==='recordDelete')await requireStaff();value={protocol:p.type==='mpsMental'?'haeon-mental-v1':'haeon-record-delete-v1',...(p.op==='status'?await receipt(p.requestId):{})};
  }else if(p.type==='haeonImages'){value={protocol:'haeon-images-v2',...await images(p)};}
  else {const list=await patients(),q=(p.q||'').trim().toLowerCase();value={patients:list.filter(p=>!q||[p.name,p.chartNumber].some(v=>String(v).toLowerCase().includes(q)))};}
  return {ok:true,json:async()=>({ok:true,...value})};
 }
 return {ready,authorized,requireStaff,audit,auditLog,login,cancelLogin,logout,patients,loadRecords,loadContent,receipt,payloadWithId,beginSurvey,request};
})();
function emrStoreRequest(url,options){return EmrFirebase.request(url,options);}

let emrPendingSaves=0;
async function emrSaveSurvey(status,payload,form){
 const prepared=EmrFirebase.payloadWithId(payload,form);emrPendingSaves++;
 if(status)status.textContent='저장 중…';
 try{await emrStoreRequest(CONFIG.STORE_URL,{method:'POST',body:JSON.stringify(prepared)});if(status)status.textContent='저장 완료 ✓';return true;}
 catch(error){if(status){status.textContent='저장하지 못했습니다. 입력한 응답은 유지됩니다. ';const retry=document.createElement('button');retry.type='button';retry.textContent='다시 저장';retry.style.cssText='text-decoration:underline;padding:8px;';retry.onclick=()=>emrSaveSurvey(status,payload,form);status.append(retry);}return false;}
 finally{emrPendingSaves--;}
}
window.addEventListener('beforeunload',event=>{if(emrPendingSaves){event.preventDefault();event.returnValue='';}});

async function emrSubmitSurvey(save,shellId){
 const shell=document.getElementById(shellId);if(shell.dataset.saving==='true')return false;
 shell.dataset.saving='true';shell.setAttribute('aria-busy','true');
 let status=shell.querySelector('.emr-submit-status');
 if(!status){status=document.createElement('p');status.className='emr-submit-status';status.setAttribute('role','status');status.style.cssText='position:fixed;bottom:88px;left:50%;transform:translateX(-50%);width:min(520px,90vw);padding:12px 16px;border-radius:12px;background:#eff6ff;color:#1e40af;box-shadow:0 4px 20px #17255416;z-index:100;text-align:center;font-size:14px;';shell.append(status);}
 status.hidden=false;status.textContent='응답을 저장하고 있습니다…';
 const controls=[...shell.querySelectorAll('button,input,select,textarea')].map(el=>[el,el.disabled]);controls.forEach(([el])=>el.disabled=true);
 try{const saved=await save();if(!saved){status.textContent='저장하지 못했습니다. 연결을 확인한 뒤 작성 완료하기를 다시 눌러 주세요.';return false;}status.hidden=true;shell.style.display='none';showCompletion();return true;}
 catch(error){status.textContent='저장 중 오류가 발생했습니다. 입력 내용을 유지했으니 다시 제출해 주세요.';return false;}
 finally{shell.dataset.saving='false';shell.removeAttribute('aria-busy');controls.forEach(([el,disabled])=>el.disabled=disabled);}
}
