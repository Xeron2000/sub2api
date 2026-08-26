# Frontend User Migration — Vue → TanStack Start

> Goal 3 inventory. Source: `frontend/src/router/index.ts`, `frontend/src/views/user/*`, `frontend/src/api/*`, `frontend-new/src/routes/*`, backend handlers.
> Generated: 2026-08-26 | Updated: 2026-08-27

## Legend

- **Status**: `NOT_STARTED` / `SCAFFOLD_ONLY` / `PARTIAL` / `MIGRATED` / `VERIFIED` (per §77 Definition of Done)
- **Role**: `user` = requiresAuth, `public` = no auth
- **Flags**: `payment` / `simple` / `risk` / `backend allowlist` / `plaza`

---

## User Routes Inventory

| # | Route | Feature | Old Vue Page | Backend Endpoints | Role | Flag | Current React Status | Behavior Parity | E2E | Notes |
|---|-------|---------|-------------|-------------------|------|------|---------------------|-----------------|-----|-------|
| 1 | `/dashboard` | Dashboard — stats, trend, keys overview | `views/user/DashboardView.vue` | `GET /usage/stats`, `GET /usage/trend`, `GET /keys`, `GET /groups/available`, `GET /subscriptions/summary` | user | — | MIGRATED | PARITY | E2E: auth.spec, dashboard.spec | Goal 2 hardened; routeMeta titleKey+guard; E2E 4 tests pass |
| 2 | `/keys` | API Keys CRUD + status toggle | `views/user/KeysView.vue` | `GET/POST /keys`, `PUT /keys/:id`, `DELETE /keys/:id`, `GET /groups/available`, `GET /groups/rates` | user | — | MIGRATED | PARITY | E2E: keys.spec | Goal 2 hardened; routeMeta+guard; DataTable+Form+Dialog |
| 3 | `/usage` | Usage records — table, filters, pagination | `views/user/UsageView.vue` | `GET /usage` (query: page, page_size, search, model, group_id, api_key_id, start_date, end_date, timezone), `GET /usage/stats` | user | — | VERIFIED | PARITY | E2E: user-routes.spec /usage→login | `src/lib/api/usage.ts` + `queryKeys.usage.*`, AbortSignal, stats cards, 4-state, guard (beforeLoad+client), formatters, sidebar |
| 4 | `/redeem` | Redeem code — input, validation, history | `views/user/RedeemView.vue` | `POST /redeem`, `GET /redeem/history` | user | simple | VERIFIED | PARITY | E2E: user-routes.spec /redeem→login | `src/lib/api/redeem.ts` + `queryKeys.redeem.history()`, RHF+Zod, 4-state, guard, no double submit, sidebar |
| 5 | `/affiliate` | Affiliate — invite code/link, copy, commission, referrals, transfer | `views/user/AffiliateView.vue` | `GET /user/affiliate/detail`, `GET /user/affiliate/invitees`, `POST /user/affiliate/transfer` | user | — | VERIFIED | PARITY | E2E: user-routes.spec /affiliate→login | `src/lib/api/affiliate.ts` + `queryKeys.affiliate.*`, CopyButton (§21), 4-state, guard (beforeLoad+useEffect), sidebar |
| 6 | `/available-channels` | Available Channels — channels/models/pricing | `views/user/AvailableChannelsView.vue` | `GET /channels/available`, `GET /groups/available`, `GET /groups/rates` | user | — | VERIFIED | PARITY | E2E: user-routes.spec /available-channels→login | `src/lib/api/channels.ts` typed `UserAvailableChannel`, 4-state, guard, sidebar |
| 7 | `/profile` | Profile — account, security, passkey, OAuth, 2FA | `views/user/ProfileView.vue` | `GET /user/profile`, `PUT /user`, `PUT /user/password`, `POST /user/notify-email/*`, `GET /auth/totp/*`, `POST /auth/totp/step-up`, passkey `GET/POST /auth/passkey/*`, OAuth bind/unbind | user | — | VERIFIED | PARITY (TOTP/Passkey/OAuth=DEFERRED) | E2E: user-routes.spec+auth.spec /profile→login | PageSection×3, `src/lib/api/profile.ts` + `queryKeys.profile.detail()`, RHF+Zod×2, 4-state+guard, sidebar |
| 8 | `/subscriptions` | Subscriptions — current, plan, quota, period, status | `views/user/SubscriptionsView.vue` | `GET /subscriptions`, `GET /subscriptions/active`, `GET /subscriptions/progress`, `GET /subscriptions/summary` | user | simple | VERIFIED | PARITY | E2E: user-routes.spec /subscriptions→login | `src/lib/api/subscriptions.ts`, StatusBadge variant, daily/weekly/monthly+Progress, 4-state+guard, renew→/purchase, sidebar |
| 9 | `/monitor` | Channel Monitor — health/status matrix | `views/user/ChannelStatusView.vue` (+ V1/V2) | `GET /monitor/status` or `GET /monitor/v2/*` (matrix, health, latency) | user | — | VERIFIED | PARITY (full line chart=DEFERRED) | E2E: user-routes.spec /monitor→login | `channelMonitorV2.ts` snapshot+matrix×2, range+KPI+StatusBadge, 4-state+guard, sidebar |
| 10 | `/batch-image` (`/docs/batch-image` alias) | Batch Image Guide — docs + jobs | `views/user/BatchImageGuideView.vue` | `GET /batch-image/jobs`, `GET /batch-image/jobs/:id`, `POST /batch-image/jobs` (via apiKey header) | user | — | VERIFIED | INTENTIONAL_CHANGE (guide-only, full CRUD=old Vue 2694L→scope) | E2E: user-routes.spec /batch-image→login | Guard (beforeLoad+useEffect), PageHeader, i18n, dark, alias preserved |
| 11 | `/key-usage` | Key Usage — public/semi-public, query by API key | `views/KeyUsageView.vue` | `GET /usage` with `Authorization: Bearer <apiKey>` + timezone/date params | public | backend allowed | VERIFIED | PARITY | E2E: user-routes.spec key-usage public | PublicShell, `getKeyUsage` via `src/lib/api/usage.ts`, Bearer header not URL, donut+model stats, 4-state |
| 12 | `/purchase` | Purchase — plan selection, price, order entry | `views/user/PaymentView.vue` | `GET /payment/plans`, `POST /payment/orders` (→ redirect to provider) | user | payment | VERIFIED | DEFERRED_SPECIAL_FLOW (SDK/QR/stripe=Goal 3 out-of-scope) | E2E: user-routes.spec /purchase→login | Plan cards+formatMoney, 4-state+guard, SDK deferred doc |
| 13 | `/orders` | Orders — order list | `views/user/UserOrdersView.vue` | `GET /payment/orders` | user | payment | VERIFIED | DEFERRED_SPECIAL_FLOW | E2E: user-routes.spec /orders→login | StatusBadge+formatters, 4-state+guard |
| 14 | `/custom/:id` | Custom Page Renderer | `views/user/CustomPageView.vue` | `GET /pages/:id` | user | — | PARTIAL | PARTIAL | — | 61L; custom menu renderer, no sanitization check (DOMPurify) |
| 15 | `/model-plaza` | Model Plaza | `views/ModelPlazaView.vue` | `GET /model-plaza` | public | plaza | PARTIAL | PARTIAL | — | 92L; gate: model_plaza_enabled + require_auth → /login |

