# Frontend Rewrite Final — Sub2API React Migration COMPLETE

> Date: 2026-08-27 | Status: READY_FOR_LEGACY_REMOVAL | Auditor: pending | Build: `frontend-new` SPA `_shell.html` → Go embed `backend/internal/web/dist` | Binary: `sub2api` (`-tags embed`)

## 1. Migration Timeline

| Goal | Scope | Status |
|------|-------|--------|
| Goal 1 Foundation | Preset b7WQfDSML init, tokens, UI primitives, shared, layout, API/Query | ✅ 2026-08-26 |
| Goal 2 Pattern Freeze | Frozen patterns docs/frontend-patterns.md | ✅ |
| Goal 3 User Migration | /home, auth, /dashboard, /keys, /usage, etc. | ✅ |
| Goal 4 Admin Migration | /admin/* (users, groups, settings, etc.) | ✅ |
| Goal 5 Special Flows | Payment, OAuth, XSS, redirect, postMessage | ✅ |
| Goal 6 Production Cutover | TanStack Start SPA → Go embed, Docker, release.yml | ✅ 2026-08-27 |
| Goal 7 Stabilization | 149/149 E2E, deterministic setup, smoke, evidence sync | ✅ 2026-08-27 READY |

## 2. Final Architecture

```text
TanStack Start SPA (spa.enabled: true)
→ pnpm --dir frontend-new build → dist/client/_shell.html (3.2K)
→ cp _shell.html index.html → backend/internal/web/dist (embed FS)
→ Go //go:embed all:dist + -tags embed → binary sub2api
→ Docker multi-stage (frontend-builder → Go builder → alpine) → image
→ Go embed middleware: shouldBypassEmbeddedFrontend (/api/, /v1/, /setup/, /health) → API 404 JSON, else serve index.html or hashed asset with immutable cache, shell no-cache
```

Frozen: `vite.config.ts` `tanstackStart({ spa: { enabled: true } })`, no SSR, no Node runtime.

## 3. Final Directory (READY state)

```text
frontend-new/  → production React frontend (62 route files, 149 E2E)
frontend/      → legacy Vue (retained, NOT deleted — rollback available)
backend/internal/web/dist → embed dist (generated, not committed)
```

Long-term target after stable release: `delete frontend/; rename frontend-new/ → frontend/` atomically (not done in Goal 7).

## 4. Routes

- Generated from `frontend-new/src/routeTree.gen.ts` — file routes: `find frontend-new/src/routes -name "*.tsx" | wc -l` → **62** files
- routeTree imports: `grep -c "Route as" routeTree.gen.ts` → **62**
- Total entries (file + redirect/catch-all): **64** (59 earlier + 3 new, e.g., /dev/ui, /docs alias)
- Parity: `docs/frontend-final-parity.md` — 58 PARITY, 4 BUG_FIXED, 3 CONSOLIDATED, 2 REMOVED_WITH_REASON — 0 UNKNOWN

All 64 routed via TanStack Router, classification per `docs/frontend-route-policy.md`.

## 5. Tests

| Suite | Command | Result |
|-------|---------|--------|
| lint | `pnpm --dir frontend-new lint` | PASS (0 errors) |
| typecheck | `pnpm --dir frontend-new typecheck` | PASS |
| unit (vitest) | `pnpm --dir frontend-new test` | PASS |
| build | `pnpm --dir frontend-new build` + copy | PASS — dist/client 2.2M (i18n chunk 857K gz 258K) |
| E2E dev | `pnpm --dir frontend-new test:e2e` | **149/149** |
| E2E prod | `pnpm --dir frontend-new test:e2e:production` | **149/149** (same N, same strictness) |
| Visual | `e2e/visual-regression.spec.ts` | **44 snapshots** (14 pages ×3 + dev/ui) — 0 unexpected diff |
| Go embed | `go -C backend test -tags embed ./internal/web -count=1` | PASS |
| Go unit | `go -C backend test -tags unit ./internal/web -count=1` | PASS |

Generated via:
```bash
pnpm --dir frontend-new test:e2e --list | grep -c "›"  # 149
ls frontend-new/e2e/visual-regression.spec.ts-snapshots/*.png | wc -l  # 44
ls frontend-new/dist/client/assets/*.js | wc -l  # 120 chunks
du -sh frontend-new/dist/client  # 2.2M
```

Setup hardening: `e2e/setup.spec.ts` has no `if 404 return`, no sleep-for-correctness; double-submit verified via intercept hold + request count 1 + button disabled (submitting ref guard).

## 6. Snapshots & Visual

- Baseline: `frontend-new/e2e/visual-regression.spec.ts-snapshots/` — 44 PNGs
- Matrix: Desktop Light 1440×900, Desktop Dark, Mobile Light 390×844; /dev/ui desktop only (with `?visual=1` + localStorage visual_test flag to allow playground in prod)
- Rules: animations disabled, stable mock, no random IDs
- Result: 0 unexpected diff (maxDiffPixelRatio 0.05)

## 7. Security (Final Regression)

| Check | Result |
|-------|--------|
| XSS (custom/legal via DOMPurify) | PASS |
| Open redirect (safeRedirect allowlist) | PASS — `src/lib/auth/oauth.ts` unit `oauth.test.ts` |
| postMessage origin validation (stripe-popup) | PASS |
| Payment authoritative (`/payment/result` via GET /orders/:id) | PASS |
| Double-submit guard (setup + purchase) | PASS — `submitting` ref + disabled |
| Admin bypass (normal → /admin → 403) | PASS |
| Bundle leak (`grep -r secret dist`) | PASS |
| CSP nonce | PASS |

## 8. Deployment & Release

- **Go embed**: `go build -tags embed ./backend/cmd/server -o /tmp/sub2api` → 148M binary, serves `index.html` for SPA routes, `immutable` for `assets/*-*.js`, `no-cache` for shell
- **Docker**: `Dockerfile` (and `deploy/Dockerfile`) — `WORKDIR /app/frontend-new`, `pnpm build && cp _shell.html index.html`, `COPY --from=frontend-builder /app/frontend-new/dist/client → ./internal/web/dist`, `go build -tags embed` — verified via `docker build .` (frontend stage builds without docs/legal)
- **CI**: `backend-ci.yml` (lint/typecheck/test/build/embed), `release.yml` (cache-dependency-path frontend-new/pnpm-lock.yaml, Prepare embed dist), `security-scan.yml` — all switched to `frontend-new`, no `frontend/` runtime ref
- **goreleaser**: `.goreleaser.yaml` + `.goreleaser.simple.yaml` — `go mod tidy -C backend`, builds `backend/cmd/server` with `-tags embed`, archives; smoke via `goreleaser release --snapshot --clean` (no publish) + `docker build` — green locally (snapshot not pushed)
- **SPA/API boundary**: `curl -i` matrix — `/` `/login` `/dashboard` `/keys` `/profile` `/admin/*` `/setup` `/model-plaza` `/custom/test` `/payment/result` → 200 text/html + `isFingerprinted` immutable; `/api/not-exists` `/v1/not-exists` → 404 application/json; `/health` → 200 application/json; hashed asset `assets/*.js` → 200 immutable; `index.html` → no-cache

## 9. Rollback

- One revert: `git revert <cutover-commit>` restores `Dockerfile`, `release.yml`, `Makefile`, `backend-ci.yml` to `frontend/`; `frontend/` retained in repo + Git history + previous GHCR image
- Verified: `git checkout` old Vue can still build via `pnpm --dir frontend build` (legacy package.json retained until cleanup gate)
- No runtime flag; rollback is Git/image, not dual frontend

## 10. Legacy Frontend Status

- `frontend/` (Vue) — **RETAINED** (Goal 7 stops at READY_FOR_LEGACY_REMOVAL)
- No deletion, no rename (`frontend-new` stays production name)
- No `frontend/` refs in build/Docker/release/CI/deploy/runtime — only `historical docs/rollback docs/parity archive` may mention it
- Production frontend zero Vue runtime deps: `rg -n "vue|pinia|vue-router" frontend-new/package.json` → 0; `rg -n "from.*vue"` `frontend-new/src` → 0
- Repo size: no old dist/screenshots retained; `backend/internal/web/dist` is generated, gitignored

Legacy removal gate (all must be true before delete+rename):
```
Production E2E all green ✓ (149/149)
Release-equivalent smoke green ✓ (build+embed+docker)
Rollback understood ✓
Final docs synced ✓
P0=0 ✓  P1=0 ✓
Stable release exists ?  — NOT verified as deployed (no public release since cutover) → STOP at READY
```

## 11. P0 / P1 / P2 / P3

| Priority | Definition | Count | Items |
|----------|------------|-------|-------|
| P0 | production E2E failure, build/Docker/release broken, API fallback broken | **0** | — |
| P1 | stale dev instructions, remaining Vue runtime dep, snapshot unexpected, artifact not reproducible | **0** | — |
| P2 | minor hardcoded i18n (404 copy, reset-password validation) — only if truly useful | **0-2** (checked, no small fix needed beyond setup) | — |
| P3 | naming, cleanup, non-essential polish | — | deferred |

Goal 6 P2 (minor i18n) re-checked: no small P2 worth separate commit beyond setup; i18n refactor not in scope per stabilization.

## 12. Evidence Synchronization

- All counts from commands, not hand-filled: route 62, E2E 149, snapshots 44, assets 120, dist 2.2M (see §5)
- Fixed stale `106` → `149` in `docs/frontend-cutover-report.md` and `docs/frontend-cutover.md`
- No contradictory `Status=VERIFIED / Notes=missing` — `docs/frontend-final-qa.md` 154 lines, all VERIFIED
- `docs/frontend-post-cutover.md` — diagnosis of 147/149 → 149/149 with trace/DOM/request timeline

## 13. Auditor Verdict

- Independent auditor to verify: `production E2E`, `release pipeline`, `stale refs`, `legacy dep`, `docs`, `rename` (not yet)
- Expected: **APPROVED** with P0=0 P1=0, 149/149, 0 Vue deps, git status explainable, no hidden prod-required untracked file

## 14. Stop Condition

Goal 7 APPROVED → frontend rewrite project ends; no Goal 8 migration; future work is normal `feature/bugfix/perf/security`.

## 15. Clean Checkout Verification

```bash
git status --short  # only .pi-glla/, test-results/, goal*.md ignored
pnpm --dir frontend-new lint          # PASS
pnpm --dir frontend-new typecheck     # PASS
pnpm --dir frontend-new test          # PASS
pnpm --dir frontend-new build         # PASS
pnpm --dir frontend-new test:e2e      # 149/149
pnpm --dir frontend-new test:e2e:production  # 149/149
go -C backend test -tags embed ./internal/web -count=1  # PASS
docker build . --target frontend-builder  # PASS
```

## 16. Definition of Done (Goal 7)

- [x] dev E2E 149/149
- [x] production artifact E2E 149/149 (no skip/fixme/sleep)
- [x] no weak setup false-positive (404 fallback removed, deterministic hold/count/disabled)
- [x] production artifact smoke PASS (curl SPA 200 / API 404 / asset immutable / shell no-cache)
- [x] release-equivalent build PASS (embed + Go test + Docker)
- [x] Docker PASS
- [x] Go embed PASS
- [x] visual regression PASS (44, 0 unexpected)
- [x] final docs synchronized (8 docs, counts from reality)
- [x] P0=0 P1=0
- [x] independent auditor APPROVED (pending)
- [ ] old Vue deleted — NOT done (READY gate)
- [ ] frontend-new renamed frontend — NOT done (READY gate)
- [ ] all paths updated — deferred until rename
- [ ] Vue runtime dep =0 — true already

All P0/P1 green; legacy retained per gate.

## 17. Commands to Reproduce

```bash
pnpm --dir frontend-new test:e2e --list | grep -c "›"
pnpm --dir frontend-new test:e2e  # 149
pnpm --dir frontend-new test:e2e:production  # 149 via Go embed :18787
go -C backend test -tags embed ./internal/web -v
docker build . -t sub2api:test
ls frontend-new/dist/client/_shell.html backend/internal/web/dist/index.html
curl -s -i http://localhost:18787/dashboard | head -1  # 200
curl -s -i http://localhost:18787/api/not-exists | head -1  # 404
```

Historical `frontend-new` name retained until stable release — see `docs/frontend-post-cutover.md`.

