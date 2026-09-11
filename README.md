# HAEON EMR 소스 구조

수정은 `src/`와 `server/`에서 하고, 실행·배포는 빌드된 `index.html`과 `Code.gs`를 사용합니다. 다른 프로젝트 폴더와 연결되지 않은 독립 구조입니다.

## 수정할 파일 찾기

| 수정 대상 | 소스 위치 |
| --- | --- |
| 문서 제목, 외부 라이브러리, 전체 화면 구성 | `src/index.template.html` |
| 입구 화면, 문진 선택 | `src/views/gateway.html`, `src/views/hub.html` |
| 각 문진 화면·리포트 | `src/views/*-survey.html`, `src/views/*-report.html` |
| 환자 검색, 완료 화면, 대화상자 | `src/views/patient-search.html`, `completion.html`, `dialogs.html` |
| 색상·레이아웃·인쇄 | `src/styles/base.css`, `design-system.css` |
| 이미지·검색·삭제·비밀번호 스타일 | `src/styles/`의 해당 CSS |
| Google Sheet 연결 주소 | `src/scripts/config.js` |
| 소아 상태·문항·화면·분석·성장·결과 | `src/scripts/state.js`, `options.js`, `pediatric-sections.js`, `analysis.js`, `growth.js`, `pediatric-report.js` |
| 심층·다이어트·여성·통증·스포츠·산후 문진 | `src/scripts/deep.js`, `diet.js`, `women.js`, `pain.js`, `sports.js`, `postpartum.js` |
| 나이 계산, UI, 화면 이동, 완료 처리 | `src/scripts/age.js`, `ui.js`, `navigation.js`, `gateway.js`, `completion.js` |
| 환자 저장·검색·메모·진료 작업 화면 | `src/scripts/records.js`, `notes.js`, `workspace.js` |
| 이미지 첨부·기록 삭제 | `src/scripts/images.js`, `record-delete.js` |
| 첫 화면 초기화 | `src/scripts/bootstrap.js` |
| 서버 문진 저장·조회 진입점 | `server/records.gs` |
| 서버 이미지 저장·인증·조회 | `server/images.gs` |
| 서버 기록 삭제·백업 | `server/record-delete.gs` |

`기존서버백업.txt`는 과거 백업이며 빌드에 포함하지 않습니다. 이미지 기능 설정은 [IMAGE_SETUP.md](IMAGE_SETUP.md)를 참고하세요.

## 빌드와 실행

Python 3.9 이상이 필요하며 추가 패키지를 설치할 필요는 없습니다. 프로젝트 최상위 폴더에서 실행합니다.

```sh
python3 emr/tools/build.py
python3 emr/tools/build.py --check
python3 -m unittest discover -s emr/tools -p 'test_*.py'
```

`emr` 폴더를 터미널에서 열었다면 명령의 `emr/`를 생략합니다.

