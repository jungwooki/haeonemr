// Replace the existing bound Apps Script Code.gs with this entire file.
function doPost(e){
  var imagePayload=JSON.parse(e.postData.contents);
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
    var col = (d.field === 'privateNote') ? 10 : 9; // 9=주치의 안내, 10=프리노트
    for(var i=0;i<rows.length;i++){
      var rowTs = rows[i][0];
      var rowTime = (rowTs instanceof Date) ? rowTs.getTime() : new Date(rowTs).getTime();
      if(String(rows[i][2]).trim() === String(d.name).trim() && Math.abs(rowTime - targetTime) < 2000){
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
  if(e.parameter.type==='recordDelete') return recordDeleteGet_(e.parameter);
  if(e.parameter.type==='haeonImages') return imageGet_(e.parameter);
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('records');
  var q = (e.parameter.q || '').trim();
  var rows = sh ? sh.getDataRange().getValues() : [];
  var patients = {}; // key: 이름||차트번호
  for (var i=0;i<rows.length;i++){
    var r = rows[i];
    // r 열 순서: [날짜, 카테고리, 이름, 차트번호, 성별, 생년월일/나이, 연령대, 데이터JSON, 주치의안내, 프리노트]
    var name = r[2], chart = r[3] || '';
    if (!name) continue;
    if (q && name.toString().indexOf(q) === -1 && chart.toString().indexOf(q) === -1) continue;
    var key = name + '||' + chart;
    if (!patients[key]) patients[key] = { name: name, chartNumber: chart, records: [] };
    patients[key].records.push({ ts:r[0], category:r[1], gender:r[4], birthDate:r[5], ageGroup:r[6], data:r[7], doctorNote:r[8]||'', privateNote:r[9]||'' });
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
        return {id:item.id,name:item.name,createdAt:item.createdAt,thumbnail:thumbnail,thumbnailMime:mime,ocr:item.ocr||null};
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
    }else if(d.operation==='ocr'||d.operation==='review'){
      var exam=items.filter(function(item){return item.id===d.id;})[0];
      if(!exam) throw new Error('이 문진 기록에 첨부된 이미지가 아닙니다.');
      if(d.operation==='ocr'){
        if(exam.ocr) throw new Error('이미 읽은 검사지입니다. 추출 결과 확인에서 수정해 주세요.');
        exam.ocr=runImageOcr_(exam);
      }else{
        if(!exam.ocr) throw new Error('검사지를 먼저 읽어 주세요.');
        exam.ocr.values=validateReviewedValues_(d.values);exam.ocr.reviewed=true;exam.ocr.reviewedAt=new Date().toISOString();
      }
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

// Labels and units must remain explicit: never infer values from graph axes.
var OCR_FIELDS = {
 examDate:['검사일시','text'],birthDate:['생년월일','text'],gender:['성별','text'],memberNumber:['검사지 회원번호','text'],
 height:['키','cm'],weight:['체중','kg'],skeletalMuscleMass:['골격근량','kg'],bodyFatMass:['체지방량','kg'],bodyFatPercent:['체지방률','%'],bmi:['BMI','kg/m²'],
 bodyWater:['체수분','L'],protein:['단백질','kg'],minerals:['무기질','kg'],growthScore:['성장점수','점'],phaseAngle:['전신 위상각','°']
};
function parseExamText_(text){
  var values={},evidence={};
  var patterns={height:/(?:신장|키|Height)\s*(?:\(cm\)|cm)?\s*[:：]?\s*(\d{2,3}(?:\.\d+)?)\s*(?:cm)?/ig,
    weight:/(?:체\s*중|Weight)\s*(?:\(kg\)|kg)?\s*[:：]?\s*(\d{1,3}(?:\.\d+)?)/ig,
    skeletalMuscleMass:/(?:골격근량|Skeletal Muscle Mass)\s*(?:\(kg\)|kg)?\s*[:：]?\s*(\d{1,3}(?:\.\d+)?)/ig,
    bodyFatMass:/(?:체지방량|체지방(?!률)|Body Fat Mass)\s*(?:\(kg\)|kg)?\s*[:：]?\s*(\d{1,3}(?:\.\d+)?)/ig,
    bodyFatPercent:/(?:체지방률|Percent Body Fat)\s*(?:\(%\)|%)?\s*[:：]?\s*(\d{1,3}(?:\.\d+)?)/ig,
    bmi:/(?:B\s*M\s*I|Body Mass Index)\s*(?:\(kg\/m[²2]\)|kg\/m[²2])?\s*[:：]?\s*(\d{1,2}(?:\.\d+)?)/ig,
    bodyWater:/체수분\s*(?:\(L\)|L)?\s*[:：]?\s*(\d{1,3}(?:\.\d+)?)/ig,
    protein:/단백질\s*(?:\(kg\)|kg)?\s*[:：]?\s*(\d{1,3}(?:\.\d+)?)/ig,
    minerals:/무기질\s*(?:\(kg\)|kg)?\s*[:：]?\s*(\d{1,2}(?:\.\d+)?)/ig,
    growthScore:/(?:성장점수|Growth Score)\s*[:：]?\s*(\d{1,3}(?:\.\d+)?)\s*(?:\/\s*100)?/ig,
    phaseAngle:/(?:전신\s*위상각|Whole Body Phase Angle)\s*[:：]?\s*(\d{1,2}(?:\.\d+)?)/ig};
  var lines=String(text).split(/\r?\n/).map(function(line){return line.trim();}).filter(Boolean);
  Object.keys(patterns).forEach(function(key){
    var candidates=[];
    lines.forEach(function(line,index){
      // Only the label line, or a following line consisting solely of one measurement.
      var next=lines[index+1]||'';
      var sample=line+(/^\d+(?:\.\d+)?\s*(?:kg|cm|L|%|°|점)?$/.test(next)?'\n'+next:'');
      var regex=patterns[key];regex.lastIndex=0;var match;
      while((match=regex.exec(sample))!==null){
        var trailing=sample.slice(match.index+match[0].length);
        if(/^\s*\d/.test(trailing)||/^\s*[~–-]/.test(trailing)) continue;
        candidates.push({value:Number(match[1]),source:sample});
      }
    });
    var unique=candidates.filter(function(item,index,all){return all.findIndex(function(other){return other.value===item.value;})===index;});
    if(unique.length===1){values[key]=unique[0].value;evidence[key]=unique[0].source;}
  });
  [['examDate',/(?:검사일시|검사일자|검사일)\s*[:：]?\s*(\d{4})[.\/-]\s*(\d{1,2})[.\/-]\s*(\d{1,2})\.?\s*(\d{1,2}:\d{2})?/],['birthDate',/생년월일\s*[:：]?\s*(\d{4})[.\/-]\s*(\d{1,2})[.\/-]\s*(\d{1,2})/]].forEach(function(pair){
    var match=String(text).match(pair[1]);if(match){values[pair[0]]=match[1]+'-'+('0'+match[2]).slice(-2)+'-'+('0'+match[3]).slice(-2)+(match[4]?' '+match[4]:'');evidence[pair[0]]=match[0];}
  });
  var gender=String(text).match(/성별\s*[:：]?\s*(남성|여성|남|여)/);if(gender){values.gender=gender[1];evidence.gender=gender[0];}
  var member=String(text).match(/회원번호\s*[:：]?\s*(\d+)/);if(member){values.memberNumber=member[1];evidence.memberNumber=member[0];}
  return {values:values,evidence:evidence};
}
function runImageOcr_(item){
  if(typeof Drive==='undefined') throw new Error('Apps Script의 서비스에서 Drive API(v3)를 추가한 뒤 다시 배포해 주세요.');
  var original=DriveApp.getFileById(item.id).getBlob();
  if(['image/jpeg','image/png','image/gif'].indexOf(original.getContentType())<0) throw new Error('자동 읽기는 JPG, PNG, GIF를 지원합니다. WEBP는 PNG 또는 JPG로 첨부해 주세요.');
  var temp;
  try{
    temp=Drive.Files.create({name:'EMR OCR '+Utilities.getUuid(),mimeType:'application/vnd.google-apps.document',parents:[imageFolder_().getId()]},original,{ocrLanguage:'ko',fields:'id'});
    var text=DocumentApp.openById(temp.id).getBody().getText();
    if(!text.trim()) throw new Error('읽을 수 있는 글씨가 없습니다. 선명한 검사지를 첨부해 주세요.');
    // Keep one sheet cell under its 50,000-character limit across three images.
    var parsed=parseExamText_(text);Object.keys(parsed.evidence).forEach(function(key){parsed.evidence[key]=parsed.evidence[key].slice(0,200);});parsed.rawText=text.slice(0,7000);parsed.truncated=text.length>7000;parsed.readAt=new Date().toISOString();
    parsed.reviewed=false;return parsed;
  }finally{if(temp&&temp.id) DriveApp.getFileById(temp.id).setTrashed(true);}
}
function validateReviewedValues_(values){
  if(!values||typeof values!=='object'||Array.isArray(values)) throw new Error('확인할 검사 수치가 없습니다.');
  var cleaned={};
  Object.keys(OCR_FIELDS).forEach(function(key){
    var value=values[key];if(value===undefined||value===null||value==='') return;
    if(OCR_FIELDS[key][1]==='text'){
      if(typeof value!=='string'||value.length>80) throw new Error('검사 정보 입력값을 확인해 주세요.');
      cleaned[key]=value.trim();
    }else{
      if(typeof value!=='number'||!isFinite(value)||value<0) throw new Error('수치는 0 이상의 숫자로 입력해 주세요.');
      cleaned[key]=value;
    }
  });
  if(!Object.keys(cleaned).length) throw new Error('확인한 검사 항목을 하나 이상 입력해 주세요.');
  return cleaned;
}

function setupEmrOcr(){
  setupEmrImages();
  if(typeof Drive==='undefined') throw new Error('왼쪽 서비스 +에서 Drive API(v3)를 추가하세요.');
  Drive.Files.list({pageSize:1,fields:'files(id)'});
  var temp=DocumentApp.create('EMR OCR 권한 확인');
  DriveApp.getFileById(temp.getId()).setTrashed(true);
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
