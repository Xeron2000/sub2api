# API Map — Sub2API Backend Contracts Consumed by Frontend

> Source: `frontend/src/api/**/*.ts` (764-file inventory) + `backend/internal/server/routes/*.go` + `backend/internal/handler/*.go`
> Base URL: `VITE_API_BASE_URL` defaults to `/api/v1` (same-origin), cross-origin via absolute URL + `CORS.allowed_origins`
> Envelope: `{ code: 0, message, data }` unwrapped in `api/client.ts`; errors normalized to `{ status, code, message, reason, metadata }`

## 1. Auth (`/api/v1/auth`)

| Method | Path | Frontend caller |
|--------|------|-----------------|
| POST | `/auth/register` | `api/auth.ts: register` |
| POST | `/auth/login` | `api/auth.ts: login` |
| POST | `/auth/login/2fa` | `api/auth.ts: login2FA` |
| POST | `/auth/passkey/login/begin` | `api/passkey.ts` |
| POST | `/auth/passkey/login/finish` | `api/passkey.ts` |
| POST | `/auth/send-verify-code` | `api/auth.ts` |
| POST | `/auth/refresh` | `api/tokenRefresh.ts` (withCredentials, dedup polling) |
| POST | `/auth/logout` | `api/auth.ts` |
| POST | `/auth/validate-promo-code` | `api/auth.ts` |
| POST | `/auth/validate-invitation-code` | `api/auth.ts` |
| POST | `/auth/forgot-password` | `api/auth.ts` |
| POST | `/auth/reset-password` | `api/auth.ts` |
| GET | `/auth/oauth/linuxdo/start` + POST | `composables/useOAuth` |
| GET | `/auth/oauth/github/start` + POST, `GET /callback`, `POST /complete-registration` | `api/auth.ts` |
| GET | `/auth/oauth/google/start` + POST, `GET /callback`, `POST /complete-registration` | `api/auth.ts` |
| GET | `/auth/oauth/wechat/start` + POST, `GET /callback`, `GET /payment/start` `GET /payment/callback` | `api/auth.ts` |
| GET | `/auth/oauth/oidc/start` + POST, `GET /callback`, `POST /complete-registration` | `api/auth.ts` |
| GET | `/auth/oauth/dingtalk/start` + POST, `GET /callback`, `GET /bind/start` | `api/auth.ts` |
| POST | `/auth/oauth/pending/exchange` `POST /send-verify-code` `POST /create-account` `POST /bind-login` | `api/auth.ts: pending OAuth flow` |

## 2. User (`/api/v1/user`)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/user/profile` PUT `""` PUT `/password` | `api/user.ts` |
| GET | `/user/aff` POST `/aff/transfer` | affiliate quota |
| POST | `/user/account-bindings/email/send-code` `POST /email` `DELETE /:provider` `POST /auth-identities/bind/start` | identity bindings |
| GET | `/user/api-keys/:id/usage/daily` | `Heavy()` rate limit |
| GET | `/user/platform-quotas` | `api/user.ts` |
| /notify-email `POST /send-code` `POST /verify` `PUT /toggle` `DELETE` | notify email |
| /totp `GET /status` `GET /verification-method` `POST /send-code` `POST /setup` `POST /enable` `POST /disable` `POST /step-up` | 2FA |
| /passkeys `GET` `POST /register/begin` `POST /register/finish` `DELETE /:id` | WebAuthn |
| /api-keys `GET` `GET /:id` `POST` `PUT /:id` `DELETE /:id` | `api/keys.ts` |
| /groups `GET /available` `GET /rates` | `api/groups.ts` |
| /available-channels `GET /available` | `api/channels.ts` |
| /usage `GET ""` `GET /errors` `GET /errors/:id` `GET /:id` `GET /stats` `GET /dashboard/*` `POST /dashboard/api-keys-usage` | `api/usage.ts` |
| /announcements `GET ""` `POST /:id/read` | `api/announcements.ts` |
| /redeem `POST ""` `GET /history` | `api/redeem.ts` |
| /subscriptions `GET ""` `GET /active` `GET /progress` `GET /summary` | `api/subscriptions.ts` |
| /channel-monitors `GET ""` `GET /:id/status` + `/monitor-v2/*` (`/dimensions` `/snapshot` `/models` `/matrix` `/errors` `/users`) | `api/channelMonitor*.ts` |
| /model-plaza `GET /models` `GET /groups` (optional JWT) | `api/modelPlaza.ts` |
| `GET /settings/public` `GET /settings/wechat-connect` `GET /setup/status` | `api/setup.ts`, `api/auth.ts` (public config injection) |

## 3. Admin (`/api/v1/admin`)

Grouped via `registerGroupRoutes` etc. Key domains:

- **users** `GET ""` `GET /:id` `POST` `PUT /:id` `DELETE /:id` `POST /batch` + attributes `GET /attributes` (→ `api/admin/users.ts`)
- **groups** `GET` `POST` `PUT /:id` `DELETE` + duplicate guard via `sessionStorage` key `sub2api:admin:group-duplicate:*`
- **channels** `GET` `POST` `PUT /:id` `DELETE` + `GET /pricing` CN providers, `api/admin/channels.ts` `cnProviders.ts`
- **accounts** `GET` `POST` `PUT` `DELETE` `POST /batch` `GET /available-models` `POST / OllamaCloudUsage` probe + duplicate guard
- **channel-monitor** `GET` `POST` `PUT` `DELETE` `GET /template` + V2 aggregator
- **subscriptions** `GET` `POST` `PUT` `DELETE` `GET /plans`
- **announcements** `GET` `POST` `PUT` `DELETE`
- **proxies** `GET` `POST` `PUT` `DELETE`
- **redeem** `GET` `POST` `PUT` `DELETE` `POST /batch`
- **promo** `GET` `POST` `PUT` `DELETE`
- **settings** `GET` `PUT` (payment methods `alipay|wxpay` × `official|easypay`, WeChat mode `open|mp`)
- **risk-control** `GET /config` `PUT /config` `POST /api-keys/test` `GET /status` `GET /logs` `POST /users/:id/unban`
- **prompt-audit** `GET /config` `PUT /config` `POST /endpoints/probe` `GET /runtime` `GET /events` `GET /events/:id` `DELETE` `POST /batch-delete`
- **audit-logs** `GET ""` `GET /:id` `POST /clear`
- **compliance** `GET ""` `POST /accept`
- **api-keys** `PUT /:id` (updateGroup)
- **ops** `GET /concurrency` `GET /user-concurrency` `GET /account-availability` `GET /realtime-traffic` + alert rules/events + runtime logging + ws `/ws/qps` + errors `GET /errors` + system-logs + `dashboard/*` (snapshot-v2, overview, throughput-trend, latency-histogram, error-trend, token-stats)
- **dashboard** `GET /snapshot-v2` `GET /stats` `GET /realtime` `GET /trend` `GET /models` `GET /groups`

## 4. Gateway (API consumption, not frontend console)

`POST /v1/chat/completions`, `/v1/embeddings`, `/v1/images/*`, `/v1/videos/*`, `POST /v1/messages`, `POST /v1/responses`, `GET /v1/models`, `GET /v1/usage`, `POST /v1/live` etc. — authenticated via `X-API-Key`/`Authorization: Bearer sk-*`, not console JWT. Frontend only calls `/v1` via dev proxy; console does not invent gateway contracts.

## 5. Payment (`/api/v1/payment` + webhooks)

`POST /payment/create` `GET /payment/orders` `GET /payment/orders/:id` `GET /payment/plans` + webhook `POST /payment/webhook/stripe` `POST /payment/webhook/airwallex` — providers: **Stripe**, **Airwallex**, **Alipay (official/easypay via EasyPay)**, **WeChat Pay (official/easypay)**. QR poll via order status, popup flow for Stripe/Airwallex. `Airwallex components-sdk` + `@stripe/stripe-js` only on payment routes (lazy vendor chunk).

## Transport Invariants

- `withCredentials: true`, `Authorization: Bearer <auth_token>` (localStorage), `Accept-Language` (i18n), `X-UI-Request` headers for admin/user.
- 401 → single-flight refresh via `tokenRefresh.ts` (peer poll `PEER_REFRESH_POLL_MS`), failure clears `auth_token`+`refresh_token`.
- All GETs append `?timezone=` (Intl).
