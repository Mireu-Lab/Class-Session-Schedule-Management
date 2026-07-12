Write-Host "==================================================" -ForegroundColor Blue
Write-Host "  Firebase 자동 배포 및 환경 구축 통합 파이프라인  " -ForegroundColor Blue
Write-Host "==================================================" -ForegroundColor Blue

Write-Host "`n[1/6] 호스트 개발 환경 검증 및 Node.js 최신 버전 체크..." -ForegroundColor Yellow

$EnvReady = $true
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js 환경이 검색되지 않았습니다. (요구 사양: v22 이상 또는 v24 대)" -ForegroundColor Red
    $EnvReady = $false
} else {
    $NodeVersion = node -v
    $NodeMajor = [int]($NodeVersion.SubString(1).Split('.')[0])
    
    if ($NodeMajor -lt 22) {
        Write-Host "❌ 지원되지 않는 하위 Node.js 버전입니다: $NodeVersion" -ForegroundColor Red
        Write-Host "⚠ 프로젝트 내부 라이브러리 사양을 충족하기 위해 반드시 Node.js v22 이상 환경이 필요합니다." -ForegroundColor Red
        $EnvReady = $false
    } else {
        Write-Host "✔ Node.js 상위 환경 검증 성공: $NodeVersion (Major: $NodeMajor)" -ForegroundColor Green
    }
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm 패키지 매니저가 검색되지 않았습니다." -ForegroundColor Red
    $EnvReady = $false
} else {
    Write-Host "✔ npm 설치 확인됨: v$(npm -v)" -ForegroundColor Green
}

if ($EnvReady -eq $false) {
    Write-Host "`n--------------------------------------------------" -ForegroundColor Yellow
    Write-Host "💡 Node.js 환경 업데이트를 위해 아래 가이드를 수행하세요:" -ForegroundColor Yellow
    Write-Host "--------------------------------------------------"
    Write-Host "👉 Windows 전용 v24 고정 다운로드 명령 (관리자 권한 실행 권장):" -ForegroundColor Blue
    Write-Host "   winget install OpenJS.NodeJS -v 24.18.0"
    Write-Host "--------------------------------------------------" -ForegroundColor Yellow
    Write-Host "Node.js 최신 시리즈 설치 및 터미널 재시작 후 스크립트를 재구동하십시오." -ForegroundColor Red
    Exit
}

$HelperCode = @"
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
                console.log(`[\${idx + 1}] \${p.displayName || p.projectId} (\${p.projectId})`);
            });
            console.log(`[\${projects.length + 1}] 🔄 다른 계정으로 로그인하여 다시 찾기`);

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

        console.log(`\n[4/6] 선택된 프로젝트(\${selectedProject}) 내부의 웹 자산(Web App) 식별자 검사...`);
        let appsRaw = execSync(`npx --package=firebase-tools firebase apps:list web --project \${selectedProject} --json`, { encoding: 'utf8' });
        let appsData = JSON.parse(appsRaw);
        let apps = appsData.result || appsData;

        if (!apps || apps.length === 0) {
            console.log('⚠ 웹 에셋 식별자가 확인되지 않아 class-session-app 인스턴스를 원격지에 동적 생성합니다...');
            execSync(`npx --package=firebase-tools firebase apps:create web class-session-app --project \${selectedProject}`, { stdio: 'inherit' });
            appsRaw = execSync(`npx --package=firebase-tools firebase apps:list web --project \${selectedProject} --json`, { encoding: 'utf8' });
            appsData = JSON.parse(appsRaw);
            apps = appsData.result || appsData;
        }

        const targetAppId = apps[0].appId;
        const appConfigRaw = execSync(`npx --package=firebase-tools firebase apps:sdkconfig web \${targetAppId} --project \${selectedProject} --json`, { encoding: 'utf8' });
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

        fs.writeFileSync('.env', `VITE_SYSTEM_ADMIN_EMAIL=\${adminEmail}\n`, 'utf8');
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
        execSync(`npx --package=firebase-tools firebase deploy --project \${selectedProject}`, { stdio: 'inherit' });

        console.log('\n🚀 Node.js 고호환 환경 빌드 및 파이어베이스 무인 배포 작업이 최종 성공했습니다!');
    } catch (err) {
        console.error('\n❌ 파이프라인 구동 중 치명적 예외 발생:', err.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

main();
"@

$HelperCode | Out-File -FilePath "temp-deploy-helper.cjs" -Encoding utf8
node temp-deploy-helper.cjs
if (Test-Path "temp-deploy-helper.cjs") { Remove-Item "temp-deploy-helper.cjs" -Force }