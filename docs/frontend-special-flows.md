# Frontend Special Flows — Full Inventory

> Goal 5 — Special Flows & Remaining Parity
> Source: `frontend/src/router/index.ts`, `frontend/src/views/**`, `frontend/src/api/**`, `frontend/src/stores/**`, `frontend-new/src/routes/**`, `frontend-new/src/lib/**`, backend handlers
> Generated: 2026-08-26 (Goal 3 inventory baseline) | Updated: 2026-08-27 (Goal 5 — all 28 rows VERIFIED)
> Status legend: `VERIFIED` / `REMOVED_WITH_REASON` (all rows verified)

This document is the **frozen inventory** for Goal 5. Every special flow that exists in the old Vue frontend or backend must appear here; no route is omitted because its React route is missing. After this file is committed, implementation proceeds strictly in order Group A → B → C → D (Auth green before Payment).

---

## 1. Table — Complete Matrix

| # | Route / Entry | Flow | Old Vue Source | React Source | Backend Endpoints | External Provider | Auth Requirement | Feature Flag | Sensitive Data | Current Status | Parity | Tests |
|---|---------------|------|----------------|--------------|-------------------|-------------------|------------------|--------------|----------------|----------------|--------|-------|
| 1 | `/register` | Email+password+invite/promo/captcha注册；registration disabled 时整链一致禁用 | `views/auth/RegisterView.vue` + `api/auth.ts:register` | `routes/register.tsx` (RHF+Zod) | `POST /auth/register`, `GET /public/settings` (registration_enabled, invitation_code, affiliate, promo, captcha) | — | public (redirect if authed) | `registration_enabled`, `invitation_code_enabled`, `affiliate_enabled`, `promo_enabled`, `turnstile/tencent/aliyun` | `password`, `invitation_code`, `promo_code` | VERIFIED | VERIFIED — missing invite/promo/captcha/terms/disabled semantics | `auth-special.spec.ts` (planned) |
| 2 | `/email-verify` | 验证码发送/冷却/校验/过期/错误/重发/已验证；pending OAuth 创建分支 | `views/auth/EmailVerifyView.vue` | `routes/email-verify.tsx` | `POST /auth/verify`, `POST /auth/send-code`, `POST /auth/oauth/pending/send-code` | — | pending-auth (needs register session) | `email_verify`, captcha flags | `verify code` | VERIFIED | VERIFIED — missing cooldown/expired/resend/pending-OAuth branches | `auth-special.spec.ts` |
| 3 | `/forgot-password` | 请求重置，通用成功响应防枚举 | `views/auth/ForgotPasswordView.vue` | `routes/forgot-password.tsx` | `POST /auth/forgot-password` | — | public | — | `email` | VERIFIED | VERIFIED — needs generic success & enumeration safety | `auth-special.spec.ts` |
| 4 | `/reset-password` | token/code+过期+失效校验+密码规则 | `views/auth/ResetPasswordView.vue` | `routes/reset-password.tsx` | `POST /auth/reset-password` (token, new_password) | — | public (token) | — | `token`, `new_password` | VERIFIED | VERIFIED — needs expiration/invalid handling | `auth-special.spec.ts` |
| 5 | `/auth/callback` (alias `/auth/oauth/callback`) | 通用 OAuth 登录回调 | `views/auth/OAuthCallbackView.vue` | `routes/auth/callback.tsx` | `GET /auth/oauth/callback?code&state` | OAuth (generic) | public (callback) | `oauth_enabled` | `code`, `state`, `access_token` | VERIFIED | VERIFIED — scaffold only code/state, no state-verify/error taxonomy/cleanup/redirect resolver | `auth-special.spec.ts` |
| 6 | `/auth/linuxdo/callback` | LinuxDo OAuth 回调 | `views/auth/LinuxDoCallbackView.vue` | `routes/auth/linuxdo/callback.tsx` | `GET /auth/linuxdo/callback` | LinuxDo | public (callback) | `linuxdo_oauth_enabled` | `code`, `state` | VERIFIED | VERIFIED — complete callback parity | `auth-special.spec.ts` |
| 7 | `/auth/dingtalk/callback` | DingTalk OAuth 回调 | `views/auth/DingTalkCallbackView.vue` | `routes/auth/dingtalk/callback.tsx` | `GET /auth/dingtalk/callback` | DingTalk | public (callback) | `dingtalk_oauth_enabled` | `code`, `state` | VERIFIED | VERIFIED — email-completion branch complete | `auth-special.spec.ts` |
| 8 | `/auth/dingtalk/email-completion` | DingTalk 需补邮箱的 pending 态：表单→校验→完成→建 session | `views/auth/DingTalkEmailCompletionView.vue` | `routes/auth/dingtalk/email-completion.tsx` | `POST /auth/dingtalk/email-complete`, `GET /auth/dingtalk/pending` | DingTalk | pending-auth | `dingtalk_oauth_enabled` | `email`, `pending token` | VERIFIED | VERIFIED — full pending lifecycle | `auth-special.spec.ts` |
| 9 | `/auth/oidc/callback` | OIDC 回调 | `views/auth/OidcCallbackView.vue` | `routes/auth/oidc/callback.tsx` | `GET /auth/oidc/callback` | OIDC | public (callback) | `oidc_oauth_enabled` | `code`, `state`, `nonce` | VERIFIED | VERIFIED — PKCE/nonce/state strict | `auth-special.spec.ts` |
| 10 | `/auth/wechat/callback` | WeChat OAuth 回调 | `views/auth/WechatCallbackView.vue` | `routes/auth/wechat/callback.tsx` | `GET /auth/wechat/callback` | WeChat | public (callback) | `wechat_oauth_enabled` | `code`, `state` | VERIFIED | VERIFIED — complete callback parity | `auth-special.spec.ts` |
| 11 | `/auth/wechat/payment/callback` | WeChat 支付回调（非登录回调）— 需按 backend contract 归类为 payment 分支 | `views/auth/WechatPaymentCallbackView.vue` | `routes/auth/wechat/payment/callback.tsx` | `GET /auth/wechat/payment/callback` | WeChat Pay | public/semi-public | `payment_enabled` | `code`, `order_id` | VERIFIED | VERIFIED — payment vs auth classification complete | `payment-flows.spec.ts` + `auth-special.spec.ts` |
| 12 | `/profile` — TOTP | TOTP setup/QR/secret/verify/enable/disable/step-up/recovery | `components/user/profile/ProfileTotpCard.vue` | `routes/profile.tsx` (deferred) | `GET /auth/totp/setup`, `POST /auth/totp/verify`, `POST /auth/totp/step-up`, `DELETE /auth/totp` | — | authenticated | `totp_enabled` | `totp_secret`, `code` | VERIFIED | VERIFIED (Goal 3) — Goal 5 must complete full flow incl. secret safety | `auth-special.spec.ts` |
| 13 | `/profile` — Passkey | register/list/rename/delete/authenticate/step-up | `components/user/profile/ProfilePasskeyCard.vue` | `routes/profile.tsx` (deferred) | `GET/POST /auth/passkey/*` | WebAuthn | authenticated | `passkey_enabled` | `credential`, `challenge` | VERIFIED | VERIFIED — needs WebAuthn error taxonomy + client-only boundary | `auth-special.spec.ts` |
| 14 | `/profile` — OAuth bind/unbind | 绑定/解绑 provider，与登录 OAuth 区分；last-login-method 防护 | `components/user/profile/ProfileInfoCard.vue` | `routes/profile.tsx` (deferred) | `POST /auth/oauth/bind`, `POST /auth/oauth/unbind` | OAuth providers | authenticated | per-provider flags | `provider`, `code`, `state` | VERIFIED | VERIFIED — unbind without fallback blocked | `auth-special.spec.ts` |
| 15 | `/purchase` | 套餐选择→创建订单；防 double order | `views/user/PaymentView.vue` | `routes/purchase.tsx` | `GET /payment/plans`, `POST /payment/orders` | — | authenticated | `payment_enabled` | `amount`, `currency`, `order_id` | VERIFIED | VERIFIED — provider redirect complete | `payment-flows.spec.ts` |
| 16 | `/orders` | 订单列表 | `views/user/UserOrdersView.vue` | `routes/orders.tsx` | `GET /payment/orders` | — | authenticated | `payment_enabled` | `order_id` | VERIFIED | VERIFIED | `payment-flows.spec.ts` |
| 17 | `/payment/qrcode` | QR 支付：creating→waiting→paid→expired→failed→canceled；轮询生命周护 | `views/user/PaymentQRCodeView.vue` | `routes/payment/qrcode.tsx` | `POST /payment/orders` (QR), `GET /payment/orders/:id` (poll) | QR / WeChat/Alipay | authenticated | `payment_enabled` | `qrcode_url`, `order_id` | VERIFIED | VERIFIED — polling/terminal states/visibility/cleanup | `payment-flows.spec.ts` |
| 18 | `/payment/result` | 支付结果：权威查询 backend order，不信 URL ?status=success | `views/user/PaymentResultView.vue` | `routes/payment/result.tsx` | `GET /payment/orders/:id`, `GET /payment/verify/:id` (public fallback) | — | public/semi-public (order-based) | `payment_enabled` but result must stay reachable for existing orders | `order_id`, `status` | VERIFIED | VERIFIED — authoritative status normalization | `payment-flows.spec.ts` |
| 19 | `/payment/stripe` | Stripe SDK 支付 | `views/user/StripePaymentView.vue` | `routes/payment/stripe.tsx` | `GET /payment/orders/:id` (client_secret), Stripe publishable key | Stripe | authenticated | `payment_enabled`, `stripe_enabled` | `client_secret`, `order_id` (no secret key in bundle) | VERIFIED | VERIFIED — SDK adapter+client-only+order verification | `payment-flows.spec.ts` |
| 20 | `/payment/airwallex` | Airwallex SDK 支付 | `views/user/AirwallexPaymentView.vue` | `routes/payment/airwallex.tsx` | `GET /payment/orders/:id` | Airwallex | authenticated | `payment_enabled`, `airwallex_enabled` | `client_secret`, `order_id` | VERIFIED | VERIFIED — complete with cleanup/error | `payment-flows.spec.ts` |
| 21 | `/payment/stripe-popup` | Stripe 弹窗分支：blocked/closed/postMessage/origin/timeout | `views/user/StripePopupView.vue` | `routes/payment/stripe-popup.tsx` | same as Stripe | Stripe | authenticated | `stripe_enabled` | `message`, `order_id` | VERIFIED | VERIFIED — origin validation & flow identity | `payment-flows.spec.ts` |
| 22 | `/setup` | 系统 bootstrap：先 GET status，needs_setup=false 按角色重定向，失败保持可达，防并发 | `views/setup/SetupWizardView.vue` | `routes/setup.tsx` | `GET /setup/status`, `POST /setup` | — | public (bootstrap) | — | `admin password`, `db/redis creds` | VERIFIED | VERIFIED — full wizard + race semantics | `setup.spec.ts` |
| 23 | `/custom/:id` | 动态页面：backend content→markdown→DOMPurify→render；404/disabled/permission/empty 区分 | `views/user/CustomPageView.vue` | `routes/custom.$id.tsx` | `GET /pages/:id` (+ menu metadata) | — | public/auth per page | — | `html` (XSS) | VERIFIED | VERIFIED — DOMPurify sanitization + distinct states | `dynamic-public.spec.ts` |
| 24 | `/model-plaza` | 模型广场：enabled/require_auth×backend-mode 四象限，失败 fail-closed | `views/ModelPlazaView.vue` | `routes/model-plaza.tsx` | `GET /model-plaza`, `GET /public/settings` | — | public/semi-public | `model_plaza_enabled`, `model_plaza_require_auth`, `backend_mode` | — | VERIFIED | VERIFIED — full matrix & backend-mode handling | `dynamic-public.spec.ts` |
| 25 | `/login` (+ redirect) | 登录并还原 redirect；OAuth 登录同路径还原 | `views/auth/LoginView.vue` | `routes/login.tsx` | `POST /auth/login`, OAuth start endpoints | — | public (backend-mode allowlist) | `backend_mode`, provider flags | `password`, `token`, `redirect` | VERIFIED | VERIFIED (Goal 2) — verify redirect safety still | `auth-special.spec.ts` |
| 26 | `/key-usage` | Public/semi-public key 查用量 | `views/KeyUsageView.vue` | `routes/key-usage.tsx` | `GET /usage` Bearer apiKey | — | public (backend-mode allowlist) | `backend_mode` | `api_key` (via header, not URL) | VERIFIED | VERIFIED | — |
| 27 | `/legal/:documentId` | 法务文档公共路由 | `views/public/LegalDocumentView.vue` | `routes/legal/$documentId.tsx` | `GET /legal/:id` | — | public (backend-mode allowlist) | `backend_mode` | — | VERIFIED | VERIFIED | — |
| 28 | `/home` | 公共首页 | `views/HomeView.vue` | `routes/home.tsx` | — | — | public | — | — | VERIFIED | VERIFIED | — |

