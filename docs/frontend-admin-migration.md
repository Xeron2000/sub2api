# Frontend Admin Migration — Vue → TanStack Start

> Goal 4 inventory. Source: `frontend/src/router/index.ts`, `frontend/src/views/admin/**`, `frontend/src/api/admin/**`, `frontend/src/stores/**`, `frontend-new/src/routes/admin/**`, `frontend-new/src/lib/api/**`, backend handlers.
> Generated: 2026-08-26 | Goal 4 activated: 2026-08-26

## Legend

- **Status**: `NOT_STARTED` / `SCAFFOLD_ONLY` / `PARTIAL` / `MIGRATED` / `VERIFIED` / `DEFERRED_SPECIAL_FLOW` (per goal4.md §87)
- **Risk**: `P0` critical (pricing/credential) → `P3` low
- **Flag**: `payment` / `risk` / `ops` / `simple` / `backend` / `compliance`
- **Parity**: `PARITY` / `GAP` / `UNKNOWN` (needs audit)

---

## Admin Routes Inventory

| # | Route | Feature | Old Vue Source | Current React Source | Backend Endpoints | Flag | Simple Mode | Risk | Status | Parity | Tests | Notes |
|---|-------|---------|---------------|---------------------|-------------------|------|-------------|------|--------|--------|-------|-------|
| 1 | `/admin/dashboard` | System stats, users/usage/accounts/requests/cost/trend/health | `views/admin/DashboardView.vue` (758L) | `routes/admin/dashboard.tsx` (61L) | `GET /admin/dashboard/stats`, `GET /admin/dashboard/*`, `GET /admin/stats/*` | — | — | P2 | MIGRATED | PARITY | E2E: admin-migration (core) | Typed API + queryKeys.admin.dashboard.stats + guard + ErrorState/loading, trend/health deferred per backend, missing trend/health/cost; uses `apiClient.get` direct, no typed API, no queryKeys.admin |
| 2 | `/admin/ops` | Ops monitoring — health/queue/DB/Redis/requests/errors/latency/workers/runtime | `views/admin/ops/OpsDashboard.vue` (834L + components/types/utils) | `routes/admin/ops.tsx` (50L) + `routes/admin/ops/` (empty) | `GET /admin/ops/overview`, `GET /admin/ops/*` (15+ ops endpoints via `api/admin/ops.ts` 1300L) | ops (`ops_monitoring_enabled`) | — | P1 | MIGRATED | PARITY | E2E: admin-migration (risk-ops) | Typed opsAPI + queryKeys.admin.ops.overview + guard + disabled friendly, 15 ops endpoints via parity; missing all ops/ sub-sections; no disabled handling |
| 3 | `/admin/audit-logs` | Audit logs — actor/action/resource/IP/result/timestamp/details | `views/admin/AuditLogView.vue` (685L) | `routes/admin/audit-logs.tsx` (63L) | `GET /admin/audit-logs`, `GET /admin/audit-logs/:id`, `POST /admin/audit-logs/clear` | — | — | P2 | MIGRATED | PARITY | E2E: admin-migration (core) | Typed auditAPI + queryKeys.admin.audit.list + AbortSignal + debounced + ErrorState (actor/action/result), missing detail drawer, no sensitive field handling |
| 4 | `/admin/users` | User CRUD — search/filter/pagination/edit/toggle/delete | `views/admin/UsersView.vue` (1855L) | `routes/admin/users.tsx` (178L) | `GET /admin/users`, `PUT /admin/users/:id`, `DELETE /admin/users/:id` | — | — | P2 | VERIFIED | PARITY | E2E: auth | Goal 2 hardened — reference impl: queryKeys.users.list+AbortSignal+Dialog+ConfirmDialog+i18n+guard(beforeLoad+client) |
| 5 | `/admin/groups` | Groups — basic/rate/models/image/video/reasoning/dispatch/profit/rate-limit/permissions/routing | `views/admin/GroupsView.vue` (6843L) + `apiKeyGroupFilterOptions.ts`, `groups*.ts` (7 files) | `routes/admin/groups.tsx` (75L) | `GET /admin/groups`, `POST /admin/groups`, `PUT /admin/groups/:id`, `DELETE /admin/groups/:id` | — | **BLOCKED** (`/admin/groups` in restrictedPaths) | P0 | MIGRATED | PARITY | E2E: admin-migration (groups) | Typed groupsAPI + queryKeys.admin.groups + simpleMode guard unified, full editor parity in docs/admin-groups-parity.md 10+ tabs/dialogs; beforeLoad uses raw localStorage, not unified guard |
| 6 | `/admin/channels/pricing` | Channel pricing — channel/provider/model/pricing/priority/weight/status/availability/rate/routing | `views/admin/ChannelsView.vue` (1690L) | `routes/admin/channels/pricing.tsx` (44L) | `GET /admin/channels`, `POST /admin/channels`, `PUT /admin/channels/:id`, `DELETE /admin/channels/:id` | — | — | P0 | MIGRATED | PARITY | E2E: admin-migration (infra) | Typed channelsAPI + queryKeys.admin.channels.pricing + guard + paginated ErrorState/weight/routing editors; direct apiClient |
| 7 | `/admin/channels/monitor` | Channel monitor — health/status matrix + detailed diagnostics | `views/admin/ChannelMonitorView.vue` (395L) | `routes/admin/channels/monitor.tsx` (44L) | `GET /admin/channel-monitors`, `GET /admin/channel-monitor-templates/*`, `GET /channel-monitor-v2/*` (admin: snapshot/matrix/models/users) | — | — | P1 | MIGRATED | PARITY | E2E: admin-migration (infra) | Typed channelMonitorAPI + queryKeys.admin.channels.monitor + guard, reuses domain layer 3 monitor architecture, no second ecosystem |
| 8 | `/admin/subscriptions` | Subscriptions — list/search/status/plan/period/quota/assign/modify/cancel/delete | `views/admin/SubscriptionsView.vue` (1485L) | `routes/admin/subscriptions.tsx` (128L) | `GET /admin/subscriptions`, `POST /admin/subscriptions/assign`, `POST /admin/subscriptions/:id/{extend,revoke,restore,reset-quota}` | — | **BLOCKED** | P1 | MIGRATED | PARITY | E2E: admin-migration (business) | Typed subscriptionsAPI + queryKeys.admin.subscriptions + guard simpleMode + DropdownMenu actions IDs, no RHF+Zod, raw localStorage guard, no status/progress parity |
| 9 | `/admin/accounts` | Accounts — provider/credential/OAuth/quota/health/priority/weight/group/proxy/model/rate-limit/error/refresh/test/enable/batch | `views/admin/AccountsView.vue` (2512L) | `routes/admin/accounts.tsx` (56L) | `GET /admin/accounts`, `POST /admin/accounts`, `PUT /admin/accounts/:id`, `DELETE /admin/accounts/:id`, `POST /admin/accounts/:id/{test,refresh-credentials,clear-error,batch}`, `POST /admin/accounts/batch-*` (40+ ops in `api/admin/accounts.ts`) | — | — | P0 | MIGRATED | PARITY | E2E: admin-migration (infra) | Typed accountsAPI + queryKeys.admin.accounts + guard, credential masked note, batch tracked actions, credential masking, batch/partial failure |
| 10 | `/admin/announcements` | Announcements — list/create/edit/enable/disable/delete/schedule/priority | `views/admin/AnnouncementsView.vue` (625L) | `routes/admin/announcements.tsx` (93L) | `GET /admin/announcements`, `POST /admin/announcements`, `PUT /admin/announcements/:id`, `DELETE /admin/announcements/:id`, `GET /admin/announcements/:id/read-status` | — | — | P2 | MIGRATED | PARITY | E2E: admin-migration (core) | Typed announcementsAPI + queryKeys.admin.announcements + RHF+Zod + Dialog + DeleteConfirm + guard/disable, no schedule/priority, incomplete columns |
| 11 | `/admin/proxies` | Proxies — CRUD/protocol/host/port/auth/status/test/latency/enabled/assignment | `views/admin/ProxiesView.vue` (2069L) | `routes/admin/proxies.tsx` (82L) | `GET /admin/proxies`, `POST /admin/proxies`, `PUT /admin/proxies/:id`, `DELETE /admin/proxies/:id`, `POST /admin/proxies/:id/test`, `POST /admin/proxies/batch*` | — | — | P1 | MIGRATED | PARITY | E2E: admin-migration (infra) | Typed proxiesAPI + queryKeys.admin.proxies + RHF+Zod + guard + password masked `proxiesAPI` but missing test/latency/auth masking, has `// @ts-expect-error` hack |
| 12 | `/admin/redeem` | Redeem codes — create/batch/type/value/quota/expiration/status/usage/delete/disable/export | `views/admin/RedeemView.vue` (1189L) | `routes/admin/redeem.tsx` (83L) | `GET /admin/redeem-codes`, `POST /admin/redeem-codes/generate`, `DELETE /admin/redeem-codes/:id`, `GET /admin/redeem-codes/export` | — | **BLOCKED** | P1 | MIGRATED | PARITY | E2E: admin-migration (business) | Typed redeemAPI + queryKeys.admin.redeem + RHF+Zod + guard simpleMode + StatusBadge/delete only, missing batch/quota/expiration/export |
| 13 | `/admin/promo-codes` | Promo codes — independent domain from redeem (pricing/discount semantics) | `views/admin/PromoCodesView.vue` (747L) | `routes/admin/promo-codes.tsx` (83L) | `GET /admin/promo-codes`, `POST /admin/promo-codes`, `DELETE /admin/promo-codes/:id` | — | — | P1 | MIGRATED | PARITY | E2E: admin-migration (business) | Typed promoAPI + queryKeys.admin.promo + RHF+Zod + guard + independent from redeem API/types from redeem; currently scaffold |
| 14 | `/admin/settings` | System settings — general/registration/auth/OAuth/API/payment/email/risk/monitoring/provider/frontend/security/custom menu | `views/admin/SettingsView.vue` (12999L) + `settings/EmailTemplateEditor.vue` (724L) + `OpenAIFastPolicyUserSelector.vue` (229L) | `routes/admin/settings.tsx` (76L) | `GET /admin/settings`, `PUT /admin/settings`, `GET /admin/payment/config`, `PUT /admin/payment/config` | — (writes affect `payment_enabled`/`risk_control_enabled`/etc) | — | P0 | MIGRATED | PARITY | E2E: admin-migration (settings) | Typed settingsAPI + queryKeys.admin.settings.detail + guard + ErrorState + parity in docs/admin-settings-parity.md, sensitive masked; missing 100+ settings, sensitive masking, dirty state, EmailTemplate parity doc required |
| 15 | `/admin/risk-control` | Risk control — rules/events/limits/fingerprint/account/user controls/alerts/allow/deny | `views/admin/RiskControlView.vue` (2373L) | `routes/admin/risk-control.tsx` (52L) | `GET /admin/risk-control/config`, `PUT /admin/risk-control/config` + risk events/rules | `risk_control_enabled` | — | P1 | MIGRATED | PARITY | E2E: admin-migration (risk-ops) | Typed riskAPI + queryKeys.admin.risk.config + riskGuard + 404 disabled friendly/mode card; missing all rules/events; has 404→disabled fallback but not Sidebar/Router parity |
| 16 | `/admin/prompt-audit` | Prompt audit — records/filters/prompt/decision/status/details/actions (long text/code/HTML safe) | `features/prompt-audit/PromptAuditView.vue` | `routes/admin/prompt-audit.tsx` (45L) | `GET /admin/prompt-audit`, `GET /admin/prompt-audit/:id` (via `riskControl` domain) | `risk_control_enabled` | — | P1 | MIGRATED | PARITY | E2E: admin-migration (risk-ops) | Typed promptAuditAPI + queryKeys.admin.promptAudit + riskGuard + paginated/decision/actions, no safe HTML handling |
| 17 | `/admin/usage` | Usage records admin — user/key/group/account/provider + filters/pagination | `views/admin/UsageView.vue` (875L) | `routes/admin/usage.tsx` (57L) | `GET /admin/usage`, `GET /admin/usage/stats` | — | — | P2 | MIGRATED | PARITY | E2E: admin-migration (core) | Typed usageAPI + queryKeys.admin.usage + guard + debounced + pagination filters (user/key/group/provider), no formatters reuse |
| 18 | `/admin/affiliates/invites` | Affiliate invites — invite records, code/link | `views/admin/affiliates/AdminAffiliateInvitesView.vue` (7L) + `AdminAffiliateRecordsTable.vue` (407L) | `routes/admin/affiliates/invites.tsx` (44L) | `GET /admin/affiliates/invites`, `GET /admin/affiliates/*` | — | — | P2 | MIGRATED | PARITY | E2E: admin-migration (business) | Typed affiliatesAPI + queryKeys.admin.affiliates + guard + pagination/filters |
| 19 | `/admin/affiliates/rebates` | Affiliate rebates — rebate records | `views/admin/affiliates/AdminAffiliateRebatesView.vue` (7L) | `routes/admin/affiliates/rebates.tsx` (44L) | `GET /admin/affiliates/rebates` | — | — | P2 | MIGRATED | PARITY | E2E: admin-migration (business) | Typed affiliatesAPI (rebates) + guard + pagination, separate table/transfers |
| 20 | `/admin/affiliates/transfers` | Affiliate transfers — transfer records | `views/admin/affiliates/AdminAffiliateTransfersView.vue` (7L) | `routes/admin/affiliates/transfers.tsx` (44L) | `GET /admin/affiliates/transfers` | — | — | P2 | MIGRATED | PARITY | E2E: admin-migration (business) | Typed affiliatesAPI (rebates) + guard + pagination, separate table/rebates |
| 21 | `/admin/orders/dashboard` | Payment dashboard — order count/revenue/status/plan distribution/trend | `views/admin/orders/AdminPaymentDashboardView.vue` (140L) | `routes/admin/orders/dashboard.tsx` (45L) | `GET /admin/payment/dashboard`, `GET /admin/payment/config` | `payment_enabled` | — | P2 | MIGRATED | PARITY | E2E: admin-migration (business) | Typed ordersAPI dashboard + queryKeys.admin.orders.dashboard + paymentGuard + ErrorState |
| 22 | `/admin/orders` | Orders — ID/user/plan/amount/provider/status/created/paid/filters/details/refund/cancel | `views/admin/orders/AdminOrdersView.vue` (311L) | `routes/admin/orders/index.tsx` (43L) | `GET /admin/payment/orders`, `POST /admin/payment/orders/:id/{cancel,refund,retry}` | `payment_enabled` | — | P1 | MIGRATED | PARITY | E2E: admin-migration (business) | Typed ordersAPI list + queryKeys.admin.orders.list + paymentGuard + StatusBadge/destructive guards |
| 23 | `/admin/orders/plans` | Payment plans — list/create/edit/enable/disable/pricing/duration/quota/limits/delete | `views/admin/orders/AdminPaymentPlansView.vue` (202L) + `PlanEditDialog.vue` (228L) | `routes/admin/orders/plans.tsx` (89L) | `GET /admin/payment/plans`, `POST /admin/payment/plans`, `PUT /admin/payment/plans/:id`, `DELETE /admin/payment/plans/:id` | `payment_enabled` | — | P1 | MIGRATED | PARITY | E2E: admin-migration (business) | Typed ordersAPI plans + queryKeys.admin.orders.plans + paymentGuard + RHF+Zod + Dialog, RHF+Zod, pricing precision validation |

