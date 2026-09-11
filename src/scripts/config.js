
/* ===================== 0. 저장소 설정 (Google Sheet) =====================
   1) 새 구글시트를 만들고 확장 프로그램 > Apps Script 에서 아래 코드를 붙여넣으세요:

   기존 문진·메모 기능과 이미지 API가 포함된 서버 코드는 같은 폴더의 Code.gs입니다.
   연결된 구글시트의 Apps Script에서 Code.gs 전체를 교체하고 setupEmrImages를 한 번 실행하세요.
   배포 > 배포 관리 > 편집 > 새 버전으로 기존 웹 앱을 업데이트하면 현재 URL을 계속 사용할 수 있습니다.
   상세 절차: IMAGE_SETUP.md


   ※ 기존에 이 스크립트를 쓰고 계셨다면, 위 코드로 전체 교체 후 반드시
     "배포 > 배포 관리 > 편집 > 새 버전"으로 다시 배포해야 반영됩니다.
     (이번 업데이트로 각 기록에 "주치의 안내"(환자용), "프리노트"(원장 전용) 두 칸이 추가됐고,
      기존처럼 환자는 이름+차트번호 기준으로 묶여서 검색됩니다.)

   2) 배포 > 새 배포 > 웹 앱: 실행 계정 "나", 액세스 권한 "모든 사용자"로 배포
   3) 발급된 웹 앱 URL을 아래 SHEET_URL 에 붙여넣으세요.
================================================================= */
const CONFIG = { SHEET_URL: 'https://script.google.com/macros/s/AKfycbzJUDABoEZ2GQqxuS5KuedW-HTxbVVyQHuS-Dra5Y35DlIaoA5GMjTBSbU_dXcVuTfMdQ/exec' };
let cameFromSearch = false;
function triggerFadeIn(el){ if(!el) return; el.classList.remove('animate-fade-in'); void el.offsetWidth; el.classList.add('animate-fade-in'); }

window.goHome = function(){
  ['report-view','deep-report-view','diet-report-view','women-report-view','pain-report-view','sports-report-view','postpartum-report-view'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.classList.remove('active');
  });
  ['app-shell','deep-app-shell','diet-app-shell','women-app-shell','pain-app-shell','sports-app-shell','postpartum-app-shell','search-view','hub-view'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display='none';
  });
  const gw=document.getElementById('gateway-view'); gw.style.display='flex'; triggerFadeIn(gw);
};

