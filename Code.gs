// Replace the existing bound Apps Script Code.gs with this entire file.
function doPost(e){
  if(!e||!e.postData||typeof e.postData.contents!=='string'){
    var message='doPost는 편집기의 실행 버튼으로 테스트하지 않습니다. 저장 후 배포 → 배포 관리 → 수정 → 새 버전 → 배포를 진행하고, EMR 웹페이지에서 설문을 제출해 주세요.';
    console.warn(message);
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:message})).setMimeType(ContentService.MimeType.JSON);
  }
  var imagePayload=JSON.parse(e.postData.contents);
  if(imagePayload.type==='mpsMental') return mentalPost_(imagePayload);
  if(imagePayload.type==='recordDelete') return recordDeletePost_(imagePayload);
  if(imagePayload.type==='haeonImages') return imagePost_(imagePayload);
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('records')
        || SpreadsheetApp.getActiveSpreadsheet().insertSheet('records');
  var d = JSON.parse(e.postData.contents);
  if(d.type === 'updateChart'){
    var rows = sh.getDataRange().getValues();
    for(var i=0;i<rows.length;i++){
      if(String(rows[i][2]).trim() === String(d.name).trim()){
        sh.getRange(i+1, 4).setValue(d.newChartNumber || '');
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
  }
  if(d.type === 'updateNote'){
    var rows = sh.getDataRange().getValues();
    var targetTime = new Date(d.ts).getTime();
    var noteColumns={doctorNote:9,privateNote:10,interpretationNote:11};
    var col=noteColumns[d.field];
    if(!col) return ContentService.createTextOutput(JSON.stringify({ok:false,error:'지원하지 않는 메모 항목입니다.'})).setMimeType(ContentService.MimeType.JSON);
    for(var i=0;i<rows.length;i++){
      var rowTs = rows[i][0];
      var rowTime = (rowTs instanceof Date) ? rowTs.getTime() : new Date(rowTs).getTime();
      if(String(rows[i][2]).trim() === String(d.name).trim() && (d.category ? rowTime===targetTime && String(rows[i][1]||'소아')===d.category : Math.abs(rowTime-targetTime)<2000)){
        sh.getRange(i+1, col).setValue(d.value || '');
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
  }
  // 기본 동작: 새 문진 결과 저장 (9,10번째 열은 주치의 안내/프리노트 - 처음엔 비워둠)
  sh.appendRow([new Date(), d.category || '', d.name || '', d.chartNumber || '', d.gender || '', d.birthDate || '', d.ageGroup || '', JSON.stringify(d.formData), '', '']);
  return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
}
function doGet(e){
  if(!e||!e.parameter){
    var message='doGet는 배포된 웹 앱 URL로 호출하는 함수입니다. 편집기의 실행 버튼 대신 EMR 웹페이지에서 조회해 주세요.';
    console.warn(message);
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:message})).setMimeType(ContentService.MimeType.JSON);
  }
  if(e.parameter.type==='noteCapabilities') return ContentService.createTextOutput(JSON.stringify({ok:true,protocol:'haeon-notes-v2'})).setMimeType(ContentService.MimeType.JSON);
  if(e.parameter.type==='mpsMental') return mentalGet_(e.parameter);
  if(e.parameter.type==='recordDelete') return recordDeleteGet_(e.parameter);
  if(e.parameter.type==='haeonImages') return imageGet_(e.parameter);
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('records');
  var q = (e.parameter.q || '').trim();
  var rows = sh ? sh.getDataRange().getValues() : [];
  // Small save confirmation response; older clients keep the full search API.
  if(e.parameter.type==='noteRead'){
    var noteFields={doctorNote:8,privateNote:9,interpretationNote:10};
    var field=e.parameter.field, matches=[];
    if(!Object.prototype.hasOwnProperty.call(noteFields,field)) return ContentService.createTextOutput(JSON.stringify({ok:false,error:'Unsupported note field'})).setMimeType(ContentService.MimeType.JSON);
    rows.forEach(function(row){
      if(String(row[2])!==q||new Date(row[0]).getTime()!==new Date(e.parameter.ts).getTime()||String(row[1]||'소아')!==e.parameter.category) return;
      var record={ts:row[0],category:row[1]||'소아'};
      record[field]=row[noteFields[field]]||'';
      matches.push(record);
    });
    return ContentService.createTextOutput(JSON.stringify({ok:true,patients:matches.length?[{name:q,records:matches}]:[]})).setMimeType(ContentService.MimeType.JSON);
  }
  var patients = {}; // key: 이름||차트번호
  for (var i=0;i<rows.length;i++){
    var r = rows[i];
    // r 열 순서: [날짜, 카테고리, 이름, 차트번호, 성별, 생년월일/나이, 연령대, 데이터JSON, 주치의안내, 프리노트]
    var name = r[2], chart = r[3] || '';
    if (!name) continue;
    if (q && name.toString().indexOf(q) === -1 && chart.toString().indexOf(q) === -1) continue;
    var key = name + '||' + chart;
    if (!patients[key]) patients[key] = { name: name, chartNumber: chart, records: [] };
    patients[key].records.push({ ts:r[0], category:r[1], gender:r[4], birthDate:r[5], ageGroup:r[6], data:r[7], doctorNote:r[8]||'', privateNote:r[9]||'', interpretationNote:r[10]||'' });
  }
  var out = [];
  for (var k in patients){
    patients[k].records.sort(function(a,b){ return new Date(b.ts) - new Date(a.ts); });
    out.push(patients[k]);
  }
  out.sort(function(a,b){
    var ad = a.records[0] ? new Date(a.records[0].ts) : 0;
    var bd = b.records[0] ? new Date(b.records[0].ts) : 0;
    return bd - ad;
  });
  return ContentService.createTextOutput(JSON.stringify({ok:true, patients:out})).setMimeType(ContentService.MimeType.JSON);
}

