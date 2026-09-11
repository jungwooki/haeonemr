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