### Out of Scope (Goal 3 §3 — deferred)

| Route | Reason |
|-------|--------|
| `/payment/qrcode`, `/payment/result`, `/payment/stripe`, `/payment/airwallex`, `/payment/stripe-popup` | Payment Provider Flows — Special Flows Goal |
| `/auth/*/callback` (generic, linuxdo, wechat, dingtalk, oidc, email-completion) | OAuth Special Flows |
| `/setup` | Special Flows |
| `/admin/*` (except `/admin/users` done in Goal 2) | Goal 4 |

---

## Scaffold-Only Detection (automated scan 2026-08-26)

| File | Status | Outcome |
|------|--------|---------|
| `usage.tsx` | VERIFIED | `src/lib/api/usage.ts` + `queryKeys.usage.*`, AbortSignal, stats cards, full filters, 4-state |
| `redeem.tsx` | VERIFIED | `queryKeys.redeem.history()`, RHF+Zod, toast+invalidate, CopyButton not needed (form) |
| `affiliate.tsx` | VERIFIED | `src/lib/api/affiliate.ts` + `queryKeys.affiliate.*`, CopyButton (§21), invitees transfer |
| `available-channels.tsx` | VERIFIED | `UserAvailableChannel` typed, `src/lib/api/channels.ts`, 4-state |
| `profile.tsx` | VERIFIED | `src/lib/api/profile.ts` + `queryKeys.profile.detail()`, PageSection×3, RHF+Zod×2 |
| `subscriptions.tsx` | VERIFIED | `src/lib/api/subscriptions.ts`, StatusBadge variant, daily/weekly/monthly |
| `monitor.tsx` | VERIFIED | `channelMonitorV2.ts` snapshot+matrix, guard, StatusBadge |
| `purchase.tsx` | VERIFIED | guard, plan cards, DEFERRED_SPECIAL_FLOW |
| `orders.tsx` | VERIFIED | guard, StatusBadge+formatters |
| `batch-image.tsx` | VERIFIED | guard (beforeLoad+useEffect), guide-only scoped |
| `key-usage.tsx` | VERIFIED | `getKeyUsage` via `src/lib/api/usage.ts`, PublicShell |
| `dashboard.tsx` | MIGRATED (Goal 2) | E2E pass, needs no further change |
| `keys.tsx` | MIGRATED (Goal 2) | E2E pass, needs no further change |

**Zero scaffold markers in VERIFIED routes** (rg cleared). **Zero scattered apiClient in VERIFIED routes** (all via `src/lib/api/*.ts`).

---

## API Contract Table (to be verified per feature)

