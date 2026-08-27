# Frontend Cutover — Production Transition

> Date: 2026-08-27 | From: Vue `frontend/` (Vite + `vue-tsc`) | To: React `frontend-new/` (TanStack Start SPA `dist/client/_shell.html` → Go embed `backend/internal/web/dist`)
> Status: **React is production source of truth**; `frontend/` retained as rollback reference (§15, §77). No `ENABLE_NEW_FRONTEND` flag (§78).

## 1. Architecture

### Before
```
Browser → Go Binary (embed Vue dist) → Vue SPA (history mode, index.html)
         → /api → Go handlers
         → unknown → index.html (Vue shell)
Build: pnpm --dir frontend build → backend/internal/web/dist (via Vite outDir)
Docker: COPY frontend/package.json → pnpm install → COPY frontend/ → pnpm build
Release: working-directory: frontend, cache: frontend/pnpm-lock.yaml
Go: //go:embed all:dist + Middleware fileExists → serveIndexHTML or static
```

### After
```
Browser → Go Binary (embed React SPA) → React SPA (_shell.html / index.html)
         → /api /v1 /health /setup /v1beta /backend-api /antigravity /models /responses /images /videos → Go API (bypass)
         → /assets/*-{8}.js → immutable cache (1 year)
         → unknown frontend route (e.g. /dashboard F5) → _shell.html (index.html) with nonce-injected __APP_CONFIG__
Build: pnpm --dir frontend-new build → frontend-new/dist/client/_shell.html + assets
       cp _shell.html → index.html → backend/internal/web/dist
Go: //go:embed all:dist + same Middleware + fileExists + shouldBypassEmbeddedFrontend
     + nonce-aware serveIndexHTML + ETag/no-cache + fingerprint asset cache
Docker: COPY frontend-new/package.json + pnpm-lock.yaml + pnpm-workspace.yaml → pnpm install → COPY frontend-new/ → pnpm build && cp _shell.html index.html → COPY --from=frontend-builder /app/frontend-new/dist/client → backend/internal/web/dist
Release: working-directory: frontend-new, cache: frontend-new/pnpm-lock.yaml, Prepare embed dist step
No Node runtime in production: `Go binary` is sufficient (§5)
```

## 2. Build Commands

```bash
# Local reproduction (clean)
pnpm install --frozen-lockfile --dir frontend-new
pnpm --dir frontend-new build
# SPA output
ls frontend-new/dist/client/  # _shell.html, index.html (copied), assets/, favicon.ico, manifest.json
rm -rf backend/internal/web/dist && mkdir -p backend/internal/web/dist
cp -r frontend-new/dist/client/* backend/internal/web/dist/
cp backend/internal/web/dist/_shell.html backend/internal/web/dist/index.html
# Go embed
go build -tags embed -o /tmp/sub2api ./backend/cmd/server
/tmp/sub2api --version  # verify Version/Commit/Date

# Docker (real)
docker build -t sub2api:cutover-test .
docker run --rm -p 8080:8080 sub2api:cutover-test
# Then Playwright against http://localhost:8080

# Release (CI)
# handled by .github/workflows/release.yml build-frontend → Prepare embed dist → upload frontend-dist artifact
```

## 3. Artifact Paths

| Stage | Path | Content |
|-------|------|---------|
| `frontend-new/dist/client` | `_shell.html`, `index.html` (after cp), `assets/*`, `favicon.ico`, `manifest.json`, `robots.txt` | Vite + TanStack Start SPA |
| `frontend-new/dist/server` | `server.js`, `assets/*` | SSR server (NOT embedded, not shipped) |
| `backend/internal/web/dist` | same as `dist/client` after copy | Go `//go:embed all:dist` target |
| `Go binary` | `/app/sub2api` | embeds `dist` via `embed.FS` + `FrontendServer` |
| `Docker image` | `ghcr.io/.../sub2api:tag` + `/app/resources` | binary + resources + healthcheck |

`pnpm-workspace.yaml` is now part of lockfile source-of-truth (§17): `package.json` + `pnpm-lock.yaml` + `pnpm-workspace.yaml` + Node 20 + pnpm 9 must match locally and CI; `pnpm install --frozen-lockfile` fails on mismatch.

## 4. Go Embed SPA Shell Rewrite (§8)

```go
func (s *FrontendServer) Middleware() gin.HandlerFunc {
  if shouldBypassEmbeddedFrontend(path) { c.Next(); return } // /api /v1 /health /setup etc → Go API
  cleanPath := strings.TrimPrefix(path, "/")
  if cleanPath == "" { cleanPath = "index.html" }
  if cleanPath == "index.html" || !s.fileExists(cleanPath) {
    s.serveIndexHTML(c) // unknown frontend route → SPA shell (injected)
    return
  }
  // static asset → fileServer + immutable cache if fingerprinted
}
```

`shouldBypassEmbeddedFrontend` covers: `/api/`, `/v1/`, `/v1beta/`, `/backend-api/`, `/antigravity/`, `/setup/`, `/health`, `/models`, `/responses`, `/images/`, `/videos/`.

`isFingerprintedEmbeddedAssetPath` → `assets/name-{8}.js` → `Cache-Control: public, max-age=31536000, immutable` (via `applyStaticAssetCacheHeaders`). `index.html`/`_shell.html` → `Cache-Control: no-cache` + `ETag`.

## 5. Dev Proxy Is Not Production (§67)

- Vite dev `server.proxy: /api,/v1,/setup → http://localhost:18786` — dev only.
- Production uses same-origin: `apiClient.baseURL = "/api/v1"` (relative) → same Go origin, no proxy.

## 6. Smoke Checks (must pass before and after cutover)

```bash
# 1. Direct route F5 must 200 (not 404)
curl -i http://localhost:8080/dashboard
curl -i http://localhost:8080/keys
curl -i http://localhost:8080/profile
curl -i http://localhost:8080/admin/users
curl -i http://localhost:8080/admin/settings
curl -i http://localhost:8080/model-plaza
curl -i http://localhost:8080/custom/test123
curl -i http://localhost:8080/payment/result
curl -i http://localhost:8080/auth/linuxdo/callback

# 2. API must never fall through to SPA
curl -i http://localhost:8080/api/not-exists      # expect 404 JSON, not 200 text/html
curl -i http://localhost:8080/v1/not-exists       # same
curl -i http://localhost:8080/health              # 200 JSON/text, not html
# Check content-type: API 404 must NOT be text/html
curl -s -D - http://localhost:8080/api/not-exists -o /tmp/body | head -5

# 3. Static assets hashed
curl -i http://localhost:8080/assets/index-*.js   # pick hashed file from dist → immutable header
curl -i http://localhost:8080/assets/styles-*.css
# Check: Cache-Control: public, max-age=31536000, immutable

# 4. Shell headers
curl -i http://localhost:8080/ | grep -i "cache-control: no-cache"
curl -i http://localhost:8080/ | grep -i etag

# 5. Production artifact verification (§71)
# After `go build -tags embed`, page source must contain React shell, not Vue
curl -s http://localhost:8080/ | grep -q "Sub2API" && echo "React shell OK"
curl -s http://localhost:8080/assets/index- # must exist

# 6. Docker
docker build -t sub2api:test .
docker run -d -p 18080:8080 --name sub2api-cutover-test sub2api:test
curl -i http://localhost:18080/health
curl -i http://localhost:18080/login
docker rm -f sub2api-cutover-test

# 7. Upgrade/Restart (§74)
# old HTML + new JS mixed via hashed assets → no blank page; chunk error recovery is via hashed immutable assets + atomic embed (no reload loop needed per §73 analysis)
```

## 7. Cutover Gate (§79) — must be green before changing Docker/Release

- [ ] `pnpm --dir frontend-new lint` green
- [ ] `pnpm --dir frontend-new typecheck` green
- [ ] `pnpm --dir frontend-new test` green
- [ ] `pnpm --dir frontend-new build` green + `go build -tags embed` OK
- [ ] `pnpm --dir frontend-new test:e2e` green (106 tests)
- [ ] Visual baseline green (§30-32)
- [ ] Security P0 green (XSS, redirect, postMessage, payment, admin, bundle leak)
- [ ] Parity green (`docs/frontend-final-parity.md`)

Only when all green → change production pipeline (`frontend` → `frontend-new`).

## 8. Post-Cutover Re-run (§81)

After switching Dockerfile/release.yml:
```bash
pnpm --dir frontend-new lint
pnpm --dir frontend-new typecheck
pnpm --dir frontend-new test
pnpm --dir frontend-new build
pnpm --dir frontend-new test:e2e  # includes production-artifact + Docker E2E modes
```

## 9. Rollback (§76-77)

Rollback is **one explicit revert**, not a runtime flag:

```bash
# Revert production frontend source: React → legacy Vue
git revert <cutover-commit>   # or
# manually:
# 1. Dockerfile: WORKDIR /app/frontend-new → /app/frontend, COPY frontend-new → COPY frontend, restore COPY docs/legal, restore COPY --from=frontend-builder /app/backend/internal/web/dist
# 2. .github/workflows/release.yml: frontend-new → frontend, remove Prepare embed dist step (Vue outDir handles it)
# 3. Makefile: build-frontend → pnpm --dir frontend
# 4. backend/internal/web/dist: not committed, just rebuild
# 5. No need to delete frontend-new directory

# Then rebuild and deploy previous tag:
git tag -d vX.Y.Z && git push origin :refs/tags/vX.Y.Z  # if needed, or just deploy previous GHCR image
# ghcr.io/owner/sub2api:previousVersion still available
```

`frontend/` is retained as code-level rollback reference; no `ENABLE_NEW_FRONTEND=true/false` dual path (§78). After at least one real release smoke, cleanup per §88 can be done (separate small goal).

## 10. No Dual Frontend (§78)

Cutover is atomic: `React = production`. Vue is not served at runtime. No env flag to toggle.

## 11. Verify Binary Serves New Frontend (§71)

- After `go build -tags embed`, `curl -s http://localhost:8080/ | grep -q "_shell"` or check for Vite hashed script `assets/index-*.js`.
- `go run` with `HasEmbeddedFrontend()` must be true.
- `strings.ToLower(body)` contains `<!doctype html>` from React shell (not Vue's `<div id="app">` scaffold).
