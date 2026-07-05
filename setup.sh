#!/bin/bash

# --- 색상 정의 ---
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0;m' # No Color

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}   세션 일정 통합 시스템 자동 설치 및 시작 스크립트   ${NC}"
echo -e "${BLUE}==================================================${NC}"

# --- 1. Node.js 및 npm 설치 확인 ---
echo -e "\n${YELLOW}[1/4] 개발 환경 확인 중...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js가 설치되어 있지 않습니다.${NC}"
    echo -e "비전공자 분들은 브라우저를 열고 다음 링크에서 설치해 주세요:"
    echo -e "${BLUE}👉 https://nodejs.org/ (LTS 버전을 다운로드하여 설치)${NC}"
    echo -e "설치를 마친 후 이 창을 닫고 스크립트를 다시 실행해 주세요."
    exit 1
else
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✔ Node.js 확인됨: $NODE_VERSION${NC}"
    echo -e "${GREEN}✔ npm 확인됨: $NPM_VERSION${NC}"
fi

# --- 2. 의존성 패키지 설치 ---
echo -e "\n${YELLOW}[2/4] 프로그램 구동에 필요한 파일 패키지 설치 중...${NC}"
echo -e "※ 최초 실행 시 수 분이 소요될 수 있습니다. 잠시만 기다려 주세요."

npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✔ 필요한 모든 패키지 설치 완료!${NC}"
else
    echo -e "${RED}❌ 패키지 설치 중 오류가 발생했습니다. 네트워크 연결을 확인하세요.${NC}"
    exit 1
fi

# --- 3. 환경 변수 파일 검사 및 기본값 생성 ---
echo -e "\n${YELLOW}[3/4] 환경 설정 파일 검사 중...${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✔ 기본 .env 설정 파일을 복사했습니다.${NC}"
        echo -e "${YELLOW}💡 안내: Firebase 및 AI 연동이 필요한 경우 .env 파일을 메모장으로 열어 키를 채워 넣으세요.${NC}"
    else
        touch .env
        echo -e "${YELLOW}⚠ .env.example 파일이 없어 빈 .env 파일을 생성했습니다.${NC}"
    fi
else
    echo -e "${GREEN}✔ .env 설정 파일이 이미 존재합니다.${NC}"
fi

# --- 4. 프로그램 구동 ---
echo -e "\n${YELLOW}[4/4] 프로그램을 실행하고 브라우저를 엽니다...${NC}"
echo -e "${BLUE}--------------------------------------------------${NC}"
echo -e "${GREEN}🚀 실행 성공! 아래 주소를 주소창에 입력하여 접속하세요.${NC}"
echo -e "${BLUE}👉 인터넷 주소: http://localhost:3000${NC}"
echo -e "${BLUE}--------------------------------------------------${NC}"
echo -e "※ 프로그램을 종료하려면 이 창에서 ${RED}Ctrl + C${NC}를 누르세요.\n"

# 로컬 서버 실행 명령 수행
npm run dev