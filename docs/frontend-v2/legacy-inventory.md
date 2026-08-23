# Legacy Inventory — Sub2API Frontend V2 Phase 1

> Baseline: `d45135d` / `prep/decouple-frontend` / 2026-08-23
> Reference: `frontend/src` (Vue 3.4 + Vite 5 + Pinia + vue-router + vue-i18n) + backend `internal/server/routes` + `internal/handler`
> Companion docs: `route-map.md` (54 routes) + `api-map.md` (grouped endpoints) + `../decoupling-prep.md` (B1-B4/F1-F3 coupling)

## 1. Routes (§8.4 → route-map.md)

54 routes: 1 setup + 17 public + 16 user + 20 admin. All lazy-loaded via `() => import()` . See `route-map.md` for full table. Redirects: `/`→`/home`, `/admin`→`/admin/dashboard`, `/admin/channels`→`/admin/channels/pricing`. Catch-all `/:pathMatch(.*)*` → `NotFoundView`. Guards enforce `requiresAuth`/`requiresAdmin`/`requiresPayment`/`requiresRiskControl`.

## 2. APIs Consumed (§8.5 → api-map.md)

Frontend calls only `/api/v1/*` + `/setup` + `/v1` (dev proxy). Envelope `{code,message,data}`. Central client `api/client.ts` (axios, 30s timeout, interceptors) + domain modules `api/admin/*` (15+), `api/auth`, `api/user`, `api/payment`, `api/keys|groups|usage|subscriptions|announcements|channelMonitor`. Gateway `/v1/*` is API-key auth, not console JWT.

## 3. Authentication Behavior (§8.6)

- **Restore:** `stores/auth.ts` `restoreSession()` on app startup reads `localStorage.auth_token` + `auth_user`, validates via `GET /api/v1/user/profile`, hydrates `isAuthenticated`/`isAdmin`.
- **Login:** `POST /auth/login` (email+password+Turnstile/TencentCaptcha), optional `POST /auth/login/2fa` (TOTP/passkey). Tokens: `auth_token` (short) + `refresh_token` (long) in localStorage; `token_expires_in` for expiry.
- **Refresh:** `api/tokenRefresh.ts` single-flight deduplication; 401 triggers `POST /auth/refresh` with `refresh_token` (withCredentials), peer tab poll `PEER_REFRESH_POLL_MS`, failure clears storage + redirect `/login`.
- **Logout:** `POST /auth/logout` revokes refresh on server, clears local.
- **Guards:** `router.beforeEach` redirects unauth → `/login?redirect=<original>` and restores post-login. Admin routes additionally check `auth.isAdmin`.
- **Expired session:** interceptor shows `toast` + clears + push `/login`.

## 4. Authorization Behavior (§8.7)

Frontend hiding ≠ auth. Backend enforces admin via `AdminAuthMiddleware` (JWT role). Frontend only optimizes UX: `requiresAdmin` hides admin nav, `requiresPayment` hides purchase when `backend_mode_enabled` or payment disabled, `requiresRiskControl` gates `/admin/risk-control` via feature flag. No frontend-invented permissions.

## 5. Public Configuration (§8.8)

`GET /api/v1/settings/public` → injected as `window.__APP_CONFIG__` in embed mode (CSP nonce) and via dev `injectPublicSettings` plugin. Contains `site_name`, `site_logo`, `contact_info`, `doc_url`, `backend_mode_enabled`, feature switches. Cached with `HTMLCache` (ETag, 2s timeout). Also `GET /setup/status` for setup guard. Branding via `injectBranding` replaces `<title>` and favicon.

## 6. Backend-Mode Behavior (§8.9)

`app.ts: backendModeEnabled = cachedPublicSettings.backend_mode_enabled`. When true, subscription/quotas disabled, purchase/orders hidden, channels in simple mode. Verified by `isBackendMode` checks in guards and `stores/subscriptions`.

## 7. Feature Flags (§8.10)

Centralized via `adminSettings` store + `settingService.GetFrameSrcOrigins`, `GetPublicSettingsForInjection`. Flags: `payment_enabled`, `register_enabled`, `invite_code_required`, `affiliate_enabled`, `oidc_enabled`, `dingtalk/wechat/linuxdo/github/google oauth enabled`, `risk_control_enabled`, `prompt_audit_enabled`. Unavailable route → redirect or disabled UI, fail-closed for security flags.

## 8. Payment Flows (§8.11)

Providers via `api/payment.ts` + `views/user/PaymentView.vue` + `PaymentResultView.vue` + `PaymentQRCodeView.vue` + `StripePaymentView.vue` + `AirwallexPaymentView.vue`/`StripePopupView.vue`. Flow: choose plan → `POST /payment/create` (method `official_alipay|easypay_alipay|official_wxpay|easypay_wxpay|stripe|airwallex`) → redirect/QR → poll `GET /payment/orders/:id` until succeeded/failed/expired; webhook `POST /payment/webhook/stripe|airwallex`. Airwallex SDK `@airwallex/components-sdk` lazy, Stripe `@stripe/stripe-js` lazy vendor chunk. Currency via `lib/format`.

## 9. OAuth Flows (§8.12)

Providers: Linux.do, WeChat (official + payment), DingTalk, GitHub, Google, OIDC, generic OAuth. Pattern: `GET /oauth/<provider>/start` → redirect provider → callback at `/auth/<provider>/callback?code=&state=` → `GET /oauth/<provider>/callback` on backend → if existing user, set tokens (cookie + body) → pending flows use `POST /oauth/pending/exchange|bind-login|create-account|send-verify-code`. WeChat `mode=open|mp` scopes `snsapi_login|snsapi_userinfo`. State + invite/aff code preserved via query.

## 10. Registration Flows (§8.13)

`POST /auth/register` (email+password+verify_code+Turnstile/TencentCaptcha+promo/invitation/aff_code), `POST /auth/send-verify-code` with countdown, `POST /auth/validate-promo-code|validate-invitation-code`. Pending OAuth may create account via `POST /oauth/<provider>/create-account`.

## 11. Password Recovery (§8.14)

`/forgot-password` → `POST /auth/forgot-password` (email) → `/reset-password?token=` → `POST /auth/reset-password` (token+new password). No magic link; token in query.

## 12. Setup Wizard Behavior (§8.15)

First-run detection `setup.NeedsSetup()` → `runSetupServer()` serves `SetupWizardView.vue` at `/setup` (CORS+SecurityHeaders, no auth). `POST /setup` creates admin + DB migration. `GET /setup/status` polled; `resolveCompletedSetupRedirectPath` decides post-setup → `/login` or `/admin/dashboard`. `AutoSetupFromEnv` for Docker.

## 13. i18n Support (§8.16)

`vue-i18n@9.14.5` with `legacy:false`, JIT (`__INTLIFY_JIT_COMPILATION__`) for CSP. Locales `en|zh` lazy-loaded from `i18n/locales/*`. Key format `domain.section.key` (e.g., `admin.users.title`). Persisted `localStorage.sub2api_locale`, fallback to `navigator.language`. `Accept-Language` header sent per request.

## 14. Admin Functionality (§8.17)

20 admin routes: Dashboard (snapshot-v2/stats/realtime/trend), Ops (concurrency/QPS WS/snapshot-v2), Audit Logs (list/clear), Users (CRUD + attributes), Groups (CRUD + duplicate guard `sessionStorage`), Channels (pricing + CN providers), Channel Monitor (V1+V2 matrix/snapshot), Subscriptions (plans), Accounts (batch, Ollama probe), Announcements, Proxies, Redeem, Promo, Settings (tabs: General/Auth/Security/Payments/Channels/Features/Branding), Risk Control (config/logs/unban), Prompt Audit (events), Usage.

## 15. User Functionality (§8.18)

Dashboard (stats/trend/models), Keys (list/create/edit/delete + copy), Usage (list/stats/errors), Channel Status (`/monitor` + `/channel-monitors`), Available Channels, Redeem, Affiliate (aff quota transfer), Profile (password/email bind/notify email/totp/passkey), Subscriptions (list/active/progress), Payment (purchase/orders), Custom Pages (`/custom/:id`), Batch Image (`/batch-image` alias), Key Usage public lookup, Model Plaza lazy.

## 16. Error States with Business Meaning (§8.19)

Normalized `ApiError {status,code,message,reason,metadata}` via `api/errors`. Distinguish: `401` (session expired — refresh or redirect), `403` (forbidden — hidden UI), `404` (not found — `NotFoundView`), `422` (validation — field inline), `429` (rate-limited — countdown), `409` (duplicate — idempotency `sessionStorage` key), business `reason` e.g., `quota_exceeded`, `subscription_expired`, `account_disabled`, `risk_blocked`. Never generic `Something went wrong`.

## 17. Browser Storage Usage (§8.20)

- `localStorage`: `auth_token`, `refresh_token`, `token_expires_in`, `auth_user` (JSON), `sub2api_locale`, `sub2api_admin_group_duplicate:*`, `sub2api_admin_channel-monitor-duplicate:*` (now sessionStorage), sidebar collapsed/persisted page size.
- `sessionStorage`: per-user duplicate suppression keys `sub2api:admin:group-duplicate:<userId>:<hash>`, `channel-monitor-duplicate:*`, pending OAuth `pending_auth_token`/`pending_oauth_token`.
- `cookies`: `oauth_bind_access_token` (short-lived, cleared after bind), `refresh_token` httpOnly (server-set, withCredentials).
- No IndexedDB. Storage audited via `grep localStorage|sessionStorage|document.cookie` — 40+ hits but scoped.

## 18. URL / Query Parameter Contracts (§8.21)

Preserved: `?redirect=` (post-login), `?code=`+`?state=` (OAuth), `?token=` (reset), `?invite_code=` `?aff_code=` (register), `?documentId=` in `/legal/:documentId`, `?key=` in `/key-usage`, `?order_id=` `?out_trade_no=` `?qrcode=` `?orderId=` (payment), `?page=` `?pageSize=` `?search=` `?sort=` `?status=` (tables), `?timezone=` (auto-appended to all GETs), `?id=` `?custom_id` (batch image).

## 19. Callback URLs (§8.22)

Whitelisted exact paths: `/auth/callback`, `/auth/linuxdo/callback`, `/auth/wechat/callback`, `/auth/wechat/payment/callback`, `/auth/dingtalk/callback`, `/auth/dingtalk/email-completion`, `/auth/oidc/callback`, `/payment/result`, `/payment/stripe`, `/payment/airwallex`, `/payment/stripe-popup`. Must not redesign to change query handling; backend `RegisterAuthRoutes` expects exact path + query forward.

## 20. Polling / Refresh Behavior (§8.23)

- Token refresh: single-flight + `setTimeout` peer poll (`PEER_REFRESH_POLL_MS` ~500ms).
- Ops QPS WS: `api/admin/ops.ts` `staleTimer = setInterval(5000)`, `reconnectTimer = setTimeout` exponential.
- TOTP timer: `setInterval(1000)` for 30s countdown, cleaned on unmount (`totp-timer-cleanup.spec`).
- Ollama auto-refresh: `setOllamaCloudUsageAutoRefresh` flag persists via `POST /admin/accounts/:id/ollama-auto-refresh`.
- Account capacity `AccountCapacityCell.vue` auto-refresh via `useAutoRefresh` composable.
- No global polling; each domain owns its interval and stops on unmount/logout.

## 21. Security-Sensitive Rendering (§8.24)

- `v-html` only with `marked` + `DOMPurify.sanitize` (AdminComplianceDialog, AnnouncementBell/Popup, LegalDocumentView).
- CSP via `SecurityHeaders` middleware with nonce `__CSP_NONCE_VALUE__` replaced in HTML; `vue-i18n` JIT avoids `unsafe-eval`.
- API keys masked (`sk-****`), copy via `useClipboard` with feedback, not logged.
- No token/secret in localStorage beyond auth; secrets not rendered fully; payment secrets never in frontend state.

## 22. Important Existing Tests (§8.25)

- **Frontend critical (Makefile):** `api/__tests__/client.spec.ts` (auth header, 401 refresh, timezone), `tokenRefresh.spec.ts` (single-flight), `channelMonitorV2.spec.ts`, `views/auth/LinuxDoCallbackView.spec.ts`, `views/auth/WechatCallbackView.spec.ts`, `views/user/PaymentView.spec.ts`, `PaymentResultView.spec.ts`, `ChannelStatusView.mode.spec.ts`, `components/user/profile/ProfileInfoCard.spec.ts`, `views/admin/SettingsView.spec.ts`, `features/channel-monitor-v2` structure/format/zoom specs.
- **Integration:** `src/__tests__/integration/navigation.spec.ts`, `data-import.spec.ts`, `proxy-data-import.spec.ts`.
- **Backend pairing:** `routes/gateway_key_billing_test.go`, `routes/auth_rate_limit_test.go`, `internal/web/embed_test.go`, `config/webauthn_test.go`, `channelMonitorTemplate` etc.
- New V2 must preserve behavioral coverage via Vitest+RTL+Playwright.

## 23. Backend Is Source of Truth (§9)

All business rules below remain server-authoritative: permissions, account status (`enabled/disabled/expired`), quotas (tokens/requests), subscription state (active/expired/grace), usage aggregation, payment order status, available channels (dynamic via proxy health), risk-control blocklist, feature availability, administrative capability. Frontend only presents; never invents rules.

## 24. Compatibility Requirement (§10)

Preserve URLs, route semantics, query/callback params, API contracts, OAuth redirects, payment callbacks, session behavior, admin behavior, feature switches. Bookmark/external callback safety verified via route-map §6.

## 25. Expected Functional Domains Closure (§11) — Cross-check

Public 10/10, Auth 11/11 (incl. OIDC, pending, backend-only), Setup 3/3, User 15/15, Admin 19/19 (incl. Ops/Audit/Risk/Prompt) inventoried. No known missing domain; full audit available via `route-map.md` + `api-map.md` row counts.

---

> **Disposition for V2:** This document is the disposable checkpoint — Git history at `d45135d` remains the detailed implementation reference (per §8.4). Any item below not marked `Migrated` in the final parity audit must be `Intentionally changed|removed|N/A` with justification.
