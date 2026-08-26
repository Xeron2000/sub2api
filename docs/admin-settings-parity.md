# Admin Settings Parity — SettingsView.vue (12999L) → React

> Source: `frontend/src/views/admin/SettingsView.vue` + `settings/EmailTemplateEditor.vue` (724L) + `settings/OpenAIFastPolicyUserSelector.vue` (229L)
> Generated: 2026-08-26 | Status: inventory before React migration

## Overview

`SettingsView.vue` is the highest-risk admin page (12999 lines) — a global control plane spanning general, auth, payment, monitoring, provider policy, frontend behavior, and security. Current React stub `routes/admin/settings.tsx` has only `site_name + email_template` (2 fields, ~76L) — ~99% gap.

## Tabs (goal4.md §43, actual from code)

`settingsTabs` (9 tabs, `SettingsTab` union):

| Key | Icon | Purpose |
|-----|------|---------|
| `general` | home | Site name, frontend_url, doc_url, custom_menu_items, table_default_page_size, etc |
| `agreement` | document | `login_agreement_enabled/mode/documents/updated_at` |
| `features` | bolt | Feature flags, affiliate, backup proxies, quotas |
| `security` | shield | Passkey (`passkey_configured`, RPID, origins), TOTP, captcha (Turnstile/Tencent/Aliyun) |
| `users` | user | Registration, default_platform_quotas, default_subscriptions, user attribute knobs |
| `gateway` | server | Gateway, channel_monitor_*, API ACL, rectifier, scheduling thresholds |
| `payment` | creditCard | `payment_enabled`, types, limits, fee rates, product name prefix/suffix, subscription USD→CNY, balance notify |
| `email` | mail | SMTP (`smtp_host/port/username/password/from`), email templates, verify flags |
| `backup` | database | Backup/restore profiles, retention, schedule |

## Sensitive Fields Inventory (P0 — goal4.md §46)

Must be **masked + safe update** (never overwrite real secret with `********`):

- `smtp_password`
- `wechat_connect_*_app_secret` (`open/mp/mobile/open`), `*_configured` booleans
- `dingtalk_connect_client_secret`
- `google_oauth_client_secret`, `github_oauth_client_secret`, `linuxdo_connect_client_secret`, `oidc_connect_client_secret`
- `turnstile_secret_key`, `tencent_captcha_app_secret_key`, `tencent_captcha_cloud_secret_*`, `aliyun_captcha_access_key_secret`
- `adminApiKey` (generated via adminApiKey flow, masked display)
- Any field where backend returns masked sentinel (`********`) — frontend must track “user edited vs untouched” to avoid clearing.

## Sections & Key Fields (select — full list from `form.*` enumerated)

**General:**
`site_name`, `frontend_url`, `doc_url`, `table_default_page_size`, `custom_menu_items[]` (sortable, title/url/icon/sort_order + drag/reorder), `custom_endpoints`, `model_plaza_enabled`, `channel_monitor_*`

**Agreement / Legal:**
`login_agreement_enabled/mode/documents`, `agreement_updated_at`

**Features:**
`affiliate_enabled`, `backend_mode_enabled`, `balance_low_notify_enabled/recharge_url`, `channel_monitor_enabled/show_quota/hide_throughput/mode`, `cyber_session_block_enabled`, `audit_log_retention_days`

**Security:**
`passkey_configured`, `passkey RPID/origins`, `turnstile_enabled/secret/site_key`, `tencent_captcha_enabled/region/app_secret`, `aliyun_captcha_*`, `api_key_acl_trust_forwarded_ip`, `forwarded_client_ip_headers`, `account_scheduling_thresholds`

**Users / Quotas:**
`email_verify_enabled`, `password_reset_enabled`, `default_platform_quotas`, `default_subscriptions[]`, `account_quota_notify_emails`

**Gateway:**
`account_scheduling_thresholds`, `openai_advanced_scheduler_enabled`, `openai_oauth_scheduling_rate_multiplier`, `openai_low_upstream_rate_priority_enabled`, `channel_monitor_*`

**Payment** (affects `payment_enabled` flag globally):
`payment_enabled`, `payment_enabled_types[]` (alipay/wechat/stripe/airwallex/etc), `payment_min/max_amount`, `payment_daily_limit`, `payment_cancel_rate_limit_enabled`, `payment_recharge_fee_rate`, `payment_balance_recharge_multiplier`, `payment_subscription_usd_to_cny_rate`, `payment_product_name_prefix/suffix`, `payment_alipay_force_qrcode/mobile_precreate_deep_link`