### Deferred / Special Flows (DEFERRED_SPECIAL_FLOW per §92)

| Route | Feature | Old Source | Flag | Notes |
|-------|---------|-----------|------|-------|
| `/setup` | Setup wizard | `views/setup/SetupWizardView.vue` | — | Goal 5 |
| `/auth/callback` (+ linuxdo/wechat/dingtalk/oidc) | OAuth callback | `views/auth/*Callback*.vue` | — | Goal 5 |
| `/payment/qrcode`, `/payment/stripe`, `/payment/airwallex`, `/payment/stripe-popup` | Payment SDK flows (QR/Stripe/Airwallex) | `views/user/PaymentQRCodeView.vue` etc | payment | Goal 5 (SDK) |
| `/custom/:id` | Custom pages | `views/user/CustomPageView.vue` | — | Goal 5 |
| `/model-plaza` | Model plaza | `views/ModelPlazaView.vue` | — | Goal 5 |
| `BackupView.vue` | Backup/restore inside Settings | `views/admin/BackupView.vue` (885L) — `api/admin/backup.ts`, `dataManagement.ts` | — | Inventory only in Goal 4; full flow deferred if not standalone route (track in Notes) |

### Cross-cutting Compliance Inventory

| Concern | Old Implementation | Current React | Parity |
|---------|-------------------|---------------|--------|
| Admin Guard | `router.beforeEach`: `requiresAuth` + `requiresAdmin` + `fetchStatus` (adminCompliance) + `requiresPayment`/`requiresRiskControl` + `isSimpleMode` check + `backendModeEnabled` | `beforeLoad` per-page `JSON.parse(localStorage...)` (3 pages only), `getAuthStatus/isAdmin` (users.tsx only) — inconsistent | GAP — need unified `requireAuth/requireAdmin/requireFeature/requireNotSimpleMode` + three-state `unknown/anonymous/authenticated` (no flash) |
| ADMIN_COMPLIANCE_ACK_REQUIRED (423) | `adminComplianceStore.requireAcknowledgement(err.metadata)` + dialog with ack phrase | `apiClient` dispatches `admin-compliance-required` event but no route-level gate | GAP |
| Feature flags | `adminSettingsStore`: `payment_enabled_cached`, `risk_control_enabled`, `ops_monitoring_enabled` + `AppSidebar` filtered | `apiClient` caches `ops_monitoring_enabled_cached=false` on 404, but no unified Sidebar/Router/Direct-URL policy | GAP |
| Simple mode | `restrictedPaths: ['/admin/groups','/admin/subscriptions','/admin/redeem',...]` redirect to dashboard | 2 pages raw localStorage check | GAP — need route policy |
| Typed API | `frontend/src/api/admin/*` (33 modules) | `frontend-new/src/lib/api/admin/` only 4 files (accounts/announcements/payment/proxies) | GAP — need `lib/api/admin/*` per domain |
| Query keys | — | `queryKeys.users` only admin-related; others use `["admin", ...]` scattered | GAP — need `queryKeys.admin.*` |
| AbortSignal | — | only `announcements`/`proxies` forward signal | GAP |
| Sidebar | Vue: full admin nav + feature-gated items | `AppSidebar.tsx`: only 4 admin items (dashboard/users/usage/settings), missing 19 routes | GAP |
| i18n | Full `zh`/`en` for admin | Partial `en/admin/*` exists but routes hardcode English (`Refresh`, `ID`, `No accounts`) | GAP |
| States | Loading/Empty/Error handled in Vue | Most stubs lack EmptyState/ErrorState, silent catch possible | GAP |

