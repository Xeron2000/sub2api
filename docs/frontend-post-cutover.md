# Frontend Post-Cutover Diagnosis — Goal 7

> Date: 2026-08-27 | Artifact: `frontend-new/dist/client/_shell.html → backend/internal/web/dist → Go -tags embed` | Base: `production` Go testserver `:18787`

## 1. Production vs Dev Divergence

```text
Dev E2E:        149/149 PASS (vite dev server 18788)
Production E2E: 148/149 (2026-08-27 run with existing dist)
                143/149 in full-suite order-sensitive run (historical)
```

## 2. Failures Observed

| # | Test | Symptom (prod) | Dev | Root cause |
|---|------|----------------|-----|------------|
| 1 | `setup › double submit is blocked` | `Test timeout 30s — page.waitForTimeout: Target page closed` (isolated) / `waiting for #email` (full suite) | PASS | Test weakness + source guard not sync. Second `btn.click()` races before `mutation.isPending` flips; `sleep 600ms` is non-deterministic; `if 404 return` hides failures. |
| 2 | `setup › *` other 5 flaky when run after admin suite | `waiting for #email` timeout when full suite runs before setup | PASS isolated | Order-dependent shared `localStorage` + `page.route` pattern `**/setup/status**` vs `apiClient` base `/api/v1` + fallback fetch — intermittent mock miss when previous suite leaves auth tokens; 404 fallback masks real failure. |

## 3. Request Timeline — Setup

```text
GET /setup          → 200 text/html (SPA shell _shell.html via Go embed, bypass check excludes /setup/ but serves /setup as SPA)
JS hydrated → getSetupStatus()
  1st: apiClient.get("/setup/status") → base /api/v1 → GET /api/v1/setup/status?timezone=UTC
       → page.route "**/setup/status**" should intercept (contains /setup/status)
       → if missed → Go testserver has no handler → 404 → fallback fetch buildGatewayUrl("/setup/status") → GET /setup/status → testserver returns needs_setup=false → redirect
  2nd (fallback): fetch(buildGatewayUrl("/setup/status")) → GET /setup/status
POST /setup/install → base /api/v1 → POST /api/v1/setup/install → same double-path issue; page.route "**/setup/install**" must intercept both
```

`shouldBypassEmbeddedFrontend("/setup/status") == true` — see `backend/internal/web/embed_on.go:355`. Testserver registers explicit `GET /setup/status` and `POST /setup/install` handlers before embed middleware, so unmocked requests return `needs_setup=false`.

## 4. DOM State at Failure

- Production build renders same `src/routes/setup.tsx` — wizard form with `#email`, `#password`, `Initialize` button.
- When mock succeeds (`needs_setup:true`): form visible, `#email` exists.
- When mock misses: `statusQuery` returns `needs_setup:false` → `window.location.href` redirect to `/home|/dashboard|/admin/dashboard` → `#email` never appears → timeout waiting for `locator("#email")`.

## 5. Navigation Difference dev vs production

Identical SPA shell. Difference is API base and proxy:
- dev: `vite proxy /setup → http://localhost:18786` — backend may return different setup state but mock overrides.
- production: Go `testserver` minimal handlers → explicit 404 vs 200 difference exposes weak mock pattern.

No SSR/Node difference — architecture frozen as `TanStack Start SPA → _shell.html → index.html → Go embed`.

## 6. Fix Plan

- Source (`src/routes/setup.tsx`): synchronous double-submit guard — ref + state so `submitting=true` immediately on first submit, `button disabled` and `form submission guarded` before second click can fire; reset on `onSettled`.
- Tests (`e2e/setup.spec.ts`): remove every `if body includes 404 return` (404 == failure except the one 500 test); strengthen `already-initialized` to assert `needs_setup=false → redirect` per role; strengthen `success` to assert `POST count==1` + redirect/session; deterministic double-submit via `intercept hold → click → assert disabled → attempt second action → release → assert count==1` (no sleep for correctness, no `catch(()=>{})` to hide).
- Eliminate `waitForTimeout`/`catch(()=>{})` used for correctness elsewhere only where flaky; keep legitimate delays minimal.

## 7. Verification

```bash
pnpm --dir frontend-new test:e2e              # N/N
pnpm --dir frontend-new test:e2e:production   # N/N (same N, same strictness)
rg -n "waitForTimeout|404.*return|catch\(\(\)" frontend-new/e2e/setup.spec.ts # 0
```