// Image API. Originals remain private in Drive; reads pass through this API.
var IMAGE_PROTOCOL = 'haeon-images-v2';
function imageJson_(value){
  value.protocol=IMAGE_PROTOCOL;
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function imageAuth_(password){
  var expected=PropertiesService.getScriptProperties().getProperty('EMR_PASSWORD')||'1824';
  if(String(password||'')!==expected) throw new Error('EMR 비밀번호를 확인해 주세요.');
}
function imageKey_(key){
  if(typeof key!=='string'||key.length>1000) throw new Error('환자 정보가 올바르지 않습니다.');
  var identity=JSON.parse(key);
  if(!Array.isArray(identity)||identity.length!==4||identity[0]!=='record'||!identity[1]||!identity[2]||!identity[3]) throw new Error('환자 정보가 올바르지 않습니다.');
  var rows=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('records').getDataRange().getValues();
  if(!rows.some(function(row){return String(row[2])===identity[1] && new Date(row[0]).getTime()===new Date(identity[2]).getTime() && String(row[1]||'소아')===identity[3];})) throw new Error('연결할 문진 기록을 찾지 못했습니다.');
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,key));
}
function imageSheet_(name){
  var ss=SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name)||ss.insertSheet(name);
}
function imageRow_(sheet,key){
  var rows=sheet.getDataRange().getValues();
  for(var i=0;i<rows.length;i++) if(String(rows[i][0])===key) return {row:i+1,items:JSON.parse(rows[i][1]||'[]')};
  return {row:0,items:[]};
}
function imageFolder_(){
  var props=PropertiesService.getScriptProperties(),id=props.getProperty('EMR_IMAGE_FOLDER_ID');
  if(id) return DriveApp.getFolderById(id);
  var folder=DriveApp.createFolder('HAEON EMR 이미지 자료');
  props.setProperty('EMR_IMAGE_FOLDER_ID',folder.getId());return folder;
}
function setupEmrImages(){
  imageFolder_();imageSheet_('record_images');imageSheet_('image_requests');
}
function imageGet_(p){
  try{
    imageAuth_(p.password);var key=imageKey_(p.key);
    if(p.op==='status'){
      var requests=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('image_requests');
      var receipt=requests?imageRow_(requests,key+':'+p.requestId):{row:0};
      return imageJson_(receipt.row?Object.assign({ok:true},receipt.items):{ok:true,state:'pending'});
    }
    var sheet=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('record_images');
    var items=sheet?imageRow_(sheet,key).items:[];
    if(p.op==='list'){
      return imageJson_({ok:true,images:items.map(function(item){
        var thumbnail=null,mime=null;
        try{var thumb=DriveApp.getFileById(item.id).getThumbnail();if(thumb){thumbnail=Utilities.base64Encode(thumb.getBytes());mime=thumb.getContentType();}}catch(e){}
        return {id:item.id,name:item.name,createdAt:item.createdAt,thumbnail:thumbnail,thumbnailMime:mime};
      })});
    }
    if(p.op==='read'){
      var item=items.filter(function(item){return item.id===p.id;})[0];
      if(!item) throw new Error('이 환자에게 첨부된 이미지가 아닙니다.');
      var blob=DriveApp.getFileById(item.id).getBlob();
      return imageJson_({ok:true,mimeType:blob.getContentType(),data:Utilities.base64Encode(blob.getBytes())});
    }
    throw new Error('지원하지 않는 이미지 요청입니다.');
  }catch(error){return imageJson_({ok:false,error:error.message});}
}
function imageValidateFile_(file){
  var supported=['image/jpeg','image/png','image/webp','image/gif'];
  if(!file||supported.indexOf(file.mimeType)<0||typeof file.data!=='string'||file.data.length>13981016) throw new Error('파일당 10MB 이하의 JPG, PNG, WEBP, GIF 이미지만 첨부할 수 있습니다.');
  var bytes=Utilities.base64Decode(file.data),b=bytes.map(function(v){return v&255;});
  if(!bytes.length||bytes.length>10485760) throw new Error('이미지 파일 크기를 확인해 주세요.');
  var signatures={
    'image/jpeg':b[0]===255&&b[1]===216&&b[2]===255,
    'image/png':b.slice(0,8).join(',')==='137,80,78,71,13,10,26,10',
    'image/gif':String.fromCharCode.apply(null,b.slice(0,6)).match(/^GIF8[79]a$/)!==null,
    'image/webp':String.fromCharCode.apply(null,b.slice(0,4))==='RIFF'&&String.fromCharCode.apply(null,b.slice(8,12))==='WEBP'
  };
  if(!signatures[file.mimeType]) throw new Error('올바른 이미지 파일이 아닙니다.');
  return Utilities.newBlob(bytes,file.mimeType,String(file.name||'이미지').slice(0,200));
}
function imagePost_(d){
  var lock=LockService.getScriptLock(),receiptSheet,receiptKey,created=[],committed=false;
  try{
    imageAuth_(d.password);var key=imageKey_(d.key);
    if(!/^[a-zA-Z0-9-]{16,80}$/.test(d.requestId||'')) throw new Error('요청 ID가 올바르지 않습니다.');
    lock.waitLock(30000);
    receiptKey=key+':'+d.requestId;receiptSheet=imageSheet_('image_requests');
    var previous=imageRow_(receiptSheet,receiptKey);
    if(previous.row) return imageJson_(Object.assign({ok:true},previous.items));
    var sheet=imageSheet_('record_images'),record=imageRow_(sheet,key),items=record.items;
    if(d.operation==='upload'){
      if(!Array.isArray(d.files)||!d.files.length||d.files.length+items.length>3) throw new Error('문진 기록별 이미지 자료는 최대 3개까지 첨부할 수 있습니다.');
      var blobs=d.files.map(imageValidateFile_),folder=imageFolder_();
      blobs.forEach(function(blob){
        var file=folder.createFile(blob.copyBlob().setName(Utilities.getUuid()));created.push(file);
        items.push({id:file.getId(),name:blob.getName(),createdAt:new Date().toISOString()});
      });
    }else if(d.operation==='delete'){
      var target=items.filter(function(item){return item.id===d.id;})[0];
      if(!target) throw new Error('삭제할 이미지가 없습니다.');
      DriveApp.getFileById(target.id).setTrashed(true);
      items=items.filter(function(item){return item.id!==d.id;});
    }else throw new Error('지원하지 않는 이미지 요청입니다.');
    sheet.getRange(record.row||sheet.getLastRow()+1,1,1,2).setValues([[key,JSON.stringify(items)]]);
    SpreadsheetApp.flush();committed=true;
    receiptSheet.appendRow([receiptKey,JSON.stringify({state:'complete'}),new Date()]);
    return imageJson_({ok:true,state:'complete'});
  }catch(error){
    if(!committed) created.forEach(function(file){try{file.setTrashed(true);}catch(ignore){}});
    if(receiptSheet&&receiptKey) receiptSheet.appendRow([receiptKey,JSON.stringify({state:committed?'complete':'failed',error:committed?'':error.message}),new Date()]);
    return imageJson_({ok:false,error:error.message});
  }finally{if(lock.hasLock()) lock.releaseLock();}
}

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
