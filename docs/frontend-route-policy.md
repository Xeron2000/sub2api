# Frontend Route Policy — Public / Pending-Auth / Authenticated / Admin / Backend Mode

> Goal 5 — consolidated policy (no scattered `这个 callback 可以匿名` exceptions).
> Source of truth: backend handlers + old Vue `frontend/src/router/index.ts` (allowlist + guards).
> Generated: 2026-08-28 | Reference: `docs/frontend-special-flows.md`

Policy categories:
- `public` — reachable without auth
- `pending-auth-only` — reachable only while a pending registration/OAuth session exists (e.g. `/register` → `/email-verify`)
- `authenticated` — requires `auth_token` + user
- `admin` — requires `role=admin`
- `backend-mode-allowed` — allowlist when `backend_mode_enabled=true` (unauthenticated non-admin blocked otherwise)
- `feature-flagged` — gated by `payment_enabled`, `model_plaza_enabled`, `risk_control_enabled`, etc. Backend is final arbiter (404 vs redirect).

---

## 1. Policy Matrix

| Route | Anonymous | Pending Auth | User | Admin | Backend Mode | Simple Mode | Payment Flag | Risk Flag | Other Flag |
|-------|-----------|--------------|------|-------|--------------|-------------|--------------|-----------|------------|
| `/setup` | ✅ (bootstrap) | ✅ | ✅ (redirect if needs_setup=false) | ✅ | ✅ allowed | ✅ | — | — | `needs_setup` decides; GET failure → keep reachable |
| `/home` | ✅ | ✅ | ✅ | ✅ | ✅ (public) | ✅ | — | — | — |
| `/login` | ✅ | ✅ | redirect → `/dashboard` | redirect → `/admin/dashboard` | ✅ allowed | ✅ | — | — | `backend_mode`: non-admin authed stays on `/login` to avoid loop |
| `/register` | ✅ | ✅ | redirect → dashboard | redirect → admin | ❌ unless `hasPendingAuthSession` | ✅ | — | — | Gated by `registration_enabled` (nav+page+submit+backend consistent) |
| `/email-verify` | ❌ (needs pending) | ✅ | ❌ | ❌ | ❌ unless `hasPendingAuthSession` | ✅ | — | — | Requires pending register/OAuth session else `sessionExpired` |
| `/forgot-password` | ✅ | ✅ | ✅ | ✅ | ❌ (blocked in backend mode) | ✅ | — | — | Generic success, no enumeration |
| `/reset-password` | ✅ (token) | ✅ | ✅ | ✅ | ❌ | ✅ | — | — | Token query param |
| `/auth/callback` (alias `/auth/oauth/callback`) | ✅ (callback) | ✅ | ✅ | ✅ | ✅ allowed (callback) | ✅ | — | — | OAuth generic |
| `/auth/linuxdo/callback` | ✅ (callback) | ✅ | ✅ | ✅ | ✅ allowed (callback) | ✅ | — | — | — |
| `/auth/dingtalk/callback` | ✅ (callback) | ✅ | ✅ | ✅ | ✅ allowed (callback) | ✅ | — | — | — |
| `/auth/dingtalk/email-completion` | ✅ (pending) | ✅ | ✅ | ✅ | ✅ allowed (callback) | ✅ | — | — | Requires pending DingTalk session |
| `/auth/oidc/callback` | ✅ (callback) | ✅ | ✅ | ✅ | ✅ allowed (callback) | ✅ | — | — | — |
| `/auth/wechat/callback` | ✅ (callback) | ✅ | ✅ | ✅ | ✅ allowed (callback) | ✅ | — | — | — |
| `/auth/wechat/payment/callback` | ✅ (payment callback) | ✅ | ✅ | ✅ | ✅ allowed (callback) | ✅ | `payment_enabled` but callback stays reachable for existing orders | — | Classified as payment, not auth — verify via backend |
| `/key-usage` | ✅ | ✅ | ✅ | ✅ | ✅ allowed | ✅ | — | — | Public/semi-public via `Authorization: Bearer <apiKey>` header |
| `/legal/:documentId` | ✅ | ✅ | ✅ | ✅ | ✅ allowed | ✅ | — | — | Public |
| `/model-plaza` | ✅ if `enabled=true && !require_auth` else redirect/login | ✅ | ✅ if allowed by flags | ✅ if allowed | ❌ non-admin authed redirected to `/login` (not in allowlist) | ✅ | — | — | `model_plaza_enabled` + `model_plaza_require_auth` + `backend_mode` matrix; settings load failure → NOT disabled (backend 404 fallback) |
| `/dashboard` | ❌ → `/login?redirect=/dashboard` | ❌ | ✅ | redirect admin → `/admin/dashboard` | ❌ (blocked non-admin) | filtered nav | — | — | — |
| `/keys` | ❌ → `/login?redirect=/keys` | ❌ | ✅ | ✅ (admin can view) | ❌ | ✅ | — | — | — |
| `/profile` | ❌ → login | ❌ | ✅ | ✅ | ❌ | ✅ | — | — | Contains TOTP/Passkey/OAuth bind sub-sections |
| `/purchase` | ❌ → login | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ `payment_enabled` must be true else 404/redirect + nav hidden | — | Money unit = backend unit (cent/decimal-string/integer) |
| `/orders` | ❌ → login | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ `payment_enabled` but list hidden | — | — |
| `/payment/qrcode` | ❌ → login | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ `payment_enabled` | — | Polling lifecycle requires auth |
| `/payment/result` | ✅ (order_id query) | ✅ | ✅ | ✅ | ✅ allowed | ✅ | ✅ existing orders remain reachable even if flag disabled | — | Semi-public; authoritative via `GET /payment/orders/:id` |
| `/payment/stripe` | ✅ (public mount, but needs order) | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ `payment_enabled && stripe_enabled` | — | Client-only, publishable key only |
| `/payment/airwallex` | ✅ | ✅ | ✅ | ✅ | ✅ allowed (explicit in BACKEND_MODE_ALLOWED_PATHS) | ✅ | ✅ `payment_enabled && airwallex_enabled` | — | Client-only; allowlist includes this one specifically |
| `/payment/stripe-popup` | ✅ (popup) | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ `payment_enabled && stripe_enabled` | — | postMessage origin validation |
| `/custom/:id` | depends on page visibility (public/auth) | ✅ | ✅ | ✅ | ❌ (except via customMenuItems public?) | ✅ | — | — | Backend `visibility` field decides |
| `/redeem`, `/affiliate`, `/subscriptions`, `/usage`, `/available-channels`, `/batch-image`, `/monitor`, `/batch-image` alias | ❌ → login | ❌ | ✅ | — | ❌ | ✅/filtered | `subscriptions` needs simple flag | — | Standard authenticated user routes |
| `/admin/*` (dashboard, users, groups, channels, monitor, orders, plans, settings, etc.) | ❌ | ❌ | ❌ (non-admin → login) | ✅ | ❌ except login paths | admin only | `admin/orders*` needs `payment_enabled` | `risk-control`, `prompt-audit` need `risk_control_enabled` | — |
| `/:pathMatch(.*)*` (404) | ✅ (shows 404) | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — |

---

## 2. Backend Mode — Allowlist (canonical, from old Router)

```ts
BACKEND_MODE_ALLOWED_PATHS = ['/login', '/key-usage', '/setup', '/payment/result', '/payment/airwallex', '/legal']
BACKEND_MODE_CALLBACK_PATHS = [
  '/auth/callback',
  '/auth/linuxdo/callback',
  '/auth/dingtalk/callback',
  '/auth/dingtalk/email-completion',
  '/auth/oidc/callback',
  '/auth/wechat/callback',
  '/auth/wechat/payment/callback',
]
BACKEND_MODE_PENDING_AUTH_PATHS = ['/register', '/email-verify'] // only if hasPendingAuthSession
```

Logic: `isBackendModePublicRouteAllowed(path, hasPendingAuthSession)` checks exact match or `startsWith` for allowed, exact for callbacks, then pending-auth list gated by session.

Additional guard in `beforeEach`:
- `/setup` checked first via `GET /setup/status` even in backend mode; `needs_setup=false` redirects via `resolveCompletedSetupRedirectPath`.
- `/model-plaza` special: not in allowlist; backend mode + authed non-admin → redirect `/login`.
- Payment flag: `requiresPayment` meta on `/payment/qrcode` + admin orders routes; sidebar nav hides when `payment_enabled=false`, but provider callbacks/result for pre-existing orders are exempt per backend contract (not blanket block).

---

## 3. Refresh / Direct-Load / Cross-Tab Safety

- Every `public` and `callback` route must work on `direct URL`, `browser refresh`, `back/forward`, `new tab`, `duplicate callback` — never SPA-only.
- Pending-auth pages must survive refresh (session-scoped storage, TTL) and handle `expired`/`new-tab`/`cancel` gracefully.
- Cross-tab auth: `Tab A logout` + `Tab B callback`, `Tab A login user1` + `Tab B OAuth user2`, in-flight refresh race — all go through Goal 2 single-flight session architecture; no callback bypasses it.
- Hydration: `callback direct load`, `payment direct load`, `setup direct load`, `custom page direct load`, `model plaza direct load` must not mismatch (client-only SDKs never SSR-imported).

---

## 4. Feature Flag Interactions

- `registration_enabled=false`: nav hides Register link + page shows amber disabled + submit blocked + backend 422 consistent.
- `payment_enabled=false`: sidebar hides Purchase/Orders + page guards block `/purchase`, but `GET /payment/orders/:id` verify still honors existing orders; `/payment/result` and `/payment/wechat/payment/callback` remain reachable.
- `model_plaza_enabled=false`: plaza route redirects (or backend 404 falls back); settings load failure ≠ disabled (fail-closed for backend, fail-open for guard).
- `backend_mode_enabled=true`: only allowlist above is public; all other authenticated routes force `/login` for non-admin (admin still full access).
- `simple_mode`: user nav filtering (affiliate/subscriptions etc. hidden) but auth callbacks still public.

---

## 5. Sensitive URL / Storage / Logging / SSR Audits

- Sensitive params (`token`, `code`, `state`, `access_token`, `secret`, `api_key`, `password`, `credential`, `TOTP secret`, `client_secret`) must not linger in `query`/`hash`/`title`/`analytics`/`console` after callback completion — cleared via `history.replaceState`.
- Storage: only `auth_token`, `refresh_token`, `auth_user`, `token_expires_at`, safe preferences; transient `OAuth state/PKCE`, `payment secret`, `TOTP` → session scope.
- Logging: no `console.*` expansion of tokens/credentials/payment/OAuth code/TOTP.
- SSR: every `window`/`document`/`navigator`/`localStorage`/`Stripe`/`Airwallex`/`credentials` access guarded.

---

## 6. Verification

- Matrix covers all 28 discovery routes + admin group; every row has explicit decision, no "forgotten".
- Old router parity: diff `frontend/src/router/index.ts` vs `frontend-new/src/routes/**` yields either `VERIFIED` or `REMOVED_WITH_REASON` (see `docs/frontend-special-flows.md` §1 footer).
- Tests: `tests/e2e/dynamic-public.spec.ts` exercises plaza matrix + custom page states; `payment-flows.spec.ts` exercises payment flag; `setup.spec.ts` exercises backend-mode setup.
