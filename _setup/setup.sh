#!/bin/bash

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0;m'

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}  Firebase 자동 배포 및 환경 구축 통합 파이프라인  ${NC}"
echo -e "${BLUE}==================================================${NC}"

echo -e "\n${YELLOW}[1/6] 호스트 개발 환경 검증 및 Node.js 최신 버전 체크...${NC}"

OS_TYPE="$(uname -s)"
ENV_READY=true

# Node.js 구성 여부 및 버전 세부 파싱 검증 (v22 혹은 v24 이상 요구 사양 충족 검사)
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 환경이 검색되지 않았습니다. (요구 사양: v22 이상 또는 v24 대)${NC}"
    ENV_READY=false
else
    NODE_VERSION=$(node -v)
    NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v//' | cut -d. -f1)
    
    # v22 미만(예: v20)일 경우 최신 패키지 엔진 규격 미달로 간주하여 차단
    if [ "$NODE_MAJOR" -lt 22 ]; then
        echo -e "${RED}❌ 지원되지 않는 하위 Node.js 버전입니다: $NODE_VERSION${NC}"
        echo -e "${RED}⚠ 프로젝트 내부 라이브러리 사양을 충족하기 위해 반드시 Node.js v22 이상 환경이 필요합니다.${NC}"
        ENV_READY=false
    else
        echo -e "${GREEN}✔ Node.js 상위 환경 검증 성공: $NODE_VERSION (Major: $NODE_MAJOR)${NC}"
    fi
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm 패키지 매니저가 검색되지 않았습니다.${NC}"
    ENV_READY=false
else
    echo -e "${GREEN}✔ npm 설치 확인됨: v$(npm -v)${NC}"
fi

# 버전 또는 요구 규격 미달 시 운영체제 맞춤형 Node.js v24 다운로드 가이드라인 안내
if [ "$ENV_READY" = false ]; then
    echo -e "\n${YELLOW}--------------------------------------------------${NC}"
    echo -e "${YELLOW}💡 Node.js 환경 업데이트를 위해 아래 가이드를 수행하세요:${NC}"
    echo -e "--------------------------------------------------"
    if [[ "$OS_TYPE" == "Linux" ]]; then
        echo -e "👉 ${BLUE}Linux (NodeSource 저장소를 통한 v24 고정 설치):${NC}"
        echo -e "   curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -"
        echo -e "   sudo apt-get install -y nodejs"
    elif [[ "$OS_TYPE" == "Darwin" ]]; then
        echo -e "👉 ${BLUE}macOS (Homebrew 전용 버전 제어 스냅샷 설치):${NC}"
        echo -e "   brew install node@24"
        echo -e "   brew link --overwrite node@24"
    else
        echo -e "👉 ${BLUE}Windows (nvm-windows 또는 직접 패키지 설치 권장):${NC}"
        echo -e "   winget install OpenJS.NodeJS -v 24.18.0"
    fi
    echo -e "${YELLOW}--------------------------------------------------${NC}"
    echo -e "${RED}Node.js 최신 시리즈 설치 및 터미널 재시작 후 스크립트를 재구동하십시오.${NC}"
    exit 1
fi

exec </dev/tty

# 2. 메타데이터 수집용 임시 Node.js 스크립트 작성 (.cjs 확장자로 ES Module 제약 우회)
cat << 'EOF' > temp-deploy-helper.cjs
const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