**Email:**
`smtp_host/port/username/password/use_tls/from_email/from_name`, `smtp_password` (masked), `email_verify_enabled`, `email_templates` (via `EmailTemplateEditor.vue` — template variables, preview, validation, save/reset per goal4.md §47)

**Backup:**
Retention policies, schedule — via `BackupView.vue` capabilities if embedded

**OAuth / Providers** (many `*_connect_*`):
`dingtalk_connect_enabled/client_secret/sync_* /corp_restriction_policy/bypass_registration`, `wechat_connect_enabled/mode/open/mp/mobile/scopes/redirect_url/app_id/secret`, `github/google/linuxdo/oidc_connect_*`, `claude_oauth_system_prompt/blocks`

**Sibling components:**
- `EmailTemplateEditor.vue` (724L): template variables, preview, validation, save/reset — must verify variables + reset semantics
- `OpenAIFastPolicyUserSelector.vue` (229L): user selector for fast policy

## Schema & Validation (goal4.md §44)

- No `hundreds of useState` — must be `typed settings DTO + Zod schema where appropriate + section components`
- Each section Zod validates its slice; 422 detail → `form.setError` per field
- 409 (conflict) and 400 handled with field+form messages

## Dirty State (goal4.md §45)

- If user edits but not saved and navigates section/tab: warn/dirty indicator, avoid silent loss
- If old product auto-saves per-field, preserve parity (check old save semantics per tab — some tabs immediate PUT vs bulk Save)

## Sensitive & Masked Update (goal4.md §46)

- Inputs for secrets render masked (`********`) when `*_configured === true` and raw not exposed
- Track `dirtySecretKeys: Set<string>` — only send secrets if user re-entered
- Most dangerous: backend returns `********` then frontend PUTs it back as real password — must be blocked by dirty tracking + backend sentinel check

## Email Template Editor (goal4.md §47)

- `EmailTemplateEditor.vue` provides: variable list (`{{name}}` etc), preview, validation, save, reset
- Migrate if product still supports (check backend `email_template` endpoints) — keep variables/preview parity

## Feature Flags From Settings (goal4.md §48)

Changing `payment_enabled`, `risk_control_enabled`, `ops_monitoring_enabled` etc must:
- Invalidate `queryKeys.admin.settings` + related flag caches
- Update `AppSidebar` filtered nav (payment/risk/ops entries show/hide without refresh)
- Update `beforeLoad` route guards immediately (no browser refresh needed)
- Persist `localStorage` cached bools (`payment_enabled_cached` etc) for fast first paint, but not trust them over fresh `/admin/settings`

## Update Semantics

- `GET /admin/settings` → typed `AdminSettings` DTO
- `PUT /admin/settings` with delta (only dirty fields, sensitive only if changed)
- Query key: `queryKeys.admin.settings.detail()` + `detail → all` invalidation

## Parity Checklist

- [ ] All 9 tab keys + keyboard nav (ArrowLeft/Right/Home/End per old code) + activeTab state
- [ ] Each tab's section fields (see tables above) — at least one field per real old field, no silent omission
- [ ] Sensitive fields masked + dirty tracking (never send `********`)
- [ ] Email template editor parity (if supported — variables/preview/validation/reset)
- [ ] Custom menu items reorder (add/remove/reorder with sort_order)
- [ ] Zod schema per section + 422 field mapping
- [ ] Dirty state indicator + nav guard warning
- [ ] Feature-flag side effects (Sidebar/route/cache) without refresh
- [ ] Typed DTO + `queryKeys.admin.settings.*` + AbortSignal
- [ ] i18n zh/en for all tab/section/label/tooltip/status
- [ ] Light/dark, 390/1440, keyboard/focus/aria, Loading/Error, no silent failure
- [ ] `GET/PUT /admin/settings` verified against backend contract; `GET /admin/payment/config` if payment tab present

## References
- Old source: `frontend/src/views/admin/SettingsView.vue` (8826 tabs list, 9500+ form defaults, 10519+ custom_menu logic, 11140+ PUT payload)
- Old sibling: `frontend/src/views/admin/settings/EmailTemplateEditor.vue`, `OpenAIFastPolicyUserSelector.vue`
