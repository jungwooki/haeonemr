// Archive a single exact record, then remove it from the active records sheet.
function recordDeleteJson_(value){
  value.protocol='haeon-record-delete-v1';
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function recordDeleteGet_(p){
  try{
    imageAuth_(p.password);
    if(p.op==='capabilities') return recordDeleteJson_({ok:true});
    if(p.op!=='status'||!/^[a-zA-Z0-9-]{16,80}$/.test(p.requestId||'')) throw new Error('올바르지 않은 삭제 조회입니다.');
    var sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('record_delete_requests');
    var result=sheet?imageRow_(sheet,p.requestId):{row:0};
    return recordDeleteJson_(Object.assign({ok:true},result.row?result.items:{state:'pending'}));
  }catch(error){return recordDeleteJson_({ok:false,error:error.message});}
}
function recordDeletePost_(d){
  var lock=LockService.getScriptLock(),receipts,removed=false;
  try{
    imageAuth_(d.password);
    if(!/^[a-zA-Z0-9-]{16,80}$/.test(d.requestId||'')||typeof d.name!=='string'||!d.name||!isFinite(new Date(d.ts).getTime())||typeof d.category!=='string') throw new Error('삭제할 문진 정보가 올바르지 않습니다.');
    lock.waitLock(30000);receipts=imageSheet_('record_delete_requests');
    var previous=imageRow_(receipts,d.requestId);
    if(previous.row) return recordDeleteJson_(Object.assign({ok:true},previous.items));
    var records=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('records');
    var rows=records?records.getDataRange().getValues():[],matches=[];
    rows.forEach(function(row,index){
      if(String(row[2])===d.name&&String(row[3]||'')===String(d.chartNumber||'')&&String(row[1]||'소아')===d.category&&new Date(row[0]).getTime()===new Date(d.ts).getTime()) matches.push({row:index+1,data:row});
    });
    if(matches.length!==1) throw new Error(matches.length?'동일한 문진 기록이 여러 개입니다. 시트에서 확인해 주세요.':'기록을 찾지 못했습니다. 목록을 다시 조회해 주세요.');
    var archive=imageSheet_('deleted_records');
    archive.appendRow([d.requestId,new Date()].concat(matches[0].data));
    SpreadsheetApp.flush();
    records.deleteRow(matches[0].row);removed=true;
    SpreadsheetApp.flush();
    receipts.appendRow([d.requestId,JSON.stringify({state:'complete'}),new Date()]);
    return recordDeleteJson_({ok:true,state:'complete'});
  }catch(error){
    if(receipts) receipts.appendRow([d.requestId,JSON.stringify({state:removed?'complete':'failed',error:removed?'':error.message}),new Date()]);
    return recordDeleteJson_({ok:false,error:error.message});
  }finally{if(lock.hasLock()) lock.releaseLock();}
}
