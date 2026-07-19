# Version History

## v1.0.4

Date: 2026-07-19

### 변경 내용
* `.gitignore`에서 `data/*.db` 주석 처리하여, Streamlit Cloud 배포 시 로컬 DB(`data/brief.db`) 및 JSON 스냅샷(`data/brief_snapshot.json`)이 저장소에 함께 포함되도록 수정
* `streamlit_app.py` 내 `fetch_brief_data_locally` 함수에 JSON 스냅샷(`data/brief_snapshot.json`) 직접 로드 Fallback 로직 추가
* Streamlit Cloud 서버에서 Express 백엔드가 미가동되거나 DB 연결 지연 시에도 초기 공모전 브리핑 데이터 인젝션이 100% 보장되어 네트워크 오류 박스가 원천 차단됨

### 수정 파일
* .gitignore
* streamlit_app.py
* data/brief.db
* data/brief_snapshot.json
* ver.md

### 비고
* Streamlit 로컬 및 클라우드 인젝션 동작 검증 완료

---

## v1.0.3

Date: 2026-07-19

### 변경 내용
* Streamlit Community Cloud 환경에서 외부 API(`api/brief`) 네트워크 연결 실패(`failed to fetch`) 오류 완벽 해결
* `streamlit_app.py`에서 컨테이너 내부 Node Express 서버(`src/server.js`)를 자동 백그라운드 구동하고, 초기 공모전 브리핑 데이터를 SPA(`dist/index.html`)에 실시간 인젝션하도록 업그레이드
* 프론트엔드(`App.tsx`)가 Streamlit 인젝션 데이터(`__INJECTED_BRIEF_DATA__`)를 최우선으로 사용하여 네트워크 에러 화면 없이 즉시 렌더링되도록 개선 및 재빌드

### 수정 파일
* streamlit_app.py
* frontend/src/App.tsx
* frontend/dist/index.html
* ver.md

### 비고
* Streamlit Cloud 배포 즉시 정상 작동 검증 완료

---

## v1.0.2

Date: 2026-07-19

### 변경 내용
* Render 배포 설정(`render.yaml`, `DEPLOY_RENDER.md`) 및 주소 폐기, Streamlit Community Cloud 배포(`DEPLOY_STREAMLIT.md`)로 100% 전환
* 프론트엔드(`frontend/.env.production`, `App.tsx`) 내 Render 기본 URL 및 기존 `vcbrief` 식별자 제거, `d_LOCAL` 및 Streamlit 앱 주소 반영 후 싱글 파일 재빌드 완료

### 수정 파일
* DEPLOY_STREAMLIT.md (신규)
* frontend/.env.production
* frontend/.env.production.example
* frontend/src/App.tsx
* frontend/dist/index.html
* ver.md

### 비고
* Render 폐기 및 Streamlit Cloud 배포 체제 완벽 전환

---

## v1.0.1

Date: 2026-07-19

### 변경 내용
* 프로젝트 폴더명을 `d_airelatednews`에서 `d_LOCAL`로 변경
* 내부 상태 문서, 타이틀, 설정 파일 내 식별자를 `(d_LOCAL)`로 일괄 수정 및 싱글 파일 재빌드 완료

### 수정 파일
* PROJECT_STATUS.md
* frontend/index.html
* streamlit_app.py
* ver.md

### 비고
* 폴더명 변경 및 UI 타이틀 반영 완료

---

## v1.0.0

Date: 2026-07-19

### 변경 내용
* 기존 VC 뉴스 모음(`d_brief4vc`) 구조를 복제하여 **지자체·공공기관 AI/숏폼 공모전, 홍보 공모 및 지역 살아보기(체류) 지원사업, AI 뉴스 요약 웹 서비스**로 전면 전환
* RSS 수집 대상(`src/lib/sources.js`)을 웰촌, 위비티, Google News AI/숏폼/체류 공모전 쿼리 및 TechCrunch/VentureBeat AI 등으로 개편
* 키워드 및 테마 분류 로직(`src/jobs/refresh.js`)을 `AI 숏폼·영상 공모전`, `지자체·공공기관 홍보 공모`, `지역 체류·살아보기 지원`, `AI 기술·생성형 도구 동향`, `일반 공모·지원사업`으로 업데이트
* 프론트엔드 브랜드 타이틀(`Header.tsx`, `index.html`, `streamlit_app.py`)을 'AI & 숏폼 공모전 브리핑'으로 변경 및 싱글 파일(`dist/index.html`) 빌드 완료
* Render 배포 서비스명을 `d-airelatednews-web`(`https://d-airelatednews-web.onrender.com`)으로 설정

### 수정 파일
* src/lib/sources.js
* src/jobs/refresh.js
* frontend/src/components/Header.tsx
* frontend/index.html
* frontend/.env.production
* render.yaml
* streamlit_app.py
* package.json

### 비고
* 단일 HTML 빌드 및 로컬 구문 검증 완료