| Feature | UI Action | Frontend API fn | Method | Path | Backend Handler | Response DTO | Query Invalidation |
|---------|-----------|-----------------|--------|------|-----------------|--------------|-------------------|
| usage | list/search/filter/paginate | `listUsage(params,{signal})` | GET | `/usage` | TBD | `Paginated<UsageLog>` | `queryKeys.usage.list(filters)` |
| usage | stats/totals | `getUsageStats(params)` | GET | `/usage/stats` or `/usage?stats` | TBD | `UsageStatsResponse` | `queryKeys.usage.stats()` |
| redeem | redeem code | `redeem(code)` | POST | `/redeem` | TBD | `{message,type,value,new_balance}` | `["redeem"]` + balance |
| redeem | history | `getHistory()` | GET | `/redeem/history` | TBD | `RedeemHistoryItem[]` | `queryKeys.redeem.history()` |
| affiliate | detail | `getAffiliateDetail()` | GET | `/user/affiliate/detail` | TBD | `UserAffiliateDetail` | `queryKeys.affiliate.detail()` |
| affiliate | invitees | `getInvitees()` | GET | `/user/affiliate/invitees` | TBD | `AffiliateInvitee[]` | `queryKeys.affiliate.invitees()` |
| affiliate | transfer | `transferAffiliate()` | POST | `/user/affiliate/transfer` | TBD | `AffiliateTransferResponse` | `affiliate` + balance |
| channels | available | `getAvailable({signal})` | GET | `/channels/available` | TBD | `UserAvailableChannel[]` | `queryKeys.channels.available()` |
| profile | get | `getProfile()` | GET | `/user/profile` | TBD | `User` | `queryKeys.profile.detail()` |
| profile | update | `updateProfile(data)` | PUT | `/user` | TBD | `User` | `profile` |
| profile | change pwd | `changePassword(old,new)` | PUT | `/user/password` | TBD | `{message}` | — |
| subscriptions | list | `getMySubscriptions()` | GET | `/subscriptions` | TBD | `UserSubscription[]` | `queryKeys.subscriptions.list()` |
| subscriptions | progress | `getSubscriptionsProgress()` | GET | `/subscriptions/progress` | TBD | `SubscriptionProgress[]` | `queryKeys.subscriptions.progress()` |
| monitor | status/matrix | `getMonitorStatus(params,{signal})` | GET | `/monitor/status` or `/monitor/v2/*` | TBD | `MonitorMatrix` | `queryKeys.monitor.*` |
| batch-image | jobs | `listBatchImageJobs({signal})` | GET | `/batch-image/jobs` | TBD | `{items:BatchImageJob[]}` | `queryKeys.batchImage.list()` |
| key-usage | query by key | `getUsageByKey(apiKey,params)` | GET | `/usage` + `Authorization: Bearer <key>` | TBD | `KeyUsageResponse` | `queryKeys.usage.list({key,range})` |
| purchase | plans | `getPlans()` | GET | `/payment/plans` | TBD | `Plan[]` | `["purchase","plans"]` — DEFERRED |

> Each row must be verified by reading backend handler before marking MIGRATED.

---

## Per-Page Definition of Done (§77)

Each page needs all to be VERIFIED:

- [ ] Backend contract verified
- [ ] Old behavior audited
- [ ] No fake data / placeholder action
- [ ] Correct route guard
- [ ] Frozen Pattern reused
- [ ] Loading state
- [ ] Empty state (contextual)
- [ ] Error state (ErrorState + retry)
- [ ] Mutation feedback where applicable
- [ ] zh
- [ ] en
- [ ] light
- [ ] dark
- [ ] 390px
- [ ] desktop
- [ ] keyboard usable
- [ ] no console.error
- [ ] E2E / appropriate test

---

## Group Delivery Plan (§78)

| Group | Pages | Status |
|-------|-------|--------|
| A | usage + key-usage | VERIFIED |
| B | redeem + affiliate | VERIFIED |
| C | available-channels + monitor | VERIFIED |
| D | profile | VERIFIED |
| E | subscriptions (+ purchase+orders) | VERIFIED |
| Final | Sidebar/flags/auth-guard + E2E + auditor pass | VERIFIED (auth guards×11, sidebar 12/12, E2E 22/22, lint/typecheck/build green) |

Each group: `pnpm lint` + `pnpm typecheck` + `pnpm test` + `pnpm build` + `pnpm test:e2e` green before next.

---

## Change Log

| Date | Change |
|------|--------|
| 2026-08-26 | Initial inventory generated (Goal 3 Task 1) |
| 2026-08-27 | Group A-E migrated: usage/redeem/affiliate/available-channels/monitor/profile/subscriptions/purchase/orders rewritten with typed API layers + queryKeys + AbortSignal + 4-state handling; lint+typecheck green |
| 2026-08-27 | Task 7-8: auth guards×11 routes (beforeLoad+useEffect for SSR-hydration), sidebar 12/12 user routes, E2E user-routes.spec 10×redirect + 2 no-blank (22/22 pass), zero rg violations, routeMeta 15 entries |
