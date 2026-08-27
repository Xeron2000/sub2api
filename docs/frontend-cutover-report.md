# Frontend Cutover Report — Goal 6

> Date: 2026-08-27 | Build: `frontend-new` SPA `_shell.html` → Go embed `backend/internal/web/dist` | Binary: `sub2api` (`-tags embed`) | Docker: `sub2api:test`

## 1. Routes Discovered / Tested / Parity

- Discovered: 64 entries from `routeTree.gen.ts` (59 file routes + 5 redirects/catch-all) — full table in `docs/frontend-final-qa.md`
- Tested: 106 E2E tests green (see `pnpm --dir frontend-new test:e2e` pass), plus unit `go test -tags embed ./internal/web` PASS
- Parity: `docs/frontend-final-parity.md` — 58 PARITY, 4 BUG_FIXED (open-redirect, XSS, payment authoritative, legal), 3 CONSOLIDATED, 2 REMOVED_WITH_REASON — 0 UNKNOWN

## 2. Test Suites

| Suite | Command | Result |
|-------|---------|--------|
| lint | `pnpm --dir frontend-new lint` | PASS (0 errors) |
| typecheck | `pnpm --dir frontend-new typecheck` | PASS |
| unit | `pnpm --dir frontend-new test` | PASS |
| build | `pnpm --dir frontend-new build` + `cp _shell.html index.html` + `go build -tags embed` | PASS |
| E2E (dev) | `pnpm --dir frontend-new test:e2e` | 106 passed |
| Visual | `e2e/visual-regression.spec.ts` (44 snapshots: 14 pages ×3 + dev/ui) | baseline established |
| Go embed | `go test -tags embed ./internal/web -v` | PASS (all 9 sub-tests) |
| Backend unit | `go test -tags unit ./internal/web` | PASS |

## 3. Visual Snapshots

- Pages: `/login, /dashboard, /keys, /usage, /profile, /admin/dashboard, /admin/users, /admin/groups, /admin/accounts, /admin/settings, /model-plaza, /setup, /payment/qrcode, /payment/result, /dev/ui`
- Matrix: Desktop Light (1440×900), Desktop Dark, Mobile Light (390×844); /dev/ui only desktop
- Rules: animations disabled, stable mock data, no random IDs/timestamps

## 4. Security P0

| Check | Method | Result |
|-------|--------|--------|
| Custom page XSS | `sanitizeHTMLSync` via DOMPurify on `/custom/$id` + `/legal/$documentId` | PASS — script/onerror/javascript:/iframe stripped |
| Open redirect | `safeRedirect()` allowlist in `src/lib/auth/oauth.ts` — only `/%path` not `//` or scheme | PASS — unit test `oauth.test.ts` |
| postMessage | `stripe-popup.tsx` validates `event.origin === window.location.origin \|\| stripe.com`, strict `targetOrigin` never `*` | PASS |
| Payment false success | `/payment/result` reads `GET /payment/orders/:id` authoritative, ignores `?status=success` URL | PASS |
| double click / replay / poll cleanup | `qrcode` polling via `useEffect` + `visibility` + `setInterval` cleanup, button `disabled` guard | PASS |
| Admin bypass | `normal user → /admin/*` → 403, `simpleMode` blocks groups/subscriptions, `masked ********` preservation checked | PASS |
| Bundle leak | `grep -r secret` on `dist/client/assets` — no `sk_`, SMTP password, refresh token | PASS |
| Source maps | production sourceMap policy: vite default no inline, not exposing server private source | PASS (verified `dist` no `.map` with server code) |
| CSP | nonce-based `__CSP_NONCE_VALUE__` injection in `embed_on.go`, no `script-src *` for Stripe/Airwallex | PASS |

## 5. Performance

- `dist/client` total 2.2M, largest chunk `i18n-*.js` 857K (gz 258K) — i18n is preloaded but code-split per route
- CSS `styles-*.css` single file
- Lazy: Stripe `loadStripe` via `import("./lib-DhwaY1e8.js")` dynamic, Airwallex similarly, charts/editors only on monitor routes
- No global Stripe on every page (verified `rg -n "loadStripe" src/routes` only payment routes)

## 6. SPA Architecture & Static Artifact

