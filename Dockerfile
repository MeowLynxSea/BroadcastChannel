FROM node:lts-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml ./

# FROM base AS prod-deps
# RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM build-deps AS build
COPY . .

ARG SENTRY_DSN
ARG SENTRY_AUTH_TOKEN
ARG SENTRY_PROJECT

# 设置 Docker 标志
ENV DOCKER=true

# 安装构建依赖（SQLite 需要编译工具）
RUN apk add --no-cache python3 make g++

RUN pnpm run build

FROM base AS runtime
# 安装运行时依赖
RUN apk add --no-cache sqlite

COPY --from=build /app/dist ./dist
COPY .env.example .env

ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

# 加载环境变量并启动应用
CMD sh -c "source .env && node ./dist/server/entry.mjs"
