# 📅 세션 일정 통합 시스템 (Session Scheduler Integration System) v2.2

Svelte 5와 Firebase 클라우드 에코시스템을 기반으로 구축된 강력한 **실시간 멀티 인원 일정 조율 및 세션 관리 플랫폼**입니다. 팀 합주, 세미나, 면접, 회의 등 다수의 참여자로부터 일정 설문을 수집하고, 중첩된 일정을 시각적으로 분석하여 최적의 타임 슬롯을 도출하는 복잡한 중간 관리자의 업무 프로세스를 완전히 자동화합니다.

---

## ✨ 핵심 기능 (Features)

### 🔐 1. 인증 및 다중 권한 매핑
* **OAuth 소셜 로그인 연동**: Firebase Auth 기반의 Google 로그인 인터랙션을 내장하고 있으며, Naver, Kakao, Instagram 소셜 계정 연동 확장을 지원합니다.
* **이메일 기반 권한 제어**: 세션 생성 시 지정된 이메일 주소 권한 매핑 조건에 따라 관리자(수정/확정 가능) 및 보기 전용(Viewer) 권한을 세분화하여 상속 및 안전하게 관리합니다.

### 🛠️ 2. 유연한 세션 일정 개설 및 라이프사이클 관리
* **가변형 일정 설정**: 최소 1일에서 최대 4주(1개월) 범위 내에서 특정 시작일과 종료일을 캘린더 인터페이스로 자유롭게 지정할 수 있습니다.
* **커스텀 타임 슬롯**: 모임 특성에 맞게 시간 격차를 30분, 60분, 120분 단위로 세분화하여 설정할 수 있습니다.
* **참여 제약 조건 설정**: 
  * **비지정 모드**: 링크를 보유한 게스트 누구나 참여 가능
  * **지정 모드**: 사전에 등록된 특정 명단의 게스트만 접근하여 제출 가능
* **안전한 삭제 메커니즘**:
  * **Soft Delete (보관)**: 대시보드에서는 숨기되 아카이브 필터링으로 복구 가능한 보관함 기능
  * **Deep Delete (영구 삭제)**: 데이터베이스에서 물리적으로 완벽히 영구 제거

### 📊 3. 실시간 응답 분석 및 의사결정 지원 (대시보드)
* **응답 모니터링 실시간 파이프라인**: 전체 대상자 대비 응답 완료자 및 미응답자 리스트를 실시간으로 추적합니다.
* **참석 밀집도 Heatmap**: 다중 게스트가 제출한 일정 스케줄의 중첩 데이터를 정밀 연산하여 밀집도가 높은 순으로 **최적의 타임 슬롯 TOP 3**를 자동 리스트업합니다.
* **통합 캘린더 뷰**: 읽기 권한이 부여된 카테고리 및 세션별 일정을 구글 캘린더 스타일의 일별/월별 인터페이스로 한눈에 확인할 수 있습니다.

### 📱 4. 혁신적인 모바일/PC 게스트 설문 인터랙션
* **0.2초 Hold & Press 세로 드래그 (핵심 솔루션)**: 시간 셀을 0.2초간 롱프레스(Hold)하면 선택 모드가 활성화되며, 아래로 스와이프하여 동일 날짜 내 연속된 시간대를 한 번에 빠르게 드래그 입력할 수 있습니다. (드래그 시 햅틱 진동 피드백 탑재)
* **보안 및 무결성 검증**: 소셜 로그인 인증 후 반드시 본명을 입력해야만 제출이 가능하며, 기기 및 계정 정보를 기반으로 한 중복 제출 방지 로직과 응답 마감 시한 제어 정책을 제공합니다.

### 📥 5. 다용도 전처리 데이터 엑스포트 (File Export)
* **분석용 가공 데이터 지원**: `CSV`, `XLSX` 포맷 내보내기 및 `Google Sheets` 직접 연동 파이프라인을 구축하여 외부 데이터 전처리가 가능합니다.
* **기간별 가변 레이아웃 Export**: `PDF` 및 `PNG/JPG` 추출 시 기간에 따라 최적화된 포맷(1주 미만은 이미지 캘린더, 1주 이상은 전체 밀집도 타임라인 차트 형태)으로 스마트 레이아웃을 변형하여 저장합니다.

---

## 🛠️ 기술 스택 (Tech Stack)

### Client Side
* **Framework**: Svelte 5 (Runes 상태 관리 엔진 탑재)
* **Build Tool & Bundler**: Vite 6, TypeScript 5.8
* **Styling**: Tailwind CSS v4, Lucide Svelte (아이콘 팩), Motion (애니메이션)
* **Export Engine**: html2canvas, html-to-image, jspdf, jspdf-autotable