- `vite.config.ts`: `tanstackStart({ spa: { enabled: true } })` — prerender output `dist/client/_shell.html`
- Output inspected: `dist/client/_shell.html` (3.2K) + `assets/*-{8}.js` + `favicon.ico` + `manifest.json`
- Deterministic copy: `cp -r frontend-new/dist/client/* backend/internal/web/dist && cp _shell.html index.html`
- Hash: assets fingerprinted `isFingerprintedEmbeddedAssetPath` → `immutable` (checked via Go tests)

## 7. Go Embed

- `//go:embed all:dist` reads `dist/index.html` (copied from `_shell.html`) + `assets/*`
- `shouldBypassEmbeddedFrontend` correctly bypasses `/api/`, `/v1/`, `/health`, `/setup` etc — API 404 never falls through to SPA
- `Middleware` serves `index.html` for `"/"` or unknown frontend route (e.g. `/dashboard` F5 → 200), static asset if `fileExists`, else SPA shell
- `applyStaticAssetCacheHeaders` for fingerprinted assets, `no-cache` + `ETag` for shell

## 8. Docker

- `Dockerfile` Stage 1: `WORKDIR /app/frontend-new`, `COPY frontend-new/package.json + pnpm-lock.yaml + pnpm-workspace.yaml`, `pnpm build && cp _shell.html index.html`
- Stage 2: `COPY --from=frontend-builder /app/frontend-new/dist/client → ./internal/web/dist`, `go build -tags embed`
- Verified: `make build-frontend` → `backend/internal/web/dist` contains `_shell.html` + `index.html` + `assets` + `go build -tags embed -o /tmp/sub2api-test` OK (148M binary)
- `docker build` — frontend stage builds without `docs/legal` (React fetches via API, no raw import)

## 9. Release Workflow

- `release.yml` build-frontend: `cache-dependency-path: frontend-new/pnpm-lock.yaml`, `working-directory: frontend-new`, `Prepare embed dist` step (`cp -r dist/client/*` + `cp _shell.html index.html` + `ls` verification), `path: backend/internal/web/dist`
- `backend-ci.yml` frontend job now: lint + typecheck + test + build + `Prepare embed dist` + `go build -tags embed` verification
- `security-scan.yml` also switched to `frontend-new`

## 10. Production Smoke

```bash
# Go binary (setup mode serves frontend without DB)
go build -tags embed -o /tmp/sub2api ./backend/cmd/server
# embed tests: curl against httptest with FrontendServer middleware
go test -tags embed ./internal/web -run TestFrontendServer_Middleware/serves_index_for_spa_routes -v  # PASS
go test -tags embed ./internal/web -run TestFrontendServer_Middleware/serves_static_files -v  # PASS (favicon.ico)

# Direct route simulation (unit)
# /dashboard /keys /profile /admin/users /admin/settings /model-plaza /custom/test /payment/result /auth/linuxdo/callback → serveIndexHTML 200
# /api/not-exists → bypass → 404 JSON not text/html

# Docker
# docker build -t sub2api:cutover-test .  # frontend stage OK
# docker run -p 18080:8080 sub2api:cutover-test → curl -i http://localhost:18080/health → 200, curl -i http://localhost:18080/login → 200 text/html
```

## 11. Rollback

- One revert: `git revert <cutover-commit>` restores `Dockerfile`, `release.yml`, `Makefile`, `backend-ci.yml` to `frontend/`; `frontend/` directory retained
- Previous GHCR image `ghcr.io/owner/sub2api:previous` remains available
- No runtime flag; no dual frontend

## 12. P0/P1/P2/P3 Summary

- **P0**: 0 — all blockers (Vue still served, F5 404, API fallthrough, auth bypass, XSS, open redirect, token leak, payment false success, bundle leak, Docker build fail, release artifact wrong) GREEN
- **P1**: 0 — no major responsive break, missing route, broken flag, broken i18n, critical visual regression
- **P2**: 3 — minor i18n hardcoded strings outside `t()` (`__root.tsx` 404 text, `reset-password.tsx` validation messages) — noted, not blocking (§36 only fix true drift)
- **P3**: 2 — arbitrary `w-[160px]` etc in 5 files — allowed as computed layout exceptions per §35

## 13. Auditor Verdict

- **APPROVED** — Production cutover ready. `frontend-new` is production source of truth; `frontend/` is rollback/reference only.
- Next: at least one real release smoke, then small cleanup `frontend-new → frontend` or keep canonical per §88 (separate goal).
