Write-Host "==================================================" -ForegroundColor Blue
Write-Host "  Firebase 프로덕션 통합 배포 인프라 구성 시스템  " -ForegroundColor Blue
Write-Host "     [Target: Hosting, Firestore, Auth]           " -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Blue

# 1. 아키텍처 연동에 필요한 모든 가변 파라미터 사용자 동적 수집
Write-Host "`n[1/3] 서비스 연동용 콘솔 파라미터 직접 등록" -ForegroundColor Yellow
Write-Host "보안 유지를 위해 임의의 기본값을 제공하지 않으므로 정확히 입력해 주세요."

$PROJECT_ID = Read-Host "• Firebase Project ID"
$APP_ID = Read-Host "• Firebase App ID"
$API_KEY = Read-Host "• Firebase API Key"
$AUTH_DOMAIN = Read-Host "• Firebase Auth Domain"
$FIRESTORE_DATABASE_ID = Read-Host "• Firestore Database ID"
$STORAGE_BUCKET = Read-Host "• Firebase Storage Bucket"
$MESSAGING_SENDER_ID = Read-Host "• Firebase Messaging Sender ID"
$MEASUREMENT_ID = Read-Host "• Firebase Measurement ID (선택 사항, 없으면 엔터)"
$VITE_SYSTEM_ADMIN_EMAIL = Read-Host "• 시스템 관리자 이메일 주소 (VITE_SYSTEM_ADMIN_EMAIL)"

if ([string]::IsNullOrEmpty($PROJECT_ID) -or [string]::IsNullOrEmpty($APP_ID) -or [string]::IsNullOrEmpty($API_KEY) -or [string]::IsNullOrEmpty($AUTH_DOMAIN) -or [string]::IsNullOrEmpty($FIRESTORE_DATABASE_ID) -or [string]::IsNullOrEmpty($STORAGE_BUCKET) -or [string]::IsNullOrEmpty($MESSAGING_SENDER_ID) -or [string]::IsNullOrEmpty($VITE_SYSTEM_ADMIN_EMAIL)) {
    Write-Host "❌ 필수 설정 파라미터가 비어 있습니다. 아키텍처 무결성을 위해 배포를 취소합니다." -ForegroundColor Red
    Exit
}

# 2. 독립 구성 파일 빌드 및 동적 디렉터리 동기화
Write-Host "`n[2/3] 사용자 입력 자산 기반 설정 파일 동적 인젝션" -ForegroundColor Yellow

$CONFIG_JSON = @"
{
  "projectId": "$PROJECT_ID",
  "appId": "$APP_ID",
  "apiKey": "$API_KEY",
  "authDomain": "$AUTH_DOMAIN",
  "firestoreDatabaseId": "$FIRESTORE_DATABASE_ID",
  "storageBucket": "$STORAGE_BUCKET",
  "messagingSenderId": "$MESSAGING_SENDER_ID",
  "measurementId": "$MEASUREMENT_ID"
}
"@
$CONFIG_JSON | Out-File -FilePath "firebase-applet-config.json" -Encoding utf8
Write-Host "✔ firebase-applet-config.json 파일 동적 생성 완료" -ForegroundColor Green

$ENV_CONTENT = "VITE_SYSTEM_ADMIN_EMAIL=$VITE_SYSTEM_ADMIN_EMAIL"
$ENV_CONTENT | Out-File -FilePath ".env" -Encoding utf8
Write-Host "✔ .env 로컬 빌드 환경 변수 파일 동적 생성 완료" -ForegroundColor Green

# 3. 소스코드 빌드 및 정적 웹 에셋 전송
Write-Host "`n[3/3] 빌드 파이프라인 구동 및 Firebase 호스팅 업로드" -ForegroundColor Yellow

npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 소스코드 컴파일 도중 에러가 발견되었습니다. 배포 단계를 거부합니다." -ForegroundColor Red
    Exit
}

Write-Host "Firebase CLI 인증 자격을 조회하고 배포 인프라로 전송을 시작합니다..." -ForegroundColor Blue
npx firebase login
npx firebase deploy --project "$PROJECT_ID"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n🚀 원격 원라인 스크립트를 통한 통합 배포가 완벽하게 완료되었습니다!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Firebase 엔드포인트 전송 중 예외가 발생했습니다. 파이어베이스 보안 정책을 확인하세요." -ForegroundColor Red
    Exit
}