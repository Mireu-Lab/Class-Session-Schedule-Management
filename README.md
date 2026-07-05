# 세션 일정 통합 시스템 (Session Scheduler Integration System)

본 프로젝트는 수기 일정 조율의 비효율성을 극복하고 일정을 한눈에 관리하며, 다양한 가상 SNS 계정 연동 및 일정 선호 조사를 통합하여 조율할 수 있는 **Svelte 5 + Vite 기반의 고성능 싱글 페이지 애플리케이션(SPA)**입니다.

---

## 🛠️ 기술 스택 및 버전 정보

- **프레임워크**: Svelte 5
- **빌드 도구**: Vite (v5.1.5)
- **주요 언어**: TypeScript (v5.2.2)
- **스타일링**: Tailwind CSS (v4.0.0-beta)
- **아이콘 라이브러리**: Lucide Svelte
- **애니메이션**: Motion (v12.4.0)
- **PDF 내보내기**: jspdf & html2canvas

---

## 🚀 주요 기능

1. **대시보드 관리**: 개설된 조율 일정 세션을 카테고리별로 정렬하고 통계 및 상태를 한눈에 모니터링합니다.
2. **반응형 캘린더**: 구글 캘린더 스타일의 월간 달력을 통해 날짜별 세션을 빠르게 조회하고, 모바일 및 태블릿 환경에서의 스와이프 제스처를 완벽하게 지원합니다.
3. **일정 내보내기**: 활성화된 월간 달력 화면을 PDF 파일로 원클릭 저장 및 다운로드할 수 있습니다.
4. **유연한 설문 참여**: 초대를 받은 구성원이 본인의 SNS 인증 정보(구글, 네이버, 카카오, 인스타그램)를 모방하여 간편하게 선호 일정을 제출할 수 있습니다.
5. **터치 제스처 지원**:
   - 검은색 알림(Toast) 팝업: 상/하/좌/우 어느 방향이든 드래그 및 스와이프 시 즉시 사라지는 빠른 제거 기능 적용.
   - 캘린더 뷰: 좌우 스와이프 제스처로 이전/다음 달로 직관적으로 이동 가능.

---

## 💻 로컬 개발 환경 실행 방법

### 1. 패키지 설치
```bash
npm install
```

### 2. 로컬 개발 서버 구동
```bash
npm run dev
```
- 브라우저에서 `http://localhost:3000`에 접속하여 실시간 확인 가능합니다. (HMR 지원)

### 3. 소스 코드 빌드 및 정적 파일 생성
```bash
npm run build
```
- 빌드가 완료되면 프로젝트 루트의 `dist/` 폴더에 정적 HTML/CSS/JS 번들 파일들이 생성됩니다.

---

## 🐳 Docker를 이용한 컨테이너 배포 및 실행

프로덕션 환경으로 배포하기 위해 Multi-stage 빌드가 적용된 가볍고 최적화된 Docker 설정을 제공합니다.

### 1. Docker 이미지 빌드
```bash
docker build -t session-scheduler:latest .
```

### 2. Docker 컨테이너 실행
```bash
docker run -d -p 3000:3000 --name scheduler-app session-scheduler:latest
```
- 실행 후 브라우저에서 `http://localhost:3000`으로 접속하여 최적화된 프로덕션 빌드를 바로 서빙받을 수 있습니다.

---

## ☁️ 클라우드 플랫폼 배포 가이드

### Option A. 정적 호스팅 서비스 (Netlify, Vercel, Cloudflare Pages 등)
본 애플리케이션은 순수 클라이언트 사이드 SPA이므로, 서버 사이드 구성 없이 고성능 정적 웹 호스팅 환경에 적은 비용으로 즉시 배포 가능합니다.
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **SPA Fallback 설정**: 모든 요청을 `index.html`로 리다이렉트 처리해야 새로고침 시 404 에러가 나지 않습니다.

### Option B. 컨테이너 기반 서버리스 서비스 (Google Cloud Run, AWS Fargate 등)
제공된 `Dockerfile`을 사용하면 Google Cloud Run 등의 환경에 매우 빠르고 현대적으로 배포할 수 있습니다.
1. 구글 클라우드에 로그인 및 이미지 업로드:
   ```bash
   gcloud builds submit --tag gcr.io/[PROJECT_ID]/session-scheduler
   ```
2. Cloud Run 서비스 배포:
   ```bash
   gcloud run deploy session-scheduler \
     --image gcr.io/[PROJECT_ID]/session-scheduler \
     --platform managed \
     --port 3000 \
     --allow-unauthenticated
   ```

---

## 🔥 Firebase CLI 연동 가이드

본 프로젝트는 Firebase Firestore 및 Authentication을 사용합니다. 로컬 개발 환경에서 Firebase CLI를 통해 직접 데이터베이스 룰을 배포하거나 호스팅에 배포할 수 있습니다.

### 1. Firebase CLI 설치 및 로그인
```bash
npm install -g firebase-tools
firebase login
```

### 2. Firebase 프로젝트 초기화 및 연결
프로젝트의 루트 디렉토리에서 다음 명령어를 실행하여 기존 Firebase 프로젝트와 연결합니다.
```bash
firebase use --add
```
또는 `firebase init` 명령어를 통해 Firestore와 Hosting을 선택하고 설정을 진행할 수 있습니다. (이미 `firebase.json`이 존재하므로 덮어쓰지 않도록 주의하세요.)

### 3. Firestore 보안 규칙(Rules) 수동 배포
로컬에서 수정한 `firestore.rules` 파일을 클라우드에 배포합니다.
```bash
firebase deploy --only firestore:rules
```

### 4. Firebase Hosting에 정적 앱 배포
정적 호스팅 서비스를 Firebase Hosting으로 일원화하고 싶을 경우 다음을 실행합니다.
```bash
npm run build
firebase deploy --only hosting
```
