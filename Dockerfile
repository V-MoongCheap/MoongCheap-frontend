# syntax=docker/dockerfile:1

# MoongCheap 프론트엔드 컨테이너 이미지.
#
# Next 16 문서(`next.config.js` `output`)의 standalone 방식이다. `next build`가 `.next/standalone`에
# 실행에 필요한 파일만 모아 주므로 런타임 단계에서 `npm install`을 하지 않는다. `public`과
# `.next/static`은 standalone에 자동으로 들어가지 않아 손으로 복사한다. 실행 진입점은 `next start`가
# 아니라 `server.js`이고, 포트와 바인딩 주소는 `PORT`·`HOSTNAME` 환경변수로 받는다.
#
# ⚠️ `NEXT_PUBLIC_API_BASE_URL`은 런타임 값이 아니다. `NEXT_PUBLIC_` 접두사가 붙은 값은 빌드할 때
#    코드에 그대로 박히므로, 실행 인자가 아니라 빌드 인자로 받는다. 환경마다 주소가 다르면
#    이미지를 따로 빌드해야 한다.
#
# 빌드와 실행
#   docker build --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 -t moongcheap-frontend .
#   docker run --rm -p 3000:3000 moongcheap-frontend
#
# 클러스터(EKS)용으로 밀 때는 노드 아키텍처를 맞춘다. 개발 기기가 arm64(Apple Silicon)라 그냥 빌드하면
# arm64 이미지가 나온다.
#   docker build --platform linux/amd64 ...
#
# Node 20은 `.nvmrc`·CI와 같은 버전이다(Next 16.3.4 요구 사항은 >=20.9.0).

# 1) 의존성 설치. 락파일 기준으로 재현 가능하게 받는다.
FROM node:20-alpine AS deps
WORKDIR /app
# sharp 등 네이티브 모듈이 glibc를 찾는 경우가 있어 알파인에 호환 계층을 깔아 둔다.
RUN apk add --no-cache libc6-compat
# husky는 `prepare` 스크립트로 도는데 이미지 안에는 .git이 없다. 0으로 끄지 않으면 설치가 멈춘다.
ENV HUSKY=0
COPY package.json package-lock.json ./
RUN npm ci

# 2) 빌드. devDependencies(typescript·tailwind 등)가 필요해 위 단계의 node_modules를 그대로 쓴다.
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV HUSKY=0 NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_BASE_URL=""
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
RUN npm run build

# 3) 실행. standalone 산출물만 담아 이미지를 작게 유지한다.
FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
# root로 돌리지 않는다. 베이스 이미지의 기존 uid(1000 node)와 겹치지 않게 1001을 쓴다.
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
