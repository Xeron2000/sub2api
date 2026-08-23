# Route Map — Sub2API Legacy Frontend (Vue)

> Source: `frontend/src/router/index.ts` @ d45135d (1006 LOC) + `backend/internal/server/router.go`
> Total frontend routes: **54** (1 setup + 17 public + 16 user + 20 admin) + 2 redirects + 1 catch-all

## Summary Table

| Group | Path | Name | Auth | Admin | Payment gate | Component |
|-------|------|------|------|-------|--------------|-----------|
| setup | `/setup` | Setup | no | - | - | `setup/SetupWizardView.vue` |
| public | `/home` | Home | no | - | - | `HomeView.vue` |
| public | `/login` | Login | no | - | - | `auth/LoginView.vue` |
| public | `/register` | Register | no | - | - | `auth/RegisterView.vue` |
| public | `/email-verify` | EmailVerify | no | - | - | `auth/EmailVerifyView.vue` |
| public | `/auth/callback` | OAuthCallback | no | - | - | `auth/OAuthCallbackView.vue` alias `/auth/oauth/callback` |
| public | `/auth/linuxdo/callback` | LinuxDoOAuthCallback | no | - | - | `auth/LinuxDoCallbackView.vue` |
| public | `/auth/wechat/callback` | WeChatOAuthCallback | no | - | - | `auth/WechatCallbackView.vue` |
| public | `/auth/wechat/payment/callback` | WeChatPaymentOAuthCallback | no | - | - | `auth/WechatPaymentCallbackView.vue` |
| public | `/auth/dingtalk/callback` | DingTalkOAuthCallback | no | - | - | `auth/DingTalkCallbackView.vue` |
| public | `/auth/dingtalk/email-completion` | dingtalk-email-completion | no | - | - | `auth/DingTalkEmailCompletionView.vue` |
| public | `/auth/oidc/callback` | OIDCOAuthCallback | no | - | - | `auth/OidcCallbackView.vue` |
| public | `/forgot-password` | ForgotPassword | no | - | - | `auth/ForgotPasswordView.vue` |
| public | `/reset-password` | ResetPassword | no | - | - | `auth/ResetPasswordView.vue` |
| public | `/key-usage` | KeyUsage | no | - | - | `KeyUsageView.vue` |
| public | `/legal/:documentId` | LegalDocument | no | - | - | `public/LegalDocumentView.vue` reads `docs/legal/*.md` |
| public | `/model-plaza` | ModelPlaza | no (optional JWT) | - | - | `ModelPlazaView.vue` |
| user | `/` | — | redirect | - | - | → `/home` |
| user | `/dashboard` | Dashboard | yes | no | - | `user/DashboardView.vue` |
| user | `/keys` | Keys | yes | no | - | `user/KeysView.vue` |
| user | `/batch-image` | BatchImageGuide | yes | no | - | `user/BatchImageGuideView.vue` alias `/docs/batch-image` |
| user | `/usage` | Usage | yes | no | - | `user/UsageView.vue` |
| user | `/redeem` | Redeem | yes | no | - | `user/RedeemView.vue` |
| user | `/affiliate` | Affiliate | yes | no | - | `user/AffiliateView.vue` |
| user | `/available-channels` | UserAvailableChannels | yes | no | - | `user/AvailableChannelsView.vue` |
| user | `/profile` | Profile | yes | no | - | `user/ProfileView.vue` |
| user | `/subscriptions` | Subscriptions | yes | no | - | `user/SubscriptionsView.vue` |
| user | `/purchase` | PurchaseSubscription | yes | no | **requiresPayment** | `user/PaymentView.vue` |
| user | `/orders` | OrderList | yes | no | requiresPayment | `user/UserOrdersView.vue` |
| user | `/payment/qrcode` | PaymentQRCode | yes | no | requiresPayment | `user/PaymentQRCodeView.vue` |
| user | `/payment/result` | PaymentResult | no | - | - | `user/PaymentResultView.vue` |
| user | `/payment/stripe` | StripePayment | no | - | - | `user/StripePaymentView.vue` |
| user | `/payment/airwallex` | AirwallexPayment | no | - | - | `user/AirwallexPaymentView.vue` |
| user | `/payment/stripe-popup` | StripePopup | no | - | - | `user/StripePopupView.vue` |
| user | `/custom/:id` | CustomPage | yes | no | - | `user/CustomPageView.vue` |
| user | `/monitor` | ChannelStatus | yes | no | - | `user/ChannelStatusView.vue` |
| admin | `/admin` | — | redirect | - | - | → `/admin/dashboard` |
| admin | `/admin/dashboard` | AdminDashboard | yes | **yes** | - | `admin/DashboardView.vue` |
| admin | `/admin/ops` | AdminOps | yes | yes | - | `admin/ops/OpsDashboard.vue` |
| admin | `/admin/audit-logs` | AdminAuditLogs | yes | yes | - | `admin/AuditLogView.vue` |
| admin | `/admin/users` | AdminUsers | yes | yes | - | `admin/UsersView.vue` |
| admin | `/admin/groups` | AdminGroups | yes | yes | - | `admin/GroupsView.vue` |
| admin | `/admin/channels/pricing` | AdminChannels | yes | yes | - | `admin/ChannelsView.vue` (redirect from `/admin/channels`) |
| admin | `/admin/channels/monitor` | AdminChannelMonitor | yes | yes | - | `admin/ChannelMonitorView.vue` |
| admin | `/admin/subscriptions` | AdminSubscriptions | yes | yes | - | `admin/SubscriptionsView.vue` |
| admin | `/admin/accounts` | AdminAccounts | yes | yes | - | `admin/AccountsView.vue` |
| admin | `/admin/announcements` | AdminAnnouncements | yes | yes | - | `admin/AnnouncementsView.vue` |
| admin | `/admin/proxies` | AdminProxies | yes | yes | - | `admin/ProxiesView.vue` |
| admin | `/admin/redeem` | AdminRedeem | yes | yes | - | `admin/RedeemView.vue` |
| admin | `/admin/promo-codes` | AdminPromoCodes | yes | yes | - | `admin/PromoCodesView.vue` |
| admin | `/admin/settings` | AdminSettings | yes | yes | - | `admin/SettingsView.vue` |
| admin | `/admin/risk-control` | AdminRiskControl | yes | yes | `requiresRiskControl` | `admin/RiskControlView.vue` |
| admin | `/admin/prompt-audit` | AdminPromptAudit | yes | yes | - | `admin/PromptAuditView.vue` |
| admin | `/admin/usage` | AdminUsage | yes | yes | - | `admin/UsageView.vue` |
| global | `/:pathMatch(.*)*` | NotFound | no | - | - | `NotFoundView.vue` |

## Route Guards (frontend/src/router/index.ts)

- `beforeEach` checks `requiresAuth` (default true → redirect `/login?redirect=`) and `requiresAdmin` → `/dashboard` if non-admin, plus `requiresPayment` → block when payment disabled, `requiresRiskControl` → feature gate.
- `afterEach` updates `document.title` via `resolveRouteDocumentTitle` and triggers `useRoutePrefetch`.
- Setup guard: `getSetupStatus()` — if not completed, force `/setup`; completed setup redirects via `resolveCompletedSetupRedirectPath`.
- Navigation loading state via `useNavigationLoadingState` (subtle progress).

## Compatibility Contract to Preserve

- All paths, `?redirect=` after login, `?code=` / `?state=` OAuth params, `/legal/:documentId`, `/custom/:id`, `/key-usage?key=`, payment `?order_id=` / `?out_trade_no=` must remain identical.