빌드 후 `index.html`을 브라우저에서 열거나 기존 웹 호스팅에 올립니다. 기존과 같이 단일 HTML로 배포할 수 있습니다. 로컬 서버를 이용하려면 다음 명령을 실행하고 `http://127.0.0.1:8000`을 엽니다.

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory emr
```

서버를 수정했다면 빌드된 `Code.gs` 전체를 Google Apps Script에 복사하고 기존 절차대로 새 버전을 배포합니다. `server/*.gs`와 빌드된 `Code.gs`를 동시에 등록하면 함수가 중복되므로 함께 올리지 않습니다. 빌드 자체는 Google 서버에 접근하거나 배포하지 않습니다.

**`index.html`과 `Code.gs`는 생성 결과입니다. 직접 수정하면 다음 빌드에서 덮어써집니다.** 화면을 바꿀 때는 위 표에서 소스 파일을 찾아 수정하고 다시 빌드하세요. `--check`는 소스와 생성 결과가 다르면 실패하여 누락된 빌드를 알려줍니다.

## 모듈 연결 방식

- `src/index.template.html`의 `{{ include 경로 }}`가 화면·스타일 파일을 그 위치에 삽입합니다. 일부 화면 파일에도 스타일 include가 있습니다.
- `{{ scripts }}`는 `modules.json`에 적힌 순서대로 JavaScript를 합칩니다. 서버 파일도 같은 목록의 `server` 순서로 합칩니다.
- 원래의 DOM, CSS 우선순위, JavaScript 선언·실행 순서를 보존합니다. 문진 계산식, 저장 형식, 서버 URL은 변경하지 않았습니다.
- 이번 구조는 **기능별 소스 분리와 빌드 시 결합 방식**입니다. 각 JavaScript 파일은 기존 전역 상태·함수를 공유합니다. 독립적인 ES module의 `import`/`export` 구조는 아닙니다. 기존 HTML의 `onclick`과 함수 호이스팅을 유지하기 위해 하나의 스크립트로 결합합니다.
- JavaScript 파일을 추가할 때는 `modules.json`에 순서를 지정합니다. 기존 파일 순서는 초기화와 화면 연결에 영향을 주므로 임의로 바꾸지 않습니다.

## 검증 범위

최초 분리 후 재조합한 HTML과 Apps Script는 분리 전 파일과 바이트 단위로 동일함을 확인했습니다. JavaScript 25개와 서버 4개 파일의 문법 검사도 통과했습니다. 빌드 테스트는 생성 결과 일치, 소스 수정 반영, 누락 파일·중복 모듈·순환 include 검출을 확인합니다.

이번 작업에서는 실제 환자 저장·삭제, Drive 업로드, 외부 배포를 실행하지 않았습니다.

## AI MPS M-서베이

입구는 1번 AI 스마트서베이, 2번 AI MPS M-서베이, 3번 HAEON EMR 순서입니다. 2번에서는 일반 → 축구 → 야구 → 농구 → 배구 → 골프를 선택한 다음 기본 정보와 체크리스트를 작성합니다.

- 화면: `src/views/mental-survey.html`
- 디자인: `src/styles/mental-survey.css` (기존 HAEON 폰트·블루/라벤더 색상 적용)
- 문항: `src/data/mental-sports.json` (제공된 HTML의 6개 유형, 각 51문항 원문)
- 동작·분석: `src/scripts/mental-survey.js` (독립 함수 범위, 기존 문진과 상태 분리)
- 원문 보존 검사: `tools/test_mental.py`, `tools/mental-baseline.json`

6점 응답 척도, 요인별 문항 구성, 긍정요인의 평균 및 부정요인의 `7 - 평균` 계산, 결과 표시의 소수점 두 자리와 JSON 데이터 구성을 유지합니다. 선택 화면의 ‘일반’은 원본의 `student` 유형이며 결과·다운로드에서는 원본 명칭 ‘일반학생’을 유지합니다.

제출하면 Google Sheet의 기존 `records`에 `MPS 멘탈` 분류로 저장합니다. 서버의 완료 응답을 확인한 뒤 환자에게 작성 완료를 보여주며, 환자 화면에서는 결과를 공개하지 않습니다. 입구 3 HAEON EMR에서 환자 → MPS 멘탈 문진 기록을 선택하면 결과 차트, 요인별 점수, 51문항 응답, 주치의 안내, 프리노트를 확인할 수 있습니다. 결과 인쇄와 JSON 다운로드도 EMR에서 제공합니다.

이미지 첨부·조회은 기존 기록별 이미지 기능을 사용합니다. 문진 기록당 최대 3개를 저장하며, 다른 문진의 첨부와 분리됩니다. 설문 문항과 결과 계산은 원본 그대로입니다.

추가 소스: `src/views/mental-report.html`, `src/scripts/mental-emr.js`, `server/mental.gs`. 저장 확인용 `mental_requests` 시트는 자동 생성되며 요청 ID와 저장 시각만 보관합니다. 동일 요청 재시도와 저장 후 확인 응답 유실 시 중복 기록 생성을 방지합니다. 저장 결과가 불확실할 때는 제출 버튼으로 같은 요청을 재확인하며 응답 편집은 잠급니다.

### 서버 적용 (필수)

1. `python3 emr/tools/build.py`로 생성한 최신 `Code.gs` 전체를 기존 Google Apps Script의 Code.gs와 교체합니다.
2. **배포 → 배포 관리 → 수정 → 새 버전 → 배포**합니다. 기존 웹 앱 URL을 유지합니다.
3. 최신 `index.html`을 사용하는 페이지를 새로고침합니다.

구버전 서버에는 M-서베이 저장 요청을 보내지 않고 업데이트 안내를 표시합니다. 이미지 기능이 이미 설정되어 있으면 Drive 서비스를 다시 설정할 필요는 없습니다. 처음 사용하는 경우 [IMAGE_SETUP.md](IMAGE_SETUP.md)를 따릅니다.

### 저장·이미지 검증

`node emr/tools/test_mental_server.cjs`는 로컬 Apps Script 대체 환경에서 저장, 동일 요청 중복 방지, 저장 후 영수증 쓰기 실패 복구, 입력 검증, 환자 재조회, 이미지 첨부·조회·기록별 분리를 검사합니다. 실제 Google 데이터에 접속하지 않습니다. 브라우저에서도 모의 서버를 이용해 작성 → 저장 완료 → 입구 3 환자 조회 → 결과·이미지 영역 표시를 확인했습니다. 실제 Google 서버 배포는 별도 적용해야 합니다.

검증: 306문항 데이터와 분석 함수 원문 일치, 화면 ID 충돌 검사, 6유형 × 3응답 패턴 × 5요인(90개) 점수 검사, 브라우저에서 51문항 완료·미응답 방지·결과 차트, 390px 모바일 문항 배치 확인.

## 1차 리포트와 진료 메모

좌측 1차 리포트에는 자동 분석과 기존 우측의 배경 정보·환자 응답을 포함합니다. MPS 멘탈도 51문항 응답을 좌측에 표시합니다. 마지막 한의사 소견은 주치의 안내 입력 즉시 반영됩니다.

우측 순서: 프리노트 → 주치의 안내 → 판독결과 메모 → 검사(이미지자료). 판독결과 메모는 records 시트 11번째 열(K)에 저장하며 기존 9·10열은 유지합니다. 최신 Code.gs 교체 및 새 버전 배포가 필요합니다. 구버전에서는 판독 메모 저장을 차단해 기존 안내의 덮어쓰기를 방지합니다.

인쇄/PDF는 현재 문진의 좌측 1차 리포트만 출력합니다. 우측 메모·이미지 관리·환자 목록은 제외합니다. A4 기준 결과와 응답/배경 페이지를 이어 출력하며, 추가 정서 체크·긴 응답·소견은 2페이지를 넘을 수 있습니다. 멘탈 문항은 인쇄 시 2단 배치입니다.

검증: 8종 리포트 전환, 메모 순서, 소견 즉시 반영·저장·재조회, 메모별 저장 분리. 서버 검사는 node emr/tools/test_notes_server.cjs로 실행합니다. 인쇄 대화상자 호출은 확인했지만 PDF 페이지 수 자동 검증은 하지 않았습니다.

### 저장 및 재조회 성능

- 이미지 목록과 썸네일은 메모리에 최대 1분간 보관하며 동일한 동시 요청을 합칩니다. 전체 조회 캐시는 최대 24개 항목으로 제한합니다. 브라우저 저장소에는 기록하지 않습니다.
- 이미지 변경 후 캐시를 무효화합니다. 다른 기기의 변경 사항은 `목록 새로고침`으로 즉시 조회할 수 있습니다. EMR을 나가거나 다시 로그인하면 캐시를 비웁니다.
- 메모 저장 확인은 `noteRead`로 해당 기록의 해당 메모만 반환합니다. 구버전 서버는 기존 전체 조회 응답으로도 확인할 수 있지만, 작은 응답을 사용하려면 생성된 Code.gs를 새 버전으로 배포해야 합니다.
- M-서베이는 상태 조회로 서버 프로토콜 확인을 함께 수행합니다. 서버 저장 확인과 중복 저장 방지는 유지합니다.
- 원본 이미지는 압축하지 않습니다. 최초 이미지 업로드 및 환자 목록 조회에는 여전히 Drive 처리와 시트 조회 시간이 필요합니다. 실제 서버 응답 속도와 개선율은 배포 환경에서 별도로 측정해야 합니다.

### 환자 안내 가이드

AI 스마트서베이 7종의 공통 완료 화면과 메인 화면의 입구 4에서 안내를 엽니다. 안내창을 닫으면 이전 화면이 유지됩니다.

- `guides/process.html`: 진료는 이런 과정을 거칩니다.
- `guides/prescription.html`: 해온한의원 한약요법들 (76개)
- `guides/treatment.html`: 해온한의원 치료방법들 (28개)
- `guides/index.html`: 세 안내 페이지의 목록

첨부 원본은 `guides/source/`, 한약·치료 데이터는 `guides/*.json`, 공통 디자인과 동작은 `guides/guide.css`, `guides/guide.js`에 있습니다. 안내 내용과 차트 수치는 첨부 자료에서 가져왔으며 별도의 의학적 검증이나 수정은 하지 않았습니다.

안내 페이지 수정 후 `python3 emr/tools/build_guides.py`, 메인 화면 수정 후 `python3 emr/tools/build.py`를 실행하세요. 배포 시 `emr/index.html`과 `emr/guides/` 폴더를 함께 올려야 합니다. 안내 기능에는 Code.gs 재배포가 필요하지 않습니다. 외부 폰트와 진료 과정 페이지의 기존 Tailwind·아이콘 리소스는 인터넷 연결이 필요합니다.
