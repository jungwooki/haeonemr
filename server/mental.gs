// M-survey receipts contain no patient data. Records use the existing records schema.
function mentalJson_(value){
  value.protocol='haeon-mental-v1';
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function mentalGet_(p){
  if(p.op==='probe') return mentalJson_({ok:true});
  if(p.op!=='status'||!/^[-a-f0-9]{36}$/.test(p.requestId||'')) return mentalJson_({ok:false,error:'올바르지 않은 저장 확인 요청입니다.'});
  var sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('mental_requests');
  var rows=sheet?sheet.getDataRange().getValues():[];
  for(var i=rows.length-1;i>=0;i--) if(rows[i][0]===p.requestId) return mentalJson_({ok:true,state:'complete'});
  return mentalJson_({ok:true,state:'pending'});
}
function mentalPost_(d){
  var lock=LockService.getScriptLock();
  try{
    if(!/^[-a-f0-9]{36}$/.test(d.requestId||'')) throw new Error('저장 식별자가 올바르지 않습니다.');
    var f=d.formData;
    if(!f||!['student','soccer','baseball','basketball','volleyball','golf'].includes(f.sport)) throw new Error('종목을 확인해 주세요.');
    if(typeof d.name!=='string'||!d.name.trim()||d.name.length>100||!['남','여'].includes(d.gender)||!/^\d{4}-\d{2}-\d{2}$/.test(d.birthDate||'')) throw new Error('기본 정보를 확인해 주세요.');
    if(!f.answers||Object.keys(f.answers).length!==51) throw new Error('51문항에 모두 응답해 주세요.');
    for(var no=1;no<=51;no++) if(!Number.isInteger(f.answers[no])||f.answers[no]<1||f.answers[no]>6) throw new Error('응답 값을 확인해 주세요.');
    if(JSON.stringify(f).length>30000) throw new Error('저장 데이터가 너무 큽니다.');
    lock.waitLock(30000);
    var ss=SpreadsheetApp.getActiveSpreadsheet();
    var receipts=ss.getSheetByName('mental_requests')||ss.insertSheet('mental_requests');
    var receiptRows=receipts.getDataRange().getValues();
    if(receiptRows.some(function(row){return row[0]===d.requestId;})) return mentalJson_({ok:true,state:'complete'});
    var sheet=ss.getSheetByName('records')||ss.insertSheet('records');
    var rows=sheet.getDataRange().getValues();
    // A record may have committed before a receipt write failed. Never append it twice.
    var exists=rows.some(function(row){
      if(row[1]!=='MPS 멘탈') return false;
      try{return JSON.parse(row[7]).submissionId===d.requestId;}catch(ignore){return false;}
    });
    if(!exists){
      f.submissionId=d.requestId;f.name=d.name.trim();f.dob=d.birthDate;f.gender=d.gender;
      sheet.appendRow([new Date(),'MPS 멘탈',d.name.trim(),'',d.gender,d.birthDate,'',JSON.stringify(f),'','']);
      SpreadsheetApp.flush();
    }
    receipts.appendRow([d.requestId,new Date()]);
    return mentalJson_({ok:true,state:'complete'});
  }catch(error){return mentalJson_({ok:false,error:error.message});}
  finally{if(lock.hasLock()) lock.releaseLock();}
}
