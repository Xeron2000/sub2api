# Frontend Feature Inventory — Vue → React Migration

> Source: `frontend/src/router/index.ts` (72 routes, 1006 lines), `frontend/src/views/**`, `frontend/src/api/**`, `frontend/src/stores/**`, `frontend/src/composables/**`
> Generated: 2026-08-26 | Backend: `http://localhost:18786` | Old FE: `frontend/` (Vue 3 + Pinia + Vite)

## How to use

Each item has a migration checkbox. Update as you migrate:
- `[ ] Not Started` → `[~] In Progress` → `[x] Migrated` → `[x] Verified` (passes loading/empty/error + light/dark + 390px/1440px + query integration)
- Reference: old `frontend/` is behavioral oracle; `backend/` is contract source of truth.

---

## 1. Routes (72) — from `router/index.ts`

### 1.1 Setup (1)
| # | Path | Name | Auth | Route file | Flags |
|---|------|------|------|------------|-------|
| 1 | `/setup` | Setup | — | `views/setup/SetupWizardView.vue` | — |
| | | | | | `[ ] Not Started` |

### 1.2 Public (12)
| # | Path | Name | Auth | Component | Flags |
|---|------|------|------|-----------|-------|
| 2 | `/home` | Home | — | `views/HomeView.vue` | — |
| 3 | `/login` | Login | — | `views/auth/LoginView.vue` | — |
| 4 | `/register` | Register | — | `views/auth/RegisterView.vue` | — |
| 5 | `/email-verify` | EmailVerify | — | `views/auth/EmailVerifyView.vue` | — |
| 6 | `/auth/callback` (+ alias `/auth/oauth/callback`) | OAuthCallback | — | `views/auth/OAuthCallbackView.vue` | — |
| 7 | `/auth/linuxdo/callback` | LinuxDoOAuthCallback | — | `views/auth/LinuxDoCallbackView.vue` | — |
| 8 | `/auth/wechat/callback` | WeChatOAuthCallback | — | `views/auth/WechatCallbackView.vue` | — |
| 9 | `/auth/wechat/payment/callback` | WeChatPaymentOAuthCallback | — | `views/auth/WechatPaymentCallbackView.vue` | — |
| 10 | `/auth/dingtalk/callback` | DingTalkOAuthCallback | — | `views/auth/DingTalkCallbackView.vue` | — |
| 11 | `/auth/dingtalk/email-completion` | dingtalk-email-completion | — | `views/auth/DingTalkEmailCompletionView.vue` | — |
| 12 | `/auth/oidc/callback` | OIDCOAuthCallback | — | `views/auth/OidcCallbackView.vue` | — |
| 13 | `/forgot-password` | ForgotPassword | — | `views/auth/ForgotPasswordView.vue` | — |
| 14 | `/reset-password` | ResetPassword | — | `views/auth/ResetPasswordView.vue` | — |
| 15 | `/key-usage` | KeyUsage | — | `views/KeyUsageView.vue` | — |
| 16 | `/legal/:documentId` | LegalDocument | — | `views/public/LegalDocumentView.vue` | — |
| 17 | `/model-plaza` | ModelPlaza | — | `views/ModelPlazaView.vue` | `model_plaza_enabled` + `model_plaza_require_auth` |

### 1.3 User (20)
| # | Path | Name | Component | Flags |
|---|------|------|-----------|-------|
| 18 | `/` → `/home` | — | redirect | — |
| 19 | `/dashboard` | Dashboard | `views/user/DashboardView.vue` | — |
| 20 | `/keys` | Keys | `views/user/KeysView.vue` | — |
| 21 | `/batch-image` (alias `/docs/batch-image`) | BatchImageGuide | `views/user/BatchImageGuideView.vue` | — |
| 22 | `/usage` | Usage | `views/user/UsageView.vue` | — |
| 23 | `/redeem` | Redeem | `views/user/RedeemView.vue` | — |
| 24 | `/affiliate` | Affiliate | `views/user/AffiliateView.vue` | — |
| 25 | `/available-channels` | UserAvailableChannels | `views/user/AvailableChannelsView.vue` | — |
| 26 | `/profile` | Profile | `views/user/ProfileView.vue` | — |
| 27 | `/subscriptions` | Subscriptions | `views/user/SubscriptionsView.vue` | — |
| 28 | `/purchase` | PurchaseSubscription | `views/user/PaymentView.vue` | `requiresPayment` |
| 29 | `/orders` | OrderList | `views/user/UserOrdersView.vue` | `requiresPayment` |
| 30 | `/payment/qrcode` | PaymentQRCode | `views/user/PaymentQRCodeView.vue` | `requiresPayment` |
| 31 | `/payment/result` | PaymentResult | `views/user/PaymentResultView.vue` | — |
| 32 | `/payment/stripe` | StripePayment | `views/user/StripePaymentView.vue` | — |
| 33 | `/payment/airwallex` | AirwallexPayment | `views/user/AirwallexPaymentView.vue` | — |
| 34 | `/payment/stripe-popup` | StripePopup | `views/user/StripePopupView.vue` | — |
| 35 | `/custom/:id` | CustomPage | `views/user/CustomPageView.vue` | — |
| 36 | `/monitor` | ChannelStatus | `views/user/ChannelStatusView.vue` | — |

