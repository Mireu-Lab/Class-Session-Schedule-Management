# 🚀 일정 조율 및 통합 관리 시스템 배포 가이드 (Deployment Guide)

본 문서는 **Golang v1.16.4** 백엔드와 **Node.js v24.18.0 (React/Vite)** 프론트엔드로 이루어진 본 일정 조율 시스템을 최적의 환경으로 분리 배포하는 상세 설명서입니다. 

---

## 📋 시스템 빌드 환경 사양 (Specification)
*   **Backend Runtime**: `Golang v1.16.4`
*   **Frontend Runtime**: `Node.js v24.18.0`
*   **Database**: `Google Cloud Firestore` (NoSQL)
*   **Authentication**: `Firebase Authentication`
*   **Deployment Options**: Docker Containers, Google Cloud Run, Firebase App Hosting

---

## 🛠️ 1단계: Firebase 프로젝트 준비 및 환경설정

본 서비스는 분산 클라우드 환경에서 Firebase 서비스군(Auth, Firestore)을 실시간 API로 연동합니다.

### 1. Firebase Authentication 및 Firestore 활성화
1. [Firebase Console](https://console.firebase.google.com/)에 접속하여 신규 프로젝트를 생성합니다.
2. **Build** > **Authentication** 메뉴로 이동하여 **이메일/비밀번호(Email/Password)** 로그인 제공업체를 활성화합니다.
3. **Build** > **Firestore Database** 메뉴로 이동하여 데이터베이스를 생성합니다 (운영 모드 또는 테스트 모드 설정).

### 2. 서비스 계정(Service Account) 키 발급
백엔드 고랭 서버가 Firestore 및 Firebase Auth 자격 증명을 안전하게 통신하기 위해 관리자 권한 키가 필요합니다.
1. Firebase 프로젝트 설정(톱니바퀴) > **서비스 계정(Service Accounts)** 탭으로 이동합니다.
2. **새 비공개 키 생성(Generate New Private Key)**을 클릭하여 JSON 키 파일을 다운로드합니다.
3. 다운로드한 파일명을 `service-account.json`으로 변경한 후, **백엔드 배포 경로** 또는 **컨테이너 환경 변수**에 주입합니다.

---

## 🐹 2단계: Golang v1.16.4 백엔드 배포 가이드

백엔드는 가볍고 응답 속도가 빠른 Go 1.16.4 기반의 RESTful API 서버입니다.

### 방법 A. Docker & Google Cloud Run 배포 (가장 권장됨)
Google Cloud Run은 오토스케일링과 서버리스 요금제를 지원하여 컨테이너화된 Go 앱을 실행하기에 가장 적합한 플랫폼입니다.

#### 1. Dockerfile 빌드 및 업로드 (Container Registry)
로컬 터미널에서 백엔드 디렉토리(`/backend`)로 이동하여 컨테이너를 빌드하고 Google Container Registry(GCR) 혹은 Artifact Registry에 푸시합니다.
```bash
# 백엔드 디렉토리로 이동
cd backend

# 프로젝트 ID 정의
export PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"

# Docker 이미지 빌드 (Go v1.16.4 적용)
docker build --platform linux/amd64 -t gcr.io/$PROJECT_ID/scheduling-backend:v1 .

# Google Container Registry로 푸시
docker push gcr.io/$PROJECT_ID/scheduling-backend:v1
```

#### 2. Cloud Run 배포 명령 수행
컨테이너를 배포할 때, 서비스 계정 JSON 파일 경로와 환경 변수를 다음과 같이 입력해 배포합니다.
```bash
gcloud run deploy scheduling-backend-service \
  --image gcr.io/$PROJECT_ID/scheduling-backend:v1 \
  --platform managed \
  --region asia-northeast3 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars="FIREBASE_PROJECT_ID=$PROJECT_ID,GIN_MODE=release"
```

---

## ⚛️ 3단계: Node.js v24.18.0 프론트엔드 배포 가이드

프론트엔드는 Node.js v24.18.0 빌드 런타임에서 최적의 번들(Vite)로 정적 컴파일되어 Nginx를 통해 강력한 캐싱 속도로 서빙됩니다.

### 방법 A. Firebase App Hosting / Firebase Hosting 배포
Vite 빌드 아티팩트(`dist/`)를 전 세계 CDN 망에 무중단 배포하는 가장 간편한 방식입니다.

#### 1. Firebase CLI 설치 및 로그인
로컬 머신에 Node.js 24.18.0이 설치되어 있어야 하며, 최신 Firebase Tools를 설치합니다.
```bash
# Firebase CLI 글로벌 설치
npm install -g firebase-tools

# Firebase 로그인 연동
firebase login
```

#### 2. 프론트엔드 빌드 및 배포 구성
```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# Node.js v24.18.0 의존성 설치 및 프로덕션 빌드
npm install
npm run build
```
빌드가 완료되면 `/frontend/dist` 디렉토리에 최적화된 정적 자산(CSS, JS, HTML)이 저장됩니다.

#### 3. Firebase 배포 파일 (`firebase.json`) 예시 생성
프론트엔드 루트에 `firebase.json` 파일을 생성하여 라우팅 리다이렉션을 설정합니다.
```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "/api/**",
        "destination": "https://scheduling-backend-service-xxxxxx.a.run.app/api/**"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```
*   **주의**: `/api/**` 경로로 인입되는 비동기 호출 요청은 전 단계에서 생성한 **Cloud Run 백엔드 주소**로 리버스 프록시되도록 매핑합니다.

#### 4. 배포 명령어 실행
```bash
# Firebase Hosting 배포 실시
firebase deploy --only hosting
```

---

## 🐳 방법 B. Docker Compose 통합 오케스트레이션 배포
만약 고유 가상 머신(AWS EC2, GCP Compute Engine, NCP 등)에 한 번에 원클릭으로 통합 배포하고자 할 경우, 루트 경로에 정의된 `docker-compose.yml`을 사용하여 구동합니다.

```bash
# 1. 원격 서버에 소스코드 클론 및 프로젝트 루트로 이동
cd scheduling-app-root

# 2. 통합 도커 이미지 빌드 및 분산형 다중 네트워크 기동 (백그라운드 실행)
docker-compose up --build -d
```

### 아키텍처 흐름 설명:
1.  **Nginx (프론트엔드 컨테이너, Node v24.18.0 빌드)**: 사용자가 `http://SERVER_IP:3000`으로 접속하면 번들링된 정적 리액트 파일을 즉시 서빙합니다.
2.  **API 프록시**: 사용자가 로그인하거나 시간대 조율을 제출하여 `/api/` 요청을 발송하면, Nginx 설정 파일(`nginx.conf`)이 내부 Docker 가상 네트워크 상에 가용 중인 **Go Backend 컨테이너(`scheduling_backend:3000`)**로 요청을 우회해 안전하게 응답을 받아옵니다.

---

## 🔒 4단계: 보안 및 운영 관리 팁

1.  **CORS 화이트리스트 지정**: 백엔드의 `main.go` 내 CORS 구성에 실 서비스 도메인(예: `https://your-app.web.app`)을 명시하여 교차 출처 리소스 공유 권한을 통제하십시오.
2.  **보안 규칙(Security Rules)**: Firestore Console 내에서 관리자가 아닌 일반 익명 사용자가 원치 않는 컬렉션 경로를 직접 변경하지 못하도록 데이터 쓰기 권한 스키마 유효성 규칙을 구성하십시오.
