# 1단계: 빌드 환경 (Node.js)
FROM node:20-alpine AS build

WORKDIR /app

# 의존성 정의 파일 복사 및 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사 및 프로덕션 빌드 진행
COPY . .
RUN npm run build

# 2단계: 실행 환경 (Nginx)
FROM nginx:alpine

# Nginx의 기본 정적 파일 서빙 디렉토리로 빌드 결과물 복사
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx 포트를 3000으로 구성 (사용 환경에 맞게 변경 가능)
RUN sed -i 's/listen       80;/listen       3000;/g' /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
