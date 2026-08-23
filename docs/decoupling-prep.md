# sub2api 前后端耦合审计 — prep/decouple-frontend

> 审计时间: 2026-08-23 / commit d45135d / fork Xeron2000/sub2api

## 1. 耦合清单（精确位置）

### 后端耦合前端（必须切除的 4 处）

| # | 文件 | 耦合点 | 解耦动作 |
|---|------|--------|----------|
| B1 | `backend/internal/web/embed_on.go:37` | `//go:embed all:dist` 把 `frontend/dist` 打进 Go 二进制 | 删除 `backend/internal/web/` 整个目录或仅保留 `embed_off.go` 的 404 stub；Go 不再依赖前端产物 |
| B2 | `backend/internal/server/router.go:74-88` | `web.HasEmbeddedFrontend()` + `frontendServer.Middleware()` 抢占所有非 `/api`、`/v1`、`/setup` 路由，注入 `window.__APP_CONFIG__` | 删除该分支，前端改为主动 `GET /api/v1/settings/public` |
| B3 | `backend/cmd/server/main.go:106-108` | `runSetupServer()` 同样 `web.ServeEmbeddedFrontend()` | 同上，setup 阶段也只暴露 API |
| B4 | `Dockerfile:12-45` | Stage1 `frontend-builder` + `COPY --from=frontend-builder /app/backend/internal/web/dist` | 删除 Stage1，最终镜像只 `go build -tags embed` 去掉，改为纯 Go 镜像；前端独立镜像/静态托管 |

### 前端耦合后端（必须改的 3 处）

| # | 文件 | 耦合点 | 解耦动作 |
|---|------|--------|----------|
| F1 | `frontend/vite.config.ts:98-112` | `build.outDir = '../backend/internal/web/dist'` 写到后端仓库里 | 改为 `dist`（本地），与后端零路径依赖 |
| F2 | `frontend/vite.config.ts:45-85` | `injectPublicSettings(backendUrl)` 开发期抓取 `__APP_CONFIG__` 注入 + `injectBranding` | 保留逻辑但改为运行时 `fetch /api/v1/settings/public`，不再依赖构建期 SSRed HTML |
| F3 | `frontend/src/api/url.ts:1` | `VITE_API_BASE_URL` 默认 `/api/v1` 同源，跨域部署需显式配置 | 保持现状（已支持绝对 URL），仅文档化：独立部署时 `VITE_API_BASE_URL=https://api.example.com/api/v1` + 后端 `CORS.allowed_origins` |

### 间接耦合

- `Makefile:14-18` `build: build-backend build-frontend` 强顺序；解耦后改为独立 `make -C backend build` / `pnpm --dir frontend build`
- `backend/go.mod` 无前端依赖，干净
- 无 OpenAPI/Swagger 生成，后端路由即文档源，`backend/internal/server/routes/*.go` 是重构契约依据
- `frontend/src/api/client.ts:22` `baseURL: getAPIBaseURL()` + `withCredentials: true` 已天然支持跨域 cookie，配合 CORS 即可

## 2. 解耦后部署模型

```
后端:  Go 二进制 / Docker (port 8080)  — 仅 /api/v1, /v1, /setup, /health, /metrics
前端:  独立 Vite 静态站 (Nginx/Vercel/Cloudflare Pages)  —  通过 VITE_API_BASE_URL 指向后端域名
CORS:  后端 config.yaml  cors.allowed_origins = [前端域名] + allow_credentials=true
鉴权:  保持 Bearer token (localStorage) + Cookie，无需改动
```

## 3. 最小变更方案（ponytail 原则：删为主）

1. **后端**删 3 文件 + 改 3 文件：
   - 删 `backend/internal/web/embed_on.go` + `embed_test.go` + `html_cache.go` / `static_cache.go`（或仅留 `embed_off.go` 逻辑）
   - 改 `backend/internal/server/router.go` 删除 15 行 embed 分支
   - 改 `backend/cmd/server/main.go` 删除 setup 阶段 embed 分支
   - 改 `Dockerfile` 删除 Stage1 (约 20 行)，`go build` 去掉 `-tags embed`

2. **前端**改 1 文件：
   - `frontend/vite.config.ts` `outDir: 'dist'` + 移除 `COPY docs/legal` 的特殊处理（已内联或改为 API）

3. **配置**不新增代码：
   - 后端已有 `CORSConfig`，前端已有 `VITE_API_BASE_URL`，零新依赖

## 4. 风险

- `window.__APP_CONFIG__` 注水（CSP nonce + settings 注入）将失效，首屏需多一次 `/settings/public` 请求 — 可接受，或前端加 5s 缓存
- `docs/legal/*.md?raw` 在 `frontend` 构建期被 Vite 拉取（Dockerfile 注释提到），独立构建时需 `COPY docs/legal` 或改为从后端 `/api/v1/compliance` 拉取
- 2 处测试强依赖 embed：`backend/internal/web/embed_test.go`、`routes/gateway_key_billing_test.go:92` 需同步删/改

## 5. 下一步（等 goal 触发）

- goal 拆分建议：`[1] 后端去 embed` `[2] 前端独立构建` `[3] 全新前端重写（路由/API 契约不变）`
- 全新前端技术栈待你定：Vue3 保留 / React / Next / 纯 Vite + 新设计系统

## 6. 本地验证清单

```bash
# 后端纯 API 仍可启动
cd backend && go build -o /tmp/sub2api ./cmd/server && /tmp/sub2api --version

# 前端独立构建
cd frontend && pnpm install && VITE_API_BASE_URL=http://localhost:8080/api/v1 pnpm build
ls frontend/dist/index.html

# 前后端分离联调
VITE_DEV_PROXY_TARGET=http://localhost:8080 pnpm --dir frontend dev
curl http://localhost:8080/api/v1/settings/public
curl http://localhost:8080/health
```