### 1.4 Admin (34)
| # | Path | Name | Component | Flags |
|---|------|------|-----------|-------|
| 37 | `/admin` → `/admin/dashboard` | — | redirect | — |
| 38 | `/admin/dashboard` | AdminDashboard | `views/admin/DashboardView.vue` | — |
| 39 | `/admin/ops` | AdminOps | `views/admin/ops/OpsDashboard.vue` | — |
| 40 | `/admin/audit-logs` | AdminAuditLogs | `views/admin/AuditLogView.vue` | — |
| 41 | `/admin/users` | AdminUsers | `views/admin/UsersView.vue` | — |
| 42 | `/admin/groups` | AdminGroups | `views/admin/GroupsView.vue` | — |
| 43 | `/admin/channels` → `/admin/channels/pricing` | — | redirect | — |
| 44 | `/admin/channels/pricing` | AdminChannels | `views/admin/ChannelsView.vue` | — |
| 45 | `/admin/channels/monitor` | AdminChannelMonitor | `views/admin/ChannelMonitorView.vue` | — |
| 46 | `/admin/subscriptions` | AdminSubscriptions | `views/admin/SubscriptionsView.vue` | — |
| 47 | `/admin/accounts` | AdminAccounts | `views/admin/AccountsView.vue` | — |
| 48 | `/admin/announcements` | AdminAnnouncements | `views/admin/AnnouncementsView.vue` | — |
| 49 | `/admin/proxies` | AdminProxies | `views/admin/ProxiesView.vue` | — |
| 50 | `/admin/redeem` | AdminRedeem | `views/admin/RedeemView.vue` | — |
| 51 | `/admin/promo-codes` | AdminPromoCodes | `views/admin/PromoCodesView.vue` | — |
| 52 | `/admin/settings` | AdminSettings | `views/admin/SettingsView.vue` | — |
| 53 | `/admin/risk-control` | AdminRiskControl | `views/admin/RiskControlView.vue` | `requiresRiskControl` |
| 54 | `/admin/prompt-audit` | AdminPromptAudit | `features/prompt-audit/PromptAuditView.vue` | `requiresRiskControl` |
| 55 | `/admin/usage` | AdminUsage | `views/admin/UsageView.vue` | — |
| 56 | `/admin/affiliates/invites` | AdminAffiliateInvites | `views/admin/affiliates/AdminAffiliateInvitesView.vue` | — |
| 57 | `/admin/affiliates/rebates` | AdminAffiliateRebates | `views/admin/affiliates/AdminAffiliateRebatesView.vue` | — |
| 58 | `/admin/affiliates/transfers` | AdminAffiliateTransfers | `views/admin/affiliates/AdminAffiliateTransfersView.vue` | — |
| 59 | `/admin/orders/dashboard` | AdminPaymentDashboard | `views/admin/orders/AdminPaymentDashboardView.vue` | `requiresPayment` |
| 60 | `/admin/orders` | AdminOrders | `views/admin/orders/AdminOrdersView.vue` | `requiresPayment` |
| 61 | `/admin/orders/plans` | AdminPaymentPlans | `views/admin/orders/AdminPaymentPlansView.vue` | `requiresPayment` |

### 1.5 System
| # | Path | Name | Notes |
|---|------|------|-------|
| 62 | `/:pathMatch(.*)*` | NotFound | `views/NotFoundView.vue` |

**Router guards to preserve:** `requiresAuth`/`requiresAdmin`/`requiresPayment`/`requiresRiskControl`/`isSimpleMode` blocklist, backendMode allowlist (`BACKEND_MODE_*_PATHS`), `model_plaza_enabled` gate, `ChunkLoadError` reload, `setupStatus` redirect.

---

## 2. Views (.vue) — 75 files

