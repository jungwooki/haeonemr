const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),events={},writes=[];let fail=false,release;
const ctx={console,setTimeout,clearTimeout,CONFIG:{STORE_URL:'test'},document:{getElementById:id=>elements.get(id),addEventListener(){}},mountEmrWorkspace(){},emrStoreRequest:async(url,options)=>{const data=JSON.parse(options.body);writes.push(data);if(release)await new Promise(resolve=>{release.resolve=resolve;});if(fail)throw Error('offline');return {json:async()=>({ok:true})};},addEventListener:(type,fn)=>events[type]=fn};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync('mps-emr/src/scripts/notes.js','utf8'),ctx);const autosave=vm.runInContext('EmrNoteAutosave',ctx);
function bind(id){ctx._currentRecordId=id;ctx._currentRecordTs='2026-10-03T01:00:00Z';ctx._currentRecordName='Test';ctx._currentRecordCategory='통증';for(const suffix of ['private-note','doctor-note','interpretation-note']){elements.set('rp-'+suffix,{id:'rp-'+suffix,value:'',isConnected:true});elements.set('rp-'+suffix+'-toast',{style:{},setAttribute(){}});}autosave.bind('rp');}
function input(suffix,value){const el=elements.get('rp-'+suffix);el.value=value;el.oninput();return el;}
(async()=>{
ctx._patients=[{records:[{id:'a'},{id:'b'}]}];bind('a');
input('private-note','초안');input('private-note','최종');input('doctor-note','안내');input('interpretation-note','판독');await autosave.flush();assert.equal(writes.length,3);assert.equal(writes.find(w=>w.field==='privateNote').value,'최종');assert.equal(autosave.pending(),false);
release={};input('private-note','먼저');const pending=autosave.flush();await Promise.resolve();input('private-note','나중');const unblock=release.resolve;release=null;unblock();await pending;assert.equal(writes.at(-1).value,'나중');assert.equal(ctx._patients[0].records[0].privateNote,'나중');
fail=true;input('doctor-note','보존할 안내');assert.equal(await autosave.flush(),false);assert(autosave.pending());let prevented=false;events.beforeunload({preventDefault(){prevented=true;}});assert(prevented);assert.equal(elements.get('rp-doctor-note').value,'보존할 안내');fail=false;await autosave.flush();
input('private-note','');await autosave.flush();assert.equal(writes.at(-1).value,'');
const count=writes.length;await autosave.flush();assert.equal(writes.length,count);
const el=input('private-note','이전 회차');bind('b');await autosave.flush();assert.equal(writes.at(-1).recordId,'a');assert.equal(elements.get('rp-private-note').value,'');input('private-note','새 회차');await autosave.flush();assert.equal(writes.at(-1).recordId,'b');
const composing=elements.get('rp-doctor-note');composing.oncompositionstart();input('doctor-note','한');const before=writes.length;await new Promise(r=>setTimeout(r,650));assert.equal(writes.length,before);composing.oncompositionend();await new Promise(r=>setTimeout(r,650));assert.equal(writes.at(-1).value,'한');
console.log('PASS: all three notes, debounce, IME composition, serialized latest edits, exact record isolation, empty values, failure retry and unload guard');
})().catch(error=>{console.error(error);process.exitCode=1;});