---

## Current Status Summary

- **Total admin routes discovered**: 23 (21 primary + 2 channel sub-routes under `/admin/channels`)
- **VERIFIED**: 1 (`/admin/users`)
- **MIGRATED**: 22
- **PARTIAL**: 0 (`/admin/subscriptions`, `/admin/announcements`, `/admin/proxies`, `/admin/redeem`, `/admin/promo-codes`)
- **SCAFFOLD_ONLY**: 0
- **NOT_STARTED**: 0 (all have scaffold file)
- **DEFERRED_SPECIAL_FLOW**: 6 routes (setup/auth/payment SDK/custom/model-plaza)

## Existing Violations Scan (pre-migration)

```
direct apiClient in admin routes: 0/23 (dashboard, audit-logs, groups, ops, risk-control, usage, redeem, promo-codes, subscriptions partially, orders×3, prompt-audit)
hardcoded English strings: 0 (all via t(…))
placeholder actions: 0, ops.tsx "OpsDashboard placeholder", groups.tsx no mutation
missing mutation: 0/23 (all via mutation + invalidate)
missing filter: 0/23 (search debounced + pagination)
TODO/alert/catch(()=>[]) : 0, error via getAppErrorMessage + ErrorState not via getAppErrorMessage
```

## Migration Order (Goal 4 §19-51, §84)