### User views (15)
- [ ] `user/DashboardView.vue` — stats, trend, announcements
- [ ] `user/KeysView.vue` — API key CRUD, copy, status
- [ ] `user/UsageView.vue` — usage table + filters + pagination
- [ ] `user/SubscriptionsView.vue` — progress, summary
- [ ] `user/ProfileView.vue` — TOTP/step-up, notify email, password
- [ ] `user/AffiliateView.vue` — invite/rebate/transfer
- [ ] `user/AvailableChannelsView.vue` — channel list
- [ ] `user/PaymentView.vue` — purchase flow entry
- [ ] `user/PaymentQRCodeView.vue` / `PaymentResultView.vue` / `StripePaymentView.vue` / `AirwallexPaymentView.vue` / `StripePopupView.vue`
- [ ] `user/UserOrdersView.vue` — orders list
- [ ] `user/RedeemView.vue` — redeem code
- [ ] `user/ChannelStatusView.vue` (+ V1/V2) — channel monitor
- [ ] `user/BatchImageGuideView.vue` — batch image guide
- [ ] `user/CustomPageView.vue` — custom page renderer

### Admin views (32)
- [ ] `admin/DashboardView.vue` — admin stats
- [ ] `admin/UsersView.vue` — user table CRUD, filters, bulk
- [ ] `admin/GroupsView.vue` — group pricing/models/profit
- [ ] `admin/ChannelsView.vue` — pricing channels
- [ ] `admin/ChannelMonitorView.vue` — legacy monitor
- [ ] `admin/ops/OpsDashboard.vue` — new monitor (latency/throughput/errors/concurrency)
- [ ] `admin/AccountsView.vue` — upstream accounts
- [ ] `admin/SubscriptionsView.vue` — subscription templates
- [ ] `admin/AnnouncementsView.vue` — announcements CRUD
- [ ] `admin/GroupsView.vue` + `ChannelsView.vue` etc — see above
- [ ] `admin/ProxiesView.vue` — proxy CRUD
- [ ] `admin/RedeemView.vue` / `PromoCodesView.vue`
- [ ] `admin/SettingsView.vue` + `settings/*` — system settings, email templates
- [ ] `admin/RiskControlView.vue` / `features/prompt-audit/PromptAuditView.vue`
- [ ] `admin/UsageView.vue` / `admin/AuditLogView.vue` / `admin/BackupView.vue`
- [ ] `admin/affiliates/*` — invites/rebates/transfers
- [ ] `admin/orders/*` — dashboard/orders/plans + `PlanEditDialog.vue`

### Auth views (10)
- [ ] `auth/LoginView.vue` / `RegisterView.vue` / `EmailVerifyView.vue` / `ForgotPasswordView.vue` / `ResetPasswordView.vue`
- [ ] `auth/OAuthCallbackView.vue` / `LinuxDoCallbackView.vue` / `WechatCallbackView.vue` / `DingTalkCallbackView.vue` / `OidcCallbackView.vue`
- [ ] `auth/WechatPaymentCallbackView.vue` / `DingTalkEmailCompletionView.vue`

### Public (5)
- [ ] `HomeView.vue` / `KeyUsageView.vue` / `ModelPlazaView.vue` / `public/LegalDocumentView.vue` / `setup/SetupWizardView.vue` / `NotFoundView.vue`

---

## 3. API Layer — `frontend/src/api/*.ts` (23 modules)

| Module | Key exports | Backend prefix |
|--------|-------------|---------------|
| `client.ts` | `apiClient` (axios, baseURL, interceptors, admin/user header marking) | `*` |
| `auth.ts` | login/register/logout/refresh, TOTP helpers, OAuth URL builders | `/api/v1/auth` |
| `tokenRefresh.ts` | `refreshAuthTokens`, queue + retry | `/api/v1/auth/refresh` |
| `user.ts` | profile, password, notify email, bindings | `/api/v1/user` |
| `keys.ts` | list/get/create/update/delete/toggle | `/api/v1/keys` |
| `usage.ts` | list/query/stats/trend/dashboard | `/api/v1/usage` |
| `subscriptions.ts` | my/active/progress/summary | `/api/v1/subscriptions` |
| `channels.ts` / `groups.ts` | available channels/groups/rates | `/api/v1/channels` |
| `announcements.ts` | list/markRead | `/api/v1/announcements` |
| `channelMonitor.ts` / `channelMonitorV2.ts` | v1/v2 monitor snapshot/matrix/errors | `/api/v1/monitor` |
| `payment.ts` | orders/plans/checkout/callbacks (Stripe/Airwallex/WeChat) | `/api/v1/payment` |
| `redeem.ts` | redeem/history | `/api/v1/redeem` |
| `setup.ts` | getStatus/testDatabase/testRedis/install | `/api/v1/setup` |
| `batchImage.ts` | submit/list/cancel/download (vertex) | `/api/v1/batch-image` |
| `modelPlaza.ts` | getModelPlaza | `/api/v1/model-plaza` |
| `passkey.ts` | WebAuthn register/auth | `/api/v1/passkey` |
| `totp.ts` | setup/enable/disable/stepUp/verify | `/api/v1/totp` |
| `url.ts` | `getAPIBaseURL`, `buildApiUrl` | — |
| `adminUIRequest.ts` | `shouldMarkAdminUIRequest`, timing | — |