async function main() {
    try {
        console.log('\n[2/6] Firebase CLI 원격 구동 환경 확인 및 사용자 로그인...');
        execSync('npx --package=firebase-tools firebase login', { stdio: 'inherit' });

        let selectedProject = null;
        
        while (!selectedProject) {
            console.log('\n[3/6] 연동 계정의 클라우드 프로젝트 리스트를 동적 수집 중...');
            let projects = [];
            try {
                const projectsRaw = execSync('npx --package=firebase-tools firebase projects:list --json', { encoding: 'utf8' });
                const projectsData = JSON.parse(projectsRaw);
                projects = projectsData.result || projectsData || [];
            } catch (e) {
                projects = [];
            }

            if (!projects || projects.length === 0) {
                console.log('\n❌ 계정에 연동된 Firebase 프로젝트가 존재하지 않거나 조회가 거부되었습니다.');
                console.log('1️⃣ 다른 구글 계정으로 다시 로그인하여 찾기');
                console.log('2️⃣ 콘솔에 프로젝트 생성 후 리스트 새로고침');
                console.log('3️⃣ 배포 프로세스 종료');
                
                const fallbackAnswer = await question('\n수행할 작업 번호를 선택하세요: ');
                if (fallbackAnswer.trim() === '1') {
                    console.log('\n기존 세션을 로그아웃하고 새로 로그인을 시도합니다...');
                    try { execSync('npx --package=firebase-tools firebase logout', { stdio: 'inherit' }); } catch(e){}
                    execSync('npx --package=firebase-tools firebase login', { stdio: 'inherit' });
                    continue; 
                } else if (fallbackAnswer.trim() === '2') {
                    console.log('\n리스트를 다시 불러옵니다...');
                    continue; 
                } else {
                    console.error('❌ 배포 단계를 취소합니다.');
                    process.exit(1);
                }
            }

            console.log('\n배포 가능한 파이어베이스 프로젝트 목록:');
            projects.forEach((p, idx) => {
                console.log(`[${idx + 1}] ${p.displayName || p.projectId} (${p.projectId})`);
            });
            console.log(`[${projects.length + 1}] 🔄 다른 계정으로 로그인하여 다시 찾기`);

            const answer = await question('\n배포를 진행할 대상 프로젝트 번호를 입력하세요: ');
            const chosenIdx = parseInt(answer, 10) - 1;

            if (chosenIdx === projects.length) {
                console.log('\n기존 세션을 로그아웃하고 새로 로그인을 시도합니다...');
                try { execSync('npx --package=firebase-tools firebase logout', { stdio: 'inherit' }); } catch(e){}
                execSync('npx --package=firebase-tools firebase login', { stdio: 'inherit' });
                continue;
            }

            if (chosenIdx >= 0 && chosenIdx < projects.length) {
                selectedProject = projects[chosenIdx].projectId;
            } else {
                console.log('⚠ 잘못된 번호입니다. 올바른 프로젝트 번호를 지정하십시오.');
            }
        }

        console.log(`\n[4/6] 선택된 프로젝트(${selectedProject}) 내부의 웹 자산(Web App) 식별자 검사...`);
        let appsRaw = execSync(`npx --package=firebase-tools firebase apps:list web --project ${selectedProject} --json`, { encoding: 'utf8' });
        let appsData = JSON.parse(appsRaw);
        let apps = appsData.result || appsData;

        if (!apps || apps.length === 0) {
            console.log('⚠ 웹 에셋 식별자가 확인되지 않아 class-session-app 인스턴스를 원격지에 동적 생성합니다...');
            execSync(`npx --package=firebase-tools firebase apps:create web class-session-app --project ${selectedProject}`, { stdio: 'inherit' });
            appsRaw = execSync(`npx --package=firebase-tools firebase apps:list web --project ${selectedProject} --json`, { encoding: 'utf8' });
            appsData = JSON.parse(appsRaw);
            apps = appsData.result || appsData;
        }

        const targetAppId = apps[0].appId;
        const appConfigRaw = execSync(`npx --package=firebase-tools firebase apps:sdkconfig web ${targetAppId} --project ${selectedProject} --json`, { encoding: 'utf8' });
        const appConfigData = JSON.parse(appConfigRaw);
        const config = appConfigData.result ? appConfigData.result.sdkConfig : (appConfigData.sdkConfig || appConfigData);

        const firebaseAppletConfig = {
            projectId: config.projectId,
            appId: config.appId,
            apiKey: config.apiKey,
            authDomain: config.authDomain,
            firestoreDatabaseId: "(default)",
            storageBucket: config.storageBucket,
            messagingSenderId: config.messagingSenderId,
            measurementId: config.measurementId || ""
        };

        fs.writeFileSync('firebase-applet-config.json', JSON.stringify(firebaseAppletConfig, null, 2), 'utf8');
        console.log('✔ 설정 파일 동적 자동 바인딩 완료 (firebase-applet-config.json)');

        const adminEmail = await question('\n• 시스템 관리자 이메일 주소(VITE_SYSTEM_ADMIN_EMAIL)를 입력하세요: ');
        if (!adminEmail) {
            console.error('❌ 필수 비즈니스 로직 환경 변수가 누락되어 배포 단계를 조기 종료합니다.');
            process.exit(1);
        }

        fs.writeFileSync('.env', `VITE_SYSTEM_ADMIN_EMAIL=${adminEmail}\n`, 'utf8');
        console.log('✔ 환경 변수 파일 빌드 완료 (.env)');

        console.log('\n[5/6] 패키지 충돌 제어 옵션을 적용하여 로컬 종속성 구성 및 컴파일 시작...');
        execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
        execSync('npm run build', { stdio: 'inherit' });
        
        // 🚀 파이어베이스 CLI 파일 누락 예외 우회 생성 장치
        if (!fs.existsSync('firestore.indexes.json')) {
            console.log('⚠ firestore.indexes.json 파일이 누락되어 빈 기본 규칙을 선제적으로 생성합니다...');
            fs.writeFileSync('firestore.indexes.json', JSON.stringify({ indexes: [], fieldOverrides: [] }, null, 2), 'utf8');
        }

        console.log('\n[6/6] 정적 컴파일 자산을 파이어베이스 글로벌 CDN 서버로 배포 중...');
        execSync(`npx --package=firebase-tools firebase deploy --project ${selectedProject}`, { stdio: 'inherit' });

        console.log('\n🚀 Node.js 고호환 환경 빌드 및 파이어베이스 무인 배포 작업이 최종 성공했습니다!');
    } catch (err) {
        console.error('\n❌ 파이프라인 구동 중 치명적 예외 발생:', err.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

main();
EOF

node temp-deploy-helper.cjs
rm -f temp-deploy-helper.cjs