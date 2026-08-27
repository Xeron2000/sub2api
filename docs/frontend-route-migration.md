# Frontend Route Migration — Vue → TanStack Start

> Source: `frontend/src/router/index.ts` (72 routes) → `frontend-new/src/routes/**` (file-based)
> Principle: **Keep URL compatible** — existing bookmarks/docs must not break. New route = old route unless noted.
> Generated: 2026-08-26

## Legend

- **Role**: `public` (no auth) / `user` (requiresAuth) / `admin` (requiresAdmin) / `system`
- **Flags**: `payment` = `requiresPayment && payment_enabled`, `risk` = `requiresRiskControl && risk_control_enabled`, `simple` = simple-mode blocked, `backend` = backendMode allowlist, `plaza` = `model_plaza_enabled`
- **Status**: `[ ] Not Started` / `[~] In Progress` / `[x] Migrated` / `[x] Verified` (loading/empty/error + query + light/dark + 390/1440)
- All new routes use TanStack Router `createFileRoute()`; file path mirrors URL (e.g. `/admin/users` → `routes/admin/users.tsx`).

---

## Setup

| Old Route | New Route | Role | Flags | Status | Notes |
|-----------|-----------|------|-------|--------|-------|
| `/setup` | `/setup` | public | — | [ ] Not Started | SetupWizard — DB/Redis/admin install; guard checks `getSetupStatus()` |

## Public (no auth)

| Old Route | New Route | Role | Flags | Status | Notes |
|-----------|-----------|------|-------|--------|-------|
| `/home` | `/home` | public | — | [ ] Not Started | Landing |
| `/login` | `/login` | public | — | [ ] Not Started | **Rep A** — RHF+Zod, OAuth buttons, TOTP, captcha. Redirect authed → /dashboard or /admin/dashboard (backendMode: non-admin stays on /login) |
| `/register` | `/register` | public | — | [ ] Not Started | Email code + captcha |
| `/email-verify` | `/email-verify` | public | backend pending | [ ] Not Started | — |
| `/auth/callback` (alias `/auth/oauth/callback`) | `/auth/callback` | public | backend callback | [ ] Not Started | Generic OAuth |
| `/auth/linuxdo/callback` | `/auth/linuxdo/callback` | public | backend callback | [ ] Not Started | — |
| `/auth/wechat/callback` | `/auth/wechat/callback` | public | backend callback | [ ] Not Started | — |
| `/auth/wechat/payment/callback` | `/auth/wechat/payment/callback` | public | backend callback | [ ] Not Started | WeChat Pay resume |
| `/auth/dingtalk/callback` | `/auth/dingtalk/callback` | public | backend callback | [ ] Not Started | — |
| `/auth/dingtalk/email-completion` | `/auth/dingtalk/email-completion` | public | backend callback | [ ] Not Started | DingTalk email bind |
| `/auth/oidc/callback` | `/auth/oidc/callback` | public | backend callback | [ ] Not Started | — |
| `/forgot-password` | `/forgot-password` | public | — | [ ] Not Started | — |
| `/reset-password` | `/reset-password` | public | — | [ ] Not Started | — |
| `/key-usage` | `/key-usage` | public | backend allowed | [ ] Not Started | Public doc, backendMode allowed |
| `/legal/:documentId` | `/legal/$documentId` | public | backend allowed | [ ] Not Started | TanStack param `$documentId` |
| `/model-plaza` | `/model-plaza` | public | plaza | [ ] Not Started | Gate: `model_plaza_enabled===false` → redirect; `require_auth===true` → /login |
| `/:pathMatch(.*)*` | `/$splat` | system | — | [ ] Not Started | 404 → `NotFoundView` |

## User (requiresAuth, !requiresAdmin)

| Old Route | New Route | Role | Flags | Status | Notes |
|-----------|-----------|------|-------|--------|-------|
| `/` → `/home` | `/` → `/home` | public | — | [ ] Not Started | Redirect |
| `/dashboard` | `/dashboard` | user | — | [ ] Not Started | **Rep B** — stats/trend/keys overview |
| `/keys` | `/keys` | user | — | [ ] Not Started | **Rep C (data-heavy)** — key CRUD, tatus toggle. Alternative rep if /usage not ready |
| `/batch-image` (alias `/docs/batch-image`) | `/batch-image` | user | — | [ ] Not Started | Keep alias via redirect `/docs/batch-image` → `/batch-image` |
| `/usage` | `/usage` | user | — | [ ] Not Started | **Rep C** — usage table + filters + pagination |
| `/redeem` | `/redeem` | user | simple | [ ] Not Started | Simple-mode blocked |
| `/affiliate` | `/affiliate` | user | — | [ ] Not Started | — |
| `/available-channels` | `/available-channels` | user | — | [ ] Not Started | — |
| `/profile` | `/profile` | user | — | [ ] Not Started | TOTP/passkey/bindings |
| `/subscriptions` | `/subscriptions` | user | simple | [ ] Not Started | Simple-mode blocked |
| `/purchase` | `/purchase` | user | payment | [ ] Not Started | Plans → checkout |
| `/orders` | `/orders` | user | payment | [ ] Not Started | Order list |
| `/payment/qrcode` | `/payment/qrcode` | user | payment | [ ] Not Started | — |
| `/payment/result` | `/payment/result` | public | — | [ ] Not Started | Public verify (no auth) |
| `/payment/stripe` | `/payment/stripe` | public | — | [ ] Not Started | Stripe hosted (client-only, SSR boundary) |
| `/payment/airwallex` | `/payment/airwallex` | public | — | [ ] Not Started | Airwallex (client-only) |
| `/payment/stripe-popup` | `/payment/stripe-popup` | public | — | [ ] Not Started | Popup helper |
| `/custom/:id` | `/custom/$id` | user | — | [ ] Not Started | Custom menu renderer |
| `/monitor` | `/monitor` | user | — | [ ] Not Started | User-facing channel status |