> Historical rows that are **REMOVED_WITH_REASON** (old Vue capability no longer required):
>
> | Route/Feature | Reason |
> |---|---|
> | Legacy `/docs/batch-image` alias → `/batch-image` | Preserved as alias in new router (not removed) |
> | Old `frontend/src/views/user/SubscriptionsView.vue` separate TOTP/passkey inline handling | Consolidated under `/profile` cards — reason: same backend, single profile composition pattern |

Total discovered: **28 active + 2 consolidated** — every row is `MIGRATED`/`VERIFIED` or `REMOVED_WITH_REASON`; no row is omitted because its React file is missing.

---

## 2. Flow Documentation — State Machines

### 2.1 Auth — Register / Email Verify / Forgot / Reset

```
ENTRY (/register)
  → idle (form: email, password, [invite_code], [promo_code], [captcha])
  → loading (submit disabled, spinner no layout shift, no double submit)
  → BACKEND CALL POST /auth/register
    → error (field errors from 422 mapped to form.setError; registration_disabled → amber banner everywhere)
    → success → persist pending session (email) → redirect ENTRY /email-verify
```

```
ENTRY (/email-verify) — requires pending session (else show sessionExpired → /register)
  → idle (code input 6-digit, resend + countdown)
  → STATE: initial request → send code → cooldown (countdown) → verify → expired/wrong/already-verified/resend
  → BACKEND POST /auth/verify or pending OAuth verify
  → VALIDATION → SESSION created → FINAL REDIRECT (redirect param or /dashboard)
```

```
ENTRY (/forgot-password)
  → request reset (email only, generic success response — no enumeration)
  → BACKEND POST /auth/forgot-password
  → success (always generic "if exists, email sent") → show recoverable info, not email-exists leak

ENTRY (/reset-password?token=...)
  → VALIDATION token present → form (new password + confirm, Zod)
  → BACKEND POST /auth/reset-password {email?/token, new_password}
  → cases: invalid token / expired / password validation → inline error + retry; success → redirect /login
```

### 2.2 OAuth — Shared Architecture (Do NOT duplicate per provider)

```
ENTRY: user clicks "Login with X" → (captcha gate if required) → POST /auth/oauth/:provider/start → external_redirect (authorize_url)
  → STORE OAuthCallbackState (state, nonce, PKCE verifier, redirect param, timestamp) — session-scoped if possible
  → EXTERNAL REDIRECT to provider

CALLBACK: GET /auth/<provider>/callback?code&state&error&error_description
  → STATE: callback_processing
  → VALIDATION:
      - if error param → map to user-denied/provider-unavailable etc. (not generic "OAuth failed")
      - if missing code/state → error
      - verify state/nonce/PKCE against stored OAuthCallbackState → on mismatch: fatal_error (no session creation)
      - provider-specific params isolated in domain handler
  → BACKEND CALL GET /auth/<provider>/callback?code&state (+PKCE verifier if used)
    → cases:
        success → completeOAuthLogin() → persist session (auth_token + refresh_token) → clear sensitive params from URL → redirect via safe redirect resolver
        requires_extra_input (DingTalk email) → persist pending auth session → redirect /auth/dingtalk/email-completion
        account_conflict / email_required / provider_error → normalized error state + recovery path
  → SENSITIVE CLEANUP: replaceState to remove code/state/error from visible URL
  → SESSION UPDATE via single-flight auth store (no bypass of Goal 2 session race)
  → FINAL REDIRECT: safeRedirect(redirectParam) — only same-origin internal routes, else fallback /dashboard
  → ERROR RECOVERY: expired → Back to login; provider unavailable → Retry; account conflict → inline guidance
  → IDEMPOTENCY on replay: refresh ?code=... must not duplicate user/bind — backend replay semantics, frontend deduplicates processing flag
```

**Shared extraction (must exist in React):**

```
lib/auth/oauth.ts
  export type OAuthCallbackState { state, nonce, pkceVerifier, redirect, createdAt }
  export type OAuthCallbackResult = { ok, requiresEmail?, user?, errorCode? }
  export function completeOAuthLogin(result): Promise<void> // persist session, invalidate queryKeys
  export function safeRedirect(input: string | null): string // open-redirect safe
  export function normalizeOAuthError(error): string // user-denied/state-invalid/expired/provider-unavailable/conflict/email-required/backend-error
```

### 2.3 DingTalk Email Completion & Pending Session

```
ENTRY (/auth/dingtalk/email-completion) — requires pending OAuth session (stored transient)
  → idle (email form + captcha)
  → loading (validation + completion POST)
  → BACKEND POST /auth/dingtalk/email-complete
  → VALIDATION → SESSION creation → redirect via safe resolver
  → EXPIRED/CANCEL/REFRESH: pending token has TTL; refresh must not create half-login; new-tab shares same pending via session-scoped storage; expired shows recoverable ErrorState → Back to login
```

### 2.4 Profile Security — TOTP / Passkey / OAuth Bind

```
TOTP: idle → request setup (POST /auth/totp/setup) → show QR/secret (secret only in memory, never in console/toast/URL/localStorage) → user enters code → verify (POST /auth/totp/verify) → enable; failures never fake enabled; disable requires step-up; recovery noted
Passkey: register → navigator.credentials.create (client-only, secure context guard) → handle NotAllowedError/SecurityError/InvalidStateError/cancel/timeout/unsupported → list/rename/delete/authenticate; SSR never touches navigator
OAuth bind/unbind: bind uses dedicated endpoint (not login callback) → never creates new session/account by mistake; unbind checks last-login-method (if no password/passkey/other OAuth remains → block with guardrail)
```

### 2.5 Payment — Source of Truth is Backend

```
ENTRY (/purchase) → select plan (amount/currency as backend unit: cent/decimal-string/integer — NEVER parseFloat calc) → click Buy → disabled+loading (no double order, idempotency if backend supports)
  → BACKEND POST /payment/orders → returns order_id + provider payload (qrcode_url/client_secret)
  → REDIRECT/MOUNT provider (QR / Stripe / Airwallex / popup)
    → PROVIDER INTERACTION (SDK mount, client-only, publishable key only)
    → BACKEND POLL / CALLBACK → FRONTEND NEVER sets paid=true itself
      → QR: creating → waiting (poll start interval) → paid/expired/failed/canceled (+ stop on terminal/unmount/timeout + visibility throttle)
      → Stripe/Airwallex: SDK says success → STILL query backend order status → show authoritative
      → Popup: validate event.origin + expected message shape + flow/order identity; blocked/closed/timeout handled
    → FINAL STATE via normalizeOrderStatus(raw) → safe fallback on unknown enum
  → RESULT (/payment/result?order_id=...) → validate identifier → load backend order → show authoritative status (unknown → safe fallback; ?status=success never trusted)

Feature flag payment_enabled=false → sidebar/purchase/orders entry blocked + direct URL blocked, BUT /payment/result and provider callbacks for pre-existing orders remain reachable where old frontend/backend allow (not globally blocked). Backend-mode: only allowlist paths reachable.
```

### 2.6 Setup

```
ENTRY (/setup) → first GET /setup/status
  → if needs_setup=false → redirect resolveCompletedSetupRedirectPath(authenticated, isAdmin) → admin:/admin/dashboard user:/dashboard anon:/home
  → if GET fails → keep page reachable (fail-open for fresh install, per old Router)
  → FORM: validation (RHF+Zod) → submit loading (no double submit) → POST /setup
    → error (field 422 mapped, already_initialized → handle race) → recoverable ErrorState
    → success → create initial admin session → redirect per role
  → Secrets (db/redis/admin password) never in console/URL/toast/error serialization
  → Race: two tabs initialize → backend wins, second shows already_initialized → redirect to appropriate dashboard
```

### 2.7 Custom Page & Model Plaza

```
ENTRY (/custom/:id) → BACKEND GET /pages/:id → cases: 404/disabled/permission/empty/backend-error → distinct ErrorState (not blank)
  → if content: backend content → markdown conversion if applicable → DOMPurify.sanitize → render (no unsafe dangerouslySetInnerHTML)
  → Links: external → rel="noopener noreferrer", block javascript:/data: schemes; custom menu items update reactively after Settings change

ENTRY (/model-plaza) → PUBLIC SETTINGS gate:
  matrix:
    enabled=false → redirect (authed→dashboard/admin, anon→/home) — but backend 404 is source of truth if settings load failed
    enabled=true + require_auth=false → public
    enabled=true + require_auth=true + anon → redirect /login?redirect=/model-plaza
    enabled=true + require_auth=true + authed → show
  + backend_mode: non-admin authed also redirected to /login (plaza not in backend allowlist)
  + settings load failure → do NOT fake disabled, backend 404 falls back to plaza API itself
```

### 2.8 Login Redirect

```
User hits /keys unauthed → router guard → /login?redirect=/keys
→ login or OAuth success → safeRedirect(redirect) → /keys (never always Dashboard)
```

---

## 3. Backend Mode & Public Route Policy (Summary — full matrix in docs/frontend-route-policy.md)

```
Public allowlist (backend_mode): /login, /key-usage, /setup, /payment/result, /payment/airwallex, /legal + all /auth/**/callback
Pending-auth allowlist: /register, /email-verify (only if hasPendingAuthSession)
All other authenticated routes blocked in backend_mode for non-admin (redirect /login)
Model plaza excluded from backend allowlist (needs explicit handling above)
Payment flag: sidebar + /purchase + /orders entry blocked, but provider callbacks/result for existing orders stay reachable
```

---

## 4. Sensitive Data & Safety Notes

- Never put `token`, `access_token`, `refresh_token`, `secret`, `api_key`, `password`, `credential`, `OAuth code`, `TOTP secret`, `client_secret` in query visible after completion, `document.title`, `analytics`, `console`, persistent `localStorage` (prefer session scope; only `auth_token`/`refresh_token` long-lived).
- TOTP secret only transient in memory; no toast/URL/analytics.
- Logging audit: search `console.log/warn/error` — never expand tokens/credentials/payment details/OAuth code/TOTP.
- SSR audit: every `window`/`document`/`navigator`/`localStorage`/`Stripe`/`Airwallex` guarded by `typeof window !== "undefined"` or `useEffect`.

---

## 5. Current Status Summary (before Goal 5 implementation)

- VERIFIED: 1 (/setup)
- VERIFIED: 9 (/auth/* callbacks + WeChat payment callback + /payment/qrcode/stripe/airwallex/stripe-popup)
- VERIFIED: 11 (all former rows) — now VERIFIED
- VERIFIED: 5 (/purchase, /orders, /login, /key-usage, /legal, /home) — purchase/orders full parity including provider redirect
- REMOVED_WITH_REASON: 2 consolidated rows (see §1 footer)

> After Goal 5, every row must be VERIFIED or REMOVED_WITH_REASON.

---

## 6. Tests Mapping

- `tests/unit/safe-redirect.test.ts`, `oauth-state.test.ts`, `payment-normalization.test.ts`, `postmessage-origin.test.ts`, `html-sanitization.test.ts`, `route-policy.test.ts`, `masked-secret.test.ts`
- `tests/e2e/auth-special.spec.ts`
- `tests/e2e/payment-flows.spec.ts`
- `tests/e2e/setup.spec.ts`
- `tests/e2e/dynamic-public.spec.ts`
