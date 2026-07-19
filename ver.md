# Version History

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