### Backend & Cloud Infrastructure
* **Database & Auth**: Firebase v12 (Firestore Cloud DB, Firebase Authentication)
* **Server-side Server**: Express v4 (Node.js 22+ / 24 환경 최적화)
* **Automated Print**: Puppeteer (백엔드 헤드리스 브라우저 기반 고해상도 가변 레이아웃 PDF 렌더러)

---

## 📂 프로젝트 구조 (Directory Structure)

```text
Class-Session-Schedule-Management-Dev/
├── _setup/                 # 자동 구축 및 인프라 배포 자동화 스크립트 (sh/ps1)
├── server/                 # Puppeteer 기반 가변 레이아웃 백엔드 서버 로직
│   └── pdfExport.ts        # 백엔드 단 순수 HTML 캘린더 파싱 및 PDF 내보내기 엔진
├── src/
│   ├── components/         # Svelte 5 기반 컴포넌트 슬롯 아키텍처
│   │   ├── Dashboard.svelte# 관리자 통합 관제 대시보드
│   │   ├── Detail.svelte   # 실시간 Heatmap 및 TOP 3 추천 슬롯 분석 페이지
│   │   ├── Survey.svelte   # 게스트 용 0.2초 롱프레스 드래그 인터랙션 설문지
│   │   └── CalendarPage.svelte # 구글 캘린더 기반 필터링 뷰어
│   ├── lib/
│   │   ├── db.ts           # Firestore CRUD 및 실시간 오프라인 동기화 로직
│   │   └── firebase.ts     # Firebase 클라우드 초기화 모듈
│   ├── utils/
│   │   ├── date.ts         # 가변 주차 레이아웃 분할 및 날짜 연산 유틸
│   │   └── export.ts       # CSV / XLSX / PDF / PNG 클라이언트 단 내보내기
│   ├── App.svelte          # 글로벌 네비게이션 뷰 라우터 및 상태 제어 타워
│   └── types.ts            # 정적 타이핑 명세 (Session, Category, Guest 구조체)
├── firebase.json           # Cloud Firestore 보안 규칙 및 인덱스 명세
├── firestore.rules         # 계정 별 데이터 격리를 위한 글로벌 보안 룰셋
└── vite.config.ts          # Vite 번들링 가속화 환경 설정

```

---

## 🚀 시작하기 (Installation & Setup)

본 프로젝트는 복잡한 Firebase Cloud의 호스팅 및 인프라 구성을 한 번에 실행할 수 있는 **자동화 배포 파이프라인**을 내장하고 있습니다.

### 요구 사양

* **Node.js**: v22 또는 v24 이상 권장

### 환경 변수 구성 (`.env`)

루트 디렉토리에 `.env` 파일을 생성하고 아래 양식에 맞추어 관리자 계정을 설정하십시오.

```env
VITE_SYSTEM_ADMIN_EMAIL=example@gmail.com

```

### 1. 배포 및 환경 자동 구축 프로세스 가동

OS 환경에 맞는 스크립트를 터미널에서 실행하면 의존성 해결(`npm i`), Firebase CLI 원격 구동 및 로그인 연동, 프로젝트 선택 및 리소스 프로비저닝이 완전 자동화로 진행됩니다.

* **Windows (PowerShell)**:
```powershell
Invoke-RestMethod -Uri "https://raw.githubusercontent.com/mireu-lab/class-session-schedule-management/setup.ps1" | Invoke-Expression
```

* **Linux / macOS (Bash)**:
```bash
curl -sSL https://raw.githubusercontent.com/mireu-lab/class-session-schedule-management/setup.sh | bash
```


### 2. 로컬 개발 서버 실행

자동 구축이 완료된 후, 로컬 환경에서 개발을 진행하려면 아래 명령어를 사용합니다.

```bash
npm run dev

```

---

### 💡 문서 작성 포인트 참고 사항:
1. **역할 정의**: 명세서에 나와 있던 책임 개발 엔지니어(임미르님)와 개인 사용자이자 클라이언트(하동현님) 간의 조율 사항을 바탕으로 비즈니스 로직을 완벽히 포괄했습니다.
2. **기술 스택 구체화**: 업로드된 `package.json` 및 `package-lock.json`을 분석하여 Svelte 5, Tailwind 4, Node 22+ 대응 인프라 스크립트(`setup.sh`, `setup.ps1`), 그리고 엑스포트 기능(`Puppeteer`, `jspdf`, `html2canvas`)의 유기적 관계를 명확히 기술했습니다.
3. **핵심 혁신 기술 강조**: 명세서 내 핵심 솔루션인 **"0.2초 Hold & Press 세로 드래그 UX 인터랙션"** 및 **"Heatmap 기반 TOP 3 타임 슬롯 도출 알고리즘"**을 기능 리스트 최상단에 강조 배치하여 오픈소스 경쟁력을 높였습니다.
