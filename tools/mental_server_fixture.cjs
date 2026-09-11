// Local-only Apps Script stand-ins. No Google or external requests are made.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
function fixture(){
  const sheets={},files={},properties={};
  const spreadsheet={getSheetByName:name=>sheets[name]||null,insertSheet(name){
    const rows=[];
    return sheets[name]={rows,getDataRange:()=>({getValues:()=>rows.map(r=>r.slice())}),getLastRow:()=>rows.length,appendRow(row){rows.push(row.slice());},getRange(row,col){return {setValues(values){values.forEach((values,i)=>{rows[row-1+i]??=[];values.forEach((v,j)=>rows[row-1+i][col-1+j]=v);});},setValue(value){rows[row-1][col-1]=value;}};},deleteRow(row){rows.splice(row-1,1);}};
  }};
  function blob(bytes,mime,name){return {getBytes:()=>bytes,getContentType:()=>mime,getName:()=>name,setName(n){name=n;return this;},copyBlob:()=>blob(bytes,mime,name)};}
  const folder={getId:()=> 'fixture-folder',createFile(b){const id=crypto.randomUUID();return files[id]={getId:()=>id,getBlob:()=>b,getThumbnail:()=>b,setTrashed(){delete files[id];}};}};
  const ctx=vm.createContext({console,SpreadsheetApp:{getActiveSpreadsheet:()=>spreadsheet,flush(){}},ContentService:{MimeType:{JSON:'application/json'},createTextOutput(text){return {text,setMimeType(){return this;}};}},LockService:{getScriptLock(){let locked=false;return {waitLock(){locked=true;},hasLock:()=>locked,releaseLock(){locked=false;}};}},PropertiesService:{getScriptProperties:()=>({getProperty:k=>properties[k],setProperty(k,v){properties[k]=v;}})},DriveApp:{createFolder:()=>folder,getFolderById:()=>folder,getFileById:id=>files[id]},Utilities:{getUuid:()=>crypto.randomUUID(),base64Decode:s=>Array.from(Buffer.from(s,'base64')),base64Encode:b=>Buffer.from(b).toString('base64'),base64EncodeWebSafe:b=>Buffer.from(b).toString('base64url'),DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(a,s)=>Array.from(crypto.createHash(a).update(s).digest()),newBlob:blob}});
  vm.runInContext(fs.readFileSync(path.join(root,'Code.gs'),'utf8'),ctx);
  return {sheets,ctx,get:p=>JSON.parse(ctx.doGet({parameter:p}).text),post:d=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify(d)}}).text)};
}
module.exports={fixture,root};