## Admin (requiresAdmin)

| Old Route | New Route | Role | Flags | Status | Notes |
|-----------|-----------|------|-------|--------|-------|
| `/admin` → `/admin/dashboard` | `/admin` → `/admin/dashboard` | admin | — | [ ] Not Started | Redirect |
| `/admin/dashboard` | `/admin/dashboard` | admin | — | [ ] Not Started | Admin stats |
| `/admin/ops` | `/admin/ops` | admin | — | [ ] Not Started | OpsDashboard (V2 monitor) |
| `/admin/audit-logs` | `/admin/audit-logs` | admin | — | [ ] Not Started | — |
| `/admin/users` | `/admin/users` | admin | — | [ ] Not Started | **Rep D (dense admin)** — dense table + search + CRUD |
| `/admin/groups` | `/admin/groups` | admin | simple | [ ] Not Started | Simple-mode blocked |
| `/admin/channels` → `/admin/channels/pricing` | `/admin/channels` → `/admin/channels/pricing` | admin | — | [ ] Not Started | Redirect |
| `/admin/channels/pricing` | `/admin/channels/pricing` | admin | — | [ ] Not Started | — |
| `/admin/channels/monitor` | `/admin/channels/monitor` | admin | — | [ ] Not Started | Legacy monitor |
| `/admin/subscriptions` | `/admin/subscriptions` | admin | simple | [ ] Not Started | Simple-mode blocked |
| `/admin/accounts` | `/admin/accounts` | admin | — | [ ] Not Started | Upstream accounts (40+ ops) |
| `/admin/announcements` | `/admin/announcements` | admin | — | [ ] Not Started | — |
| `/admin/proxies` | `/admin/proxies` | admin | — | [ ] Not Started | — |
| `/admin/redeem` | `/admin/redeem` | admin | simple | [ ] Not Started | Simple-mode blocked |
| `/admin/promo-codes` | `/admin/promo-codes` | admin | — | [ ] Not Started | — |
| `/admin/settings` | `/admin/settings` | admin | — | [ ] Not Started | System settings |
| `/admin/risk-control` | `/admin/risk-control` | admin | risk | [ ] Not Started | — |
| `/admin/prompt-audit` | `/admin/prompt-audit` | admin | risk | [ ] Not Started | `features/prompt-audit` moved to `routes/admin/prompt-audit.tsx` |
| `/admin/usage` | `/admin/usage` | admin | — | [ ] Not Started | — |
| `/admin/affiliates` → `/admin/affiliates/invites` | `/admin/affiliates` → `/admin/affiliates/invites` | admin | — | [ ] Not Started | Redirect |
| `/admin/affiliates/invites` | `/admin/affiliates/invites` | admin | — | [ ] Not Started | — |
| `/admin/affiliates/rebates` | `/admin/affiliates/rebates` | admin | — | [ ] Not Started | — |
| `/admin/affiliates/transfers` | `/admin/affiliates/transfers` | admin | — | [ ] Not Started | — |
| `/admin/orders/dashboard` | `/admin/orders/dashboard` | admin | payment | [ ] Not Started | — |
| `/admin/orders` | `/admin/orders` | admin | payment | [ ] Not Started | — |
| `/admin/orders/plans` | `/admin/orders/plans` | admin | payment | [ ] Not Started | — |

## Notes for TanStack Migration

- Keep exact path spelling (kebab-case). Use file-based routing: `routes/(public)/login.tsx`, `routes/(auth)/dashboard.tsx`, `routes/admin/users.tsx`, etc. Layout groups `(public)`/`(auth)` are for shell selection only, not URL.
- SSR boundaries: `window`/`localStorage`/`Stripe`/`Airwallex`/`QR` must be behind `clientOnly` / `useEffect` / dynamic import. Use `typeof window !== 'undefined'` guard.
- Guard parity: replicate `router.beforeEach` logic in TanStack `beforeLoad` (auth/admin/payment/risk/simple/backend/plaza). Fetch `publicSettings` first when gated flag present (fail-closed only when `loaded && enabled===false`).
- ChunkError handling: keep `onError` reload pattern adapted to TanStack Router.
- Representative pages for Phase 0-8 (must be `[x] Verified` to exit this goal): `/login` (Auth), `/dashboard` (User), `/usage` or `/keys` (Data-heavy), `/admin/users` (Admin dense). Other routes remain `[ ] Not Started` — migrated later via `/list`.