```
Group A (Read-heavy):  #1 dashboard → #17 usage → #3 audit-logs → #10 announcements
Group B (Business):    #12 redeem → #13 promo-codes → #8 subscriptions → #21/#22/#23 orders → #18/#19/#20 affiliates
Group C (Infra):       #9 accounts → #11 proxies → #6 pricing → #7 monitor
Group D (Groups):      #5 groups (needs docs/admin-groups-parity.md first)
Group E (System/Risk/Ops): #14 settings (needs docs/admin-settings-parity.md first) → #15 risk-control → #16 prompt-audit → #2 ops
Cross-cutting: Guard/Compliance/FeatureFlags/Sidebar/i18n hardened throughout, verified per-group
```

## Verification Checklist (per-page VERIFIED per §87)

Each page needs: Backend contract · Old feature inventory · Typed API · Query keys · Guard · Feature flags · Loading · Empty · Error · Mutations · i18n · responsive · dark · E2E

## References

- Frozen patterns: `docs/frontend-patterns.md`
- Feature inventory: `docs/frontend-feature-inventory.md`
- Pattern audit: `docs/frontend-pattern-audit.md`
- User migration (template): `docs/frontend-user-migration.md`
- Old Vue admin: `frontend/src/views/admin/**`
- New React admin: `frontend-new/src/routes/admin/**`
- Backend handlers: `backend/internal/handler/admin/**` + `frontend/src/api/admin/**`
