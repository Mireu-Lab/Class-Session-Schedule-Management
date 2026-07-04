# Scheduling App - Golang Backend Microservice (Release v2)

이 디렉토리는 일정 조율 및 설문 관리 애플리케이션의 **릴리즈 버전 백엔드 소스코드**입니다.  
효율적인 자원 관리와 고성능 트래픽 제어를 위해 **Golang (Go 1.21+)** 및 고성능 웹 프레임워크인 **Gin**으로 개발되었으며, Firebase 생태계와의 완벽한 통합을 갖추고 있습니다.

---

## 🏛 아키텍처 및 핵심 명세 정보

구현 명세서에 명시된 릴리즈 요구사항에 대응하기 위해 다음과 같은 클라우드 통합 구성을 제공합니다:

1. **FireBase SQLConnect / Firestore (일정 정보 데이터베이스)**
   - 세션 정보, 카테고리 정보, 게스트 설문지 마스킹 데이터를 통합 저장합니다.
   - 2차 컨펌 피드백 반영: **세션 삭제 시 데이터가 소실되지 않고 데이터베이스 상에 Soft-Delete (Archive) 형태로 영구 아카이빙**되도록 구현하여 복구 가능성을 제공하며 클라이언트 목록에서는 투명하게 숨겨집니다.

2. **FireBase Authentication (시스템 계정 통합 도구)**
   - Go 백엔드 서버에서 `Authorization: Bearer <ID_TOKEN>` 헤더를 파싱하고 Firebase Admin SDK를 사용해 토큰 서명을 검증합니다.
   - 사용자 식별자(UID) 및 이메일 주소를 안전하게 컨텍스트에 바인딩하여 권한이 부여된 사용자만 API 리소스에 접근할 수 있도록 보안 미들웨어(`AuthMiddleware`)를 제공합니다.

3. **FireBase Cloud Functions (백엔드 배포)**
   - Google Cloud Functions / Firebase Cloud Functions (Gen 2 HTTP triggers) 규격과 100% 호환되는 진입점 핸들러인 `FirebaseCloudFunctionEntrypoint`를 제공합니다.
   - 단일 배포 아티팩트로 통합 REST API 전체 서비스를 유연하게 클라우드 런타임에 올릴 수 있어 콜드 스타트 최적화 및 유지보수 비용을 획기적으로 낮춥니다.

---

## 📂 디렉토리 구조 (Workspace Layout)

```bash
/backend
├── go.mod          # 의존성 라이브러리 및 Go 모듈 정보
├── main.go         # 메인 진입점, 라우터 정의 및 Cloud Functions 래퍼
├── db.go           # Firebase App 및 Firestore 클라이언트 커넥터
├── auth.go         # Firebase Auth ID 토큰 검증 미들웨어
├── models.go       # Frontend Types(types.ts)와 매핑되는 Go 구조체 (JSON/Firestore 태그 지원)
├── handlers.go     # 세션(생성/조회/업데이트/보관), 카테고리 및 게스트 설문 제출 처리 로직
└── README.md       # 백엔드 가이드 및 배포 안내서 (본 파일)
```

---

## 🚀 로컬 개발 및 실행 방법

### 1. 환경 변수 설정 (.env)
백엔드 구동 시 아래 환경 변수가 활용됩니다.

```bash
# Google Cloud Project ID
export GOOGLE_CLOUD_PROJECT="your-firebase-project-id"

# 로컬에서 실행할 때 사용할 Firebase 서비스 계정 키 파일 경로 (선택 사항)
export FIREBASE_SERVICE_ACCOUNT_JSON="/path/to/your/service-account.json"

# 백엔드 바인딩 포트 (기본값: 3000)
export PORT=3000
```

### 2. 의존성 다운로드 및 실행
`/backend` 폴더 내에서 터미널을 열고 다음 명령어를 실행합니다.

```bash
# 의존성 모듈 설치
go mod tidy

# 백엔드 서비스 실행
go run .
```

---

## 📡 REST API 엔드포인트 규격

모든 프라이빗 API는 `Authorization: Bearer <Firebase_ID_Token>` 인증 헤더가 요구됩니다.

| Method | Endpoint | Description | Auth 여부 | 비고 |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/api/health` | 서버 헬스 체크 | Public | 서버 상태 확인용 |
| **GET** | `/api/sessions` | 소유한 모든 세션 리스트 조회 | Private | 본인이 Admin/Viewer인 세션만 필터링 |
| **GET** | `/api/sessions/:id` | 특정 세션 상세 정보 조회 | Private | Soft-delete 상태인 경우 404 반환 |
| **POST** | `/api/sessions` | 신규 세션 개설 | Private | AdminEmail에 생성자 이메일 자동 할당 |
| **PUT** | `/api/sessions/:id` | 기존 세션 내용 수정 | Private | Admin 권한 체크 및 트랜잭션 안전성 보장 |
| **DELETE**| `/api/sessions/:id` | 세션 삭제 (Soft-delete & Archive) | Private | **피드백 반영: DB 보관(Archive), 클라 숨김** |
| **POST** | `/api/sessions/:id/guests` | 게스트 조율 가능 시간 제출 | Private | 중복 제출 방지 및 수정 권한 수립 적용 |
| **GET** | `/api/categories` | 전체 카테고리 목록 조회 | Private | 캘린더 커스텀 컬러 정보 로드 |

---

## ☁️ Firebase Cloud Functions 배포 가이드

본 Golang 코드는 **Firebase Cloud Functions (2세대)**의 HTTP 트리거 형태로 손쉽게 컴파일 및 서빙이 가능합니다.

### Firebase CLI를 사용한 배포
프로젝트 루트 경로에 `firebase.json`이 있고, `functions` 폴더에 Go 프로젝트가 링크되어 있다고 가정할 때 다음과 같이 CLI 명령어로 백엔드를 원클릭 배포할 수 있습니다:

```bash
# HTTP Cloud Function 배포 명령어 예시
gcloud functions deploy scheduling-backend \
  --gen2 \
  --runtime=go121 \
  --entry-point=FirebaseCloudFunctionEntrypoint \
  --trigger-http \
  --allow-unauthenticated \
  --region=asia-northeast3
```
