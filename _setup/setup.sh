#!/bin/bash

# 콘솔 텍스트 색상 스키마 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0;m'

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}  Firebase 프로덕션 통합 배포 인프라 구성 시스템  ${NC}"
echo -e "${BLUE}     [Target: Hosting, Firestore, Auth]           ${NC}"
echo -e "${BLUE}==================================================${NC}"

# curl 원격 파이프 구동 시 사용자의 키보드 입력을 정상적으로 판독하기 위해
# 표준 입력을 터미널 입력 장치로 강제 연결합니다.
exec </dev/tty

echo -e "\n${YELLOW}[1/3] 서비스 연동용 콘솔 파라미터 직접 등록${NC}"
echo -e "보안 유지를 위해 임의의 기본값을 제공하지 않으므로 정확히 입력해 주세요."

read -p "• Firebase Project ID: " PROJECT_ID
read -p "• Firebase App ID: " APP_ID
read -p "• Firebase API Key: " API_KEY
read -p "• Firebase Auth Domain: " AUTH_DOMAIN
read -p "• Firestore Database ID: " FIRESTORE_DATABASE_ID
read -p "• Firebase Storage Bucket: " STORAGE_BUCKET
read -p "• Firebase Messaging Sender ID: " MESSAGING_SENDER_ID
read -p "• Firebase Measurement ID (선택 사항, 없으면 엔터): " MEASUREMENT_ID
read -p "• 시스템 관리자 이메일 주소 (VITE_SYSTEM_ADMIN_EMAIL): " VITE_SYSTEM_ADMIN_EMAIL

# 필수 연동 매개변수 누락 여부 엄격 검증
if [ -z "$PROJECT_ID" ] || [ -z "$APP_ID" ] || [ -z "$API_KEY" ] || [ -z "$AUTH_DOMAIN" ] || [ -z "$FIRESTORE_DATABASE_ID" ] || [ -z "$STORAGE_BUCKET" ] || [ -z "$MESSAGING_SENDER_ID" ] || [ -z "$VITE_SYSTEM_ADMIN_EMAIL" ]; then
    echo -e "${RED}❌ 필수 설정 파라미터가 비어 있습니다. 아키텍처 무결성을 위해 배포를 취소합니다.${NC}"
    exit 1
fi

# 2. 독립 구성 파일 빌드 및 동적 디렉터리 동기화
echo -e "\n${YELLOW}[2/3] 사용자 입력 자산 기반 설정 파일 동적 인젝션${NC}"

cat << EOF > firebase-applet-config.json
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
EOF
echo -e "${GREEN}✔ firebase-applet-config.json 파일 동적 생성 완료${NC}"

cat << EOF > .env
VITE_SYSTEM_ADMIN_EMAIL=$VITE_SYSTEM_ADMIN_EMAIL
EOF
echo -e "${GREEN}✔ .env 로컬 빌드 환경 변수 파일 동적 생성 완료${NC}"

# 3. 소스코드 빌드 및 정적 웹 에셋 전송
echo -e "\n${YELLOW}[3/3] 빌드 파이프라인 구동 및 Firebase 호스팅 업로드${NC}"

npm install
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 소스코드 컴파일 도중 에러가 발견되었습니다. 배포 단계를 거부합니다.${NC}"
    exit 1
fi

echo -e "${BLUE}Firebase CLI 인증 자격을 조회하고 배포 인프라로 전송을 시작합니다...${NC}"
npx firebase login
npx firebase deploy --project "$PROJECT_ID"

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}🚀 원격 원라인 스크립트를 통한 통합 배포가 완벽하게 완료되었습니다!${NC}"
else
    echo -e "\n${RED}❌ Firebase 엔드포인트 전송 중 예외가 발생했습니다. 파이어베이스 보안 정책을 확인하세요.${NC}"
    exit 1
fi