const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {webcrypto}=require('node:crypto');
(async()=>{
 const docs=new Map();let tail=Promise.resolve(),readCollections=[];
 const clone=structuredClone;
 const snap=(key)=>({id:key.split('/').pop(),exists:()=>docs.has(key),data:()=>clone(docs.get(key))});
 const auth={currentUser:{uid:'staff-test',email:'staff@test.invalid',getIdTokenResult:async()=>({claims:{emrStaff:true,emrName:'검증 직원'}})},authStateReady:async()=>{}};
 const db={serverTimestamp:()=> '2026-10-03T01:02:03Z',setDoc:async(key,value)=>docs.set(key,clone(value)),orderBy:()=>null,getFirestore:()=>({}),doc:(_,c,id)=>c+'/'+id,collection:(_,c)=>({c}),where:(k,op,v)=>({k,v}),limit:()=>null,query:(collection,...clauses)=>({...collection,clauses:clauses.filter(Boolean)}),
 getDocFromServer:async key=>snap(key),
 getDocsFromServer:async q=>{readCollections.push(q.c);return {docs:[...docs.keys()].filter(k=>k.startsWith(q.c+'/')).map(snap).filter(s=>(q.clauses||[]).every(({k,v})=>s.data()[k]===v))};},
 updateDoc:async(key,data)=>{if(!docs.has(key))throw Error('not-found');docs.set(key,{...docs.get(key),...clone(data)});},
 runTransaction:(_,body)=>{const run=tail.then(async()=>{const writes=[];let writing=false;await body({get:async key=>{assert(!writing,'Firestore requires all reads before writes');return snap(key);},set:(key,value)=>{writing=true;writes.push(()=>docs.set(key,clone(value)));},update:(key,value)=>{writing=true;writes.push(()=>{assert(docs.has(key));docs.set(key,{...docs.get(key),...clone(value)});});}});writes.forEach(fn=>fn());});tail=run.catch(()=>{});return run;}
 };
 const modules={app:{initializeApp:()=>({})},auth:{getAuth:()=>auth,setPersistence:async()=>{},browserSessionPersistence:{},signOut:async()=>{auth.currentUser=null;}},firestore:db,storage:{getStorage:()=>({})}};
 const context=vm.createContext({console,Map,WeakMap,Promise,URL,Date,JSON,TextEncoder,crypto:webcrypto,structuredClone,CONFIG:{FIREBASE:{},STORAGE_ENABLED:false},__firebaseModules:modules,window:{addEventListener(){}},document:{},emrImagePassword:''});
 let code=fs.readFileSync(path.join(__dirname,'../src/scripts/firebase-store.js'),'utf8');
 const original="import(base+'firebase-'+name+'.js')";assert(code.includes(original));code=code.replace(original,'Promise.resolve(__firebaseModules[name])');vm.runInContext(code,context);
 const store=vm.runInContext('EmrFirebase',context);
 const send=body=>store.request('https://emr.local/firebase',{method:'POST',body:JSON.stringify(body)}).then(r=>r.json());
 const form={name:'테스트 환자',answers:{q1:'원문\n그대로'}};
 const payload=store.payloadWithId({name:form.name,birthDate:'2000-01-01',gender:'남',category:'통증',formData:form},form);
 const originalPayload={...payload};delete originalPayload.requestId;assert.equal(store.payloadWithId(originalPayload,form).requestId,payload.requestId);
 const changedId=store.payloadWithId({...originalPayload,birthDate:'2001-01-01'},form).requestId;assert.notEqual(changedId,payload.requestId);
 store.beginSurvey(form);assert.notEqual(store.payloadWithId(originalPayload,form).requestId,payload.requestId);
 const [a,b]=await Promise.all([send(payload),send(payload)]);assert.equal(a.recordId,b.recordId);
 assert.equal(docs.get('emr_patients/'+a.patientId).recordCount,1);
 let list=await store.patients();assert.equal(list.length,1);assert.equal(list[0].records.length,0);assert.equal(list[0].data,undefined);assert.equal(readCollections.at(-1),'emr_patients');
 await store.loadRecords(list[0]);assert.equal(list[0].records.length,1);assert.equal(list[0].records[0].data,undefined);
 await store.loadContent(list[0].records[0]);assert.equal(list[0].records[0].data,JSON.stringify(form));
 const second=await send({...payload,requestId:webcrypto.randomUUID()});assert.equal(second.patientId,a.patientId);
 // Identical legacy timestamp/category still targets a specific document ID.
 const firstMeta=docs.get('emr_records/'+a.recordId);docs.set('emr_records/'+second.recordId,{...docs.get('emr_records/'+second.recordId),ts:firstMeta.ts});
 context.window._patients=list;context.window._currentPatientIdx=0;context.window._currentRecordId=a.recordId;
 for(const [field,value] of [['doctorNote','환자 안내'],['privateNote','비공개\n메모'],['interpretationNote','판독 결과']]){
  await send({type:'updateNote',recordId:a.recordId,field,value});assert.equal(docs.get('emr_record_content/'+a.recordId)[field],value);assert.equal(docs.get('emr_record_content/'+second.recordId)[field],'');
 }
 await assert.rejects(send({type:'updateNote',recordId:a.recordId,field:'data',value:'overwrite'}));
 assert.equal(docs.get('emr_record_content/'+a.recordId).data,JSON.stringify(form));
 await send({type:'updateChart',patientId:a.patientId,newChartNumber:'TEST-1'});assert.equal(docs.get('emr_patients/'+a.patientId).chartNumber,'TEST-1');
 const deletion={type:'recordDelete',recordId:a.recordId,requestId:webcrypto.randomUUID()};await send(deletion);await send(deletion);
 assert.equal(docs.get('emr_patients/'+a.patientId).recordCount,1);assert.equal(docs.get('emr_records/'+a.recordId).deleted,true);assert.equal(docs.get('emr_records/'+second.recordId).deleted,false);
 assert.equal(docs.get('emr_record_content/'+a.recordId).data,JSON.stringify(form),'Deletion retains recoverable original');
 await assert.rejects(store.loadContent({id:a.recordId}));await assert.rejects(send({type:'updateNote',recordId:a.recordId,field:'privateNote',value:'after delete'}));
 await store.loadRecords(list[0]);assert.equal(list[0].records.length,1);assert.equal(list[0].records[0].id,second.recordId);

 // No-login submissions only write intake + receipt; staff later imports once.
 db.writeBatch=()=>{const writes=[];return {set:(key,value)=>writes.push([key,value]),commit:async()=>{for(const [key] of writes)assert(!docs.has(key));for(const [key,value] of writes)docs.set(key,clone(value));}};};
 db.serverTimestamp=()=> '2026-10-03T01:02:03Z';
 const actualSnap=snap;
 // Supply Firestore Timestamp behavior only when reading intake documents.
 const priorGet=db.getDocsFromServer;db.getDocsFromServer=async q=>{const result=await priorGet(q);if(q.c==='emr_intakes')result.docs=result.docs.map(d=>({id:d.id,data:()=>({...d.data(),createdAt:{toDate:()=>new Date('2026-10-03T01:02:03Z')}})}));return result;};
 // ready() holds copies of SDK methods, so install the additions on that returned object.
 const ready=await store.ready();Object.assign(ready,{writeBatch:db.writeBatch,serverTimestamp:db.serverTimestamp,getDocsFromServer:db.getDocsFromServer});
 auth.currentUser=null;
 const incoming={requestId:webcrypto.randomUUID(),name:'접수 검증',birthDate:'2000-01-01',gender:'여',category:'유산후',formData:{misChiefComplaint:'원문 보존'}};
 const recordCount=[...docs.keys()].filter(k=>k.startsWith('emr_records/')).length;
 assert.equal((await send(incoming)).state,'complete');assert.equal((await send(incoming)).state,'complete');assert.equal((await store.receipt(incoming.requestId)).state,'complete');
 assert.equal([...docs.keys()].filter(k=>k.startsWith('emr_records/')).length,recordCount);assert.equal(docs.get('emr_intakes/'+incoming.requestId).data,JSON.stringify(incoming.formData));
 const probe=await store.request('https://emr.local/firebase?type=mpsMental&op=status&requestId='+incoming.requestId).then(r=>r.json());assert.equal(probe.state,'complete');
 auth.currentUser={uid:'staff-test',email:'staff@test.invalid',getIdTokenResult:async()=>({claims:{emrStaff:true,emrName:'검증 직원'}})};
 await store.patients();await store.patients();assert.equal([...docs.keys()].filter(k=>k.startsWith('emr_records/')).length,recordCount+1);
 assert.equal(docs.get('emr_record_content/r_'+incoming.requestId).data,JSON.stringify(incoming.formData));assert.equal(docs.get('emr_records/r_'+incoming.requestId).ts,'2026-10-03T01:02:03.000Z');assert.equal(docs.get('emr_intakes/'+incoming.requestId).imported,true);
 const logs=[...docs].filter(([key])=>key.startsWith('emr_audit/')).map(([,value])=>value);assert(logs.every(e=>e.actorUid==='staff-test'));assert.equal(logs.filter(e=>e.action==='record_delete').length,1);assert.equal(logs.filter(e=>e.action==='note_update').length,3);assert(logs.some(e=>e.action==='chart_update'&&e.before===''&&e.after==='TEST-1'));
 console.log('PASS: public write-only intake, retry receipt, no staff login, delayed idempotent staff import and original submission timestamp');
 console.log('PASS: Firebase summary-only reads, lazy content, exact JSON preservation, concurrent retry deduplication, exact-ID note isolation, chart updates, idempotent deletion and deleted-record guards');
})().catch(error=>{console.error(error);process.exitCode=1;});