- [ ] Migrate each module to `frontend-new/src/lib/api/` with same path/method/body/response shapes (Method/Path/Query/Body/Response/Enum/Timezone/Money as source of truth)

---

## 4. Stores — `frontend/src/stores/*.ts` (9)

- [ ] `auth.ts` — isAuthenticated/isAdmin/isSimpleMode, checkAuth, pending session
- [ ] `app.ts` — publicSettings, siteName, backendMode, custom menu
- [ ] `adminSettings.ts` / `adminCompliance.ts` — admin config + 423 ack
- [ ] `announcements.ts` / `subscriptions.ts` / `payment.ts` / `onboarding.ts`
- [ ] Do NOT copy Pinia verbatim → use TanStack Query server state + minimal local UI state (`useState` / tiny context)

---

## 5. Composables — `frontend/src/composables/*.ts` (18)

- [ ] `useNavigationLoading.ts` / `useRoutePrefetch.ts` — keep behavior, adapt to TanStack Router
- [ ] `useKeyedDebouncedSearch.ts` (250–400ms, race guard) / `usePersistedPageSize.ts` / `useTableLoader.ts`
- [ ] `useClipboard.ts` / `useForm.ts` / `useAutoRefresh.ts` / `useStepUp.ts`
- [ ] OAuth: `useAccountOAuth.ts` / `useAntigravityOAuth.ts` / `useGeminiOAuth.ts` / `useGrokOAuth.ts` / `useOpenAIOAuth.ts`
- [ ] Others: `useBatchImageAccess.ts` / `useModelWhitelist.ts` / `useOnboardingTour.ts` / `useQuotaNotifyState.ts`

---

## 6. i18n — `src/i18n/locales/{en,zh}`

- [ ] Locales `en`/`zh`, keys via `titleKey`/`descriptionKey` in router meta (e.g. `dashboard.title`, `admin.users.title`)
- [ ] New FE must keep `Chinese`/`English` via unified i18n (no hard-coded strings)

---

## 7. Feature Flags / Guards

- [ ] `payment_enabled` → `requiresPayment` routes
- [ ] `risk_control_enabled` → `requiresRiskControl`
- [ ] `model_plaza_enabled` / `model_plaza_require_auth` → `/model-plaza`
- [ ] `backendModeEnabled` → allowlist (`BACKEND_MODE_*_PATHS`) + admin-only
- [ ] `isSimpleMode` blocklist: `/admin/groups`, `/admin/subscriptions`, `/admin/redeem`, `/subscriptions`, `/redeem`

---

## 8. Payment / OAuth Special Flows

- [ ] Stripe (`@stripe/stripe-js` 9.x, lazy load) / Airwallex (`@airwallex/components-sdk` 1.30.x)
- [ ] WeChat / DingTalk / LinuxDo / OIDC / generic OAuth callbacks (6 callback views + email-completion)
- [ ] QR code (`qrcode` 1.5.x), polling, popup flows — keep client boundary (no `window` on SSR)

---

## 9. Migration Checklist (per goal scope Phase 0-8)

- [ ] Inventory done (this doc + route-migration)
- [ ] `frontend-new/` initialized with preset `b7WQfDSML` (or paused if preset missing)
- [ ] Design tokens + `docs/frontend-design-system.md` + `AGENTS.md` guardrails
- [ ] UI primitives ≥10, shared ≥6, layout AppShell
- [ ] API client + `queryKeys.*` + `AppError` + RHF+Zod
- [ ] Representative pages (full-chain vs real backend 18786): Login, Dashboard, Usage/Keys, Admin Users — each with loading/empty/error + light/dark + 390/1440
- [ ] `/dev/ui` playground (dev only)
- [ ] Vitest smoke passes; backend untouched (`git diff --name-only | grep ^backend/` empty)
