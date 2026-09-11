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

