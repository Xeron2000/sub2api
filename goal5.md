# GOAL 5 — Sub2API Special Flows & Remaining Parity

## Mission

Goal 1–4 已完成：

```text
Foundation                     ✅
Pattern Freeze                 ✅
User Frontend                  ✅
Admin Frontend                 ✅
```

本阶段处理剩余所有：

> 高状态性、高安全性、高跳转性、第三方 SDK、动态内容与 Setup 特殊流程。

目标：

```text
OAuth/Auth Special Flows
+
Payment Provider Flows
+
Account Security Flows
+
Setup
+
Custom Page
+
Model Plaza
+
Backend/Public Route Policy
=
Old Vue frontend no longer required
```

本阶段结束后：

**除最终 QA / Cutover 外，不应再有业务功能依赖旧 Vue frontend。**

---

# 1. Core Principle

优先级：

```text
Security
>
Correctness
>
Behavioral Parity
>
Recovery
>
UX
>
Visual Polish
```

Special Flow 最危险的情况不是 UI 不好看。

而是：

```text
重复支付
登录错账号
OAuth CSRF
callback loop
token 泄漏
state 丢失
错误 redirect
敏感参数写进 URL
HTML XSS
Setup 锁死
```

---

# 2. Read First

必须先阅读：

```text
docs/frontend-patterns.md
docs/frontend-user-migration.md
docs/frontend-admin-migration.md
AGENTS.md
```

并扫描：

```text
frontend/src/router/index.ts
frontend/src/views/auth/**
frontend/src/views/user/*Payment*
frontend/src/views/user/Profile*
frontend/src/views/Setup*
frontend/src/views/ModelPlaza*
frontend/src/views/user/CustomPage*

frontend/src/api/**
frontend/src/stores/**

frontend-new/src/routes/**
frontend-new/src/lib/**

backend auth/payment/setup/page/model handlers
backend tests
```

---

# 3. First Deliverable — Special Flow Inventory

不要直接写代码。

创建：

```text
docs/frontend-special-flows.md
```

表格：

```text
Route / Entry
Flow
Old Vue Source
React Source
Backend Endpoints
External Provider
Auth Requirement
Feature Flag
Sensitive Data
Current Status
Parity
Tests
```

状态：

```text
NOT_STARTED
SCAFFOLD_ONLY
PARTIAL
MIGRATED
VERIFIED
REMOVED_WITH_REASON
```

---

# 4. Inventory Must Discover, Not Assume

至少覆盖：

## Core Auth

```text
/register
/forgot-password
/reset-password
/email-verify
```

## OAuth

```text
/auth/callback
/auth/linuxdo/callback
/auth/dingtalk/callback
/auth/dingtalk/email-completion
/auth/oidc/callback
/auth/wechat/callback
```

以及 backend/旧 Router 中实际存在的其他 callback。

## Profile Security

```text
TOTP
Passkey
OAuth bind
OAuth unbind
step-up auth
security confirmation
```

## Payment

```text
/purchase
/orders

/payment/qrcode
/payment/result
/payment/stripe
/payment/airwallex
/payment/stripe-popup
```

以及：

```text
WeChat payment callback
```

如果存在。

## Other

```text
/setup
/custom/:id
/model-plaza
```

不要因为当前 React route 缺失就漏掉。

---

# 5. No Fake Flow

禁止：

```text
Callback page loads
→ show "Success"
```

但实际上：

```text
token 没保存
state 没校验
session 没更新
redirect 错误
```

每个流程必须追踪完整 state machine。

---

# 6. Flow Documentation

对于每个特殊流程，先画：

```text
ENTRY
↓
STATE
↓
BACKEND CALL
↓
EXTERNAL REDIRECT
↓
CALLBACK
↓
VALIDATION
↓
SESSION / ORDER UPDATE
↓
FINAL REDIRECT
```

记录在：

```text
docs/frontend-special-flows.md
```

---

# 7. Auth Flow State Machine

Auth 页面统一考虑：

```text
idle
loading
external_redirect
callback_processing
requires_extra_input
success
error
recoverable_error
fatal_error
```

不要所有 callback 都只：

```text
Loading...
```

---

# 8. Register

完整恢复旧产品能力。

核实：

```text
email
password
invite code
captcha
email verification
registration enabled
pending session
terms
```

只保留真实能力。

---

# 9. Registration Disabled

如果 backend/public settings 表示：

```text
registration disabled
```

必须：

```text
navigation
page
submit
backend
```

语义一致。

不能只隐藏注册链接。

---

# 10. Email Verification

完整测试：

```text
initial request
send code
cooldown
verify
expired code
wrong code
already verified
resend
```

根据实际 backend contract。

---

# 11. Forgot / Reset Password

必须覆盖：

```text
request reset
generic success response
token/code
expiration
invalid token
password validation
success
```

---

# 12. Account Enumeration

Forgot Password UX 不应无必要泄漏：

```text
email exists
email does not exist
```

保持 backend 安全语义。

---

# 13. OAuth Shared Architecture

不要：

```text
LinuxDo 一套 callback
OIDC 一套 callback
WeChat 一套 callback
DingTalk 一套 callback
```

各自复制 session logic。

抽取合理：

```text
OAuthCallbackState
OAuthCallbackResult
completeOAuthLogin()
persist session
redirect resolver
error normalization
```

Provider-specific logic保持 domain-specific。

---

# 14. OAuth State

研究 backend contract。

如果 frontend 参与：

```text
state
nonce
PKCE verifier
```

必须严格保持。

禁止：

```text
忽略 state mismatch
```

---

# 15. OAuth Callback Query Data

处理：

```text
code
state
error
error_description
provider-specific params
```

完成后：

尽快从用户可见 URL 中清除敏感/临时参数。

---

# 16. OAuth Error UX

区分：

```text
user denied
state invalid
expired flow
provider unavailable
backend error
account conflict
email required
```

不能全部：

```text
OAuth failed
```

---

# 17. Callback Replay

重复刷新：

```text
/auth/.../callback?code=...
```

不能：

```text
重复创建用户
重复绑定
产生混乱 session
```

确保 backend/frontend replay semantics 正确。

---

# 18. Redirect Safety

任何：

```text
redirect
returnTo
next
```

参数都必须防：

```text
open redirect
```

默认只允许：

```text
same-origin internal route
```

除非明确 backend contract 允许其他行为。

---

# 19. DingTalk Email Completion

如果 OAuth 返回：

```text
requires email completion
```

必须完整迁移：

```text
pending auth state
email form
validation
completion
session creation
redirect
expiration
```

刷新页面不能产生半登录死状态。

---

# 20. OAuth Pending Session

调查旧 frontend：

```text
pending auth session
```

语义。

必须处理：

```text
refresh
new tab
expired
cancel
successful completion
```

---

# 21. Login Redirect

用户访问：

```text
/keys
```

未登录：

```text
→ /login?redirect=/keys
```

登录/OAuth 成功：

```text
→ /keys
```

不能永远回 Dashboard。

---

# 22. Backend Mode

旧 Router 有特殊：

```text
backend mode
```

公共路由 allowlist。

必须恢复完整 parity。

至少审计：

```text
/login
/key-usage
/setup
/payment/result
/payment/airwallex
/legal
callbacks
pending-auth register/email verify
```

不要直接复制列表。

以当前 backend + old frontend 为准重新验证。

---

# 23. Profile Security — TOTP

Goal 3 中 deferred 的：

```text
TOTP
```

本阶段完成。

核实：

```text
setup
QR/secret
verify
enable
disable
step-up
recovery
```

实际支持能力。

---

# 24. TOTP Secret Safety

TOTP secret：

禁止：

```text
console
toast
URL
analytics
persistent localStorage
```

只在必要生命周期内存在。

---

# 25. TOTP Enable

典型流程：

```text
request setup
↓
show QR
↓
user enters code
↓
verify
↓
enable
```

失败不得假装 enabled。

---

# 26. Passkeys

完整迁移旧 Passkey 功能。

包括实际存在的：

```text
register credential
list credentials
rename
delete
authenticate / step-up
```

---

# 27. WebAuthn

必须正确处理：

```text
navigator.credentials.create
navigator.credentials.get
```

以及：

```text
NotAllowedError
SecurityError
InvalidStateError
user cancel
timeout
unsupported browser
```

不要把 cancel 当系统错误。

---

# 28. Passkey Browser Boundary

WebAuthn 必须处于明确：

```text
client-only
secure context
```

boundary。

SSR 不得访问 navigator credential APIs。

---

# 29. OAuth Bind / Unbind

Profile 中：

```text
bind provider
unbind provider
```

必须与 Login OAuth 区分。

不能使用同一 callback 后错误：

```text
创建新 session/account
```

替代 binding。

---

# 30. Last Login Method

如果解绑 OAuth 会导致用户：

```text
没有密码
没有 passkey
没有其他 OAuth
```

无法再登录，

保持旧 backend/frontend 防护。

---

# GROUP A — Auth & Account Security

先完成：

```text
register
email verify
forgot/reset

OAuth login callbacks

DingTalk completion

TOTP
Passkey
OAuth binding
```

完成后运行全部门禁。

---

# 31. Payment Is Separate Group

Auth Group green 后，

再开始 Payment。

不要两组同时大规模修改。

---

# 32. Payment Source Of Truth

对 Payment 逐条确认：

```text
frontend action
↓
backend order create
↓
payment provider
↓
provider callback / polling
↓
backend order status
↓
frontend final state
```

Frontend 不得自己判定：

```text
paid=true
```

支付结果最终必须以后端为准。

---

# 33. Order Creation

用户点击购买：

防：

```text
double click
double order
```

UI：

```text
disabled
loading
```

并调查 backend 是否支持：

```text
idempotency
```

---

# 34. Money Precision

绝对不要：

```ts
parseFloat(price)
```

后随意计算金额。

明确 backend unit：

```text
cent
decimal string
integer
```

显示和请求保持 precision。

---

# 35. Currency

不要默认：

```text
USD
```

除非 backend/plan 明确。

使用真实：

```text
amount
currency
```

---

# 36. QR Payment

迁移：

```text
/payment/qrcode
```

完整状态：

```text
creating
waiting
paid
expired
failed
canceled
```

---

# 37. QR Polling

Polling 必须：

```text
start
interval
stop on terminal state
stop on unmount
stop on timeout
```

不能离开页面后仍然无限请求。

---

# 38. Polling Visibility

考虑：

```text
document.visibilityState
```

合理降低后台 tab polling。

不要求过度优化，

但禁止明显 request storm。

---

# 39. Order Terminal State

统一定义：

```text
paid
failed
expired
canceled
refunded
```

具体 enum 由 backend 决定。

Unknown safe fallback。

---

# 40. Stripe

迁移 Stripe flow。

确保浏览器 SDK：

```text
client-only
```

不要 SSR import/runtime 崩溃。

---

# 41. Stripe Key Safety

Frontend 只能使用：

```text
publishable key
```

绝不能：

```text
secret key
```

进入 bundle。

---

# 42. Stripe Result

Stripe 成功 UI：

不能仅依据：

```text
SDK says success
```

最终查询 backend order status。

---

# 43. Stripe Popup

如果旧系统仍使用 popup：

完整处理：

```text
popup blocked
popup closed
message
origin validation
timeout
success
failure
```

---

# 44. postMessage Security

如果 popup 使用：

```ts
window.postMessage
```

必须校验：

```text
event.origin
expected message shape
flow/order identity
```

禁止：

```ts
window.addEventListener("message", e => trust(e.data))
```

---

# 45. Airwallex

完整迁移：

```text
SDK load
mount
payment
callback
cleanup
error
```

---

# 46. Airwallex Client Boundary

同样：

```text
window
document
SDK
```

不得 SSR 访问。

---

# 47. Provider Script Failure

第三方 SDK load 失败时：

显示：

```text
recoverable ErrorState
Retry
```

不能 blank page。

---

# 48. Payment Result

`/payment/result` 是关键公共/半公共 route。

必须：

```text
validate identifiers
load backend order
show authoritative status
```

不要信任 URL：

```text
?status=success
```

直接显示成功。

---

# 49. WeChat Payment Callback

如果仍存在：

```text
/auth/wechat/payment/callback
```

先确认它属于：

```text
auth provider callback
```

还是：

```text
payment flow callback
```

不要仅根据目录名称判断。

按真实 backend contract 实现。

---

# 50. Payment Feature Flag

`payment_enabled=false`：

必须一致影响：

```text
sidebar
purchase
orders entry
admin payment
direct URL
```

但：

已产生订单的 callback/result route 是否仍必须允许访问，

必须按旧 frontend/backend 行为判断。

不要粗暴全部禁止。

---

# 51. Existing Order During Payment Disable

特殊测试：

```text
order created
↓
admin disables payment
↓
provider callback returns
```

已存在订单不能因此无法完成正确状态处理。

---

# GROUP B — Payment Providers

完成：

```text
QR
Stripe
Stripe Popup
Airwallex
Payment Result
relevant callback
```

不访问真实生产支付。

---

# 52. Payment E2E

使用：

```text
mock backend
provider sandbox
or provider SDK mocks
```

禁止：

```text
真实扣款
```

---

# 53. Payment E2E Cases

至少：

```text
create order
double submit blocked

QR waiting → paid
QR expired

Stripe success
Stripe cancel
Stripe provider error

Airwallex success
Airwallex error

result pending
result paid
result failed

payment feature disabled
```

---

# 54. Setup

单独处理：

```text
/setup
```

这是系统 bootstrap。

不能当普通 Form。

---

# 55. Setup Status

进入 `/setup`：

先：

```text
GET setup status
```

如果：

```text
needs_setup=false
```

redirect：

```text
admin → /admin/dashboard
user → /dashboard
anonymous → appropriate route
```

按旧行为。

---

# 56. Setup Failure

如果 setup status 请求失败：

旧 Router 允许 setup 保持可达。

重新核实这一 fail strategy。

不要误 redirect 导致：

```text
fresh install permanently inaccessible
```

---

# 57. Setup Submission

完整：

```text
validation
submit
loading
backend error
success
initial admin/session
redirect
```

禁止 double submit。

---

# 58. Setup Race

两个 tab 同时初始化：

Frontend 不应出现：

```text
two successful setup flows
```

最终 backend 为准。

第二个 flow 要能理解：

```text
already initialized
```

---

# 59. Setup Secrets

数据库/Redis/admin password 等若存在：

禁止泄漏到：

```text
console
URL
toast
error serialization
```

---

# GROUP C — Setup

Setup 单独完成并跑测试。

---

# 60. Custom Page

Goal 3 留下：

```text
/custom/:id
```

PARTIAL。

现在完成。

---

# 61. Custom Page Contract

确认 backend 返回：

```text
title
content
format
visibility
auth
menu metadata
```

真实字段。

---

# 62. HTML Sanitization

旧 frontend 使用 DOMPurify 的语义不得丢失。

如果支持 HTML/Markdown：

流程：

```text
backend content
↓
markdown conversion if applicable
↓
DOMPurify
↓
render
```

---

# 63. XSS Tests

至少测试：

```html
<script>alert(1)</script>

<img src=x onerror=alert(1)>

<a href="javascript:alert(1)">x</a>

<iframe ...>

style/event handlers
```

确保不能执行。

---

# 64. Link Safety

动态内容：

外部链接合理：

```text
rel="noopener noreferrer"
```

禁止 unsafe URL scheme。

---

# 65. Custom Page Missing

处理：

```text
404
disabled
permission denied
empty
backend error
```

不能统一 blank page。

---

# 66. Custom Menu

如果 Admin Settings 支持：

```text
custom menu items
```

确保：

```text
menu → custom page
```

完整联通。

Settings 更新后 UI及时更新。

---

# 67. Model Plaza

Goal 3 留下：

```text
/model-plaza
```

PARTIAL。

本阶段完成。

---

# 68. Model Plaza Flags

旧 Router 有：

```text
model_plaza_enabled
model_plaza_require_auth
```

必须完整 parity。

状态矩阵：

```text
enabled=false

enabled=true + auth not required

enabled=true + auth required + anonymous

enabled=true + auth required + logged in
```

---

# 69. Backend Mode + Model Plaza

旧逻辑还有：

```text
backend mode
```

下的特殊限制。

必须测试。

---

# 70. Model Plaza Error

Public Settings 加载失败：

不要误判：

```text
disabled
```

与旧 fail-closed/backend 语义保持一致。

Backend API 仍是最终兜底。

---

# GROUP D — Dynamic/Public

完成：

```text
/custom/:id
/model-plaza
```

---

# 71. Public Route Policy

Goal 5 最后建立统一 Public Route Policy。

禁止散落：

```text
这个 callback 可以匿名
那个 payment result 自己放行
```

集中描述：

```text
public
pending-auth-only
authenticated
admin
backend-mode-allowed
feature-flagged
```

---

# 72. Route Matrix

创建：

```text
docs/frontend-route-policy.md
```

至少：

```text
Route
Anonymous
Pending Auth
User
Admin
Backend Mode
Simple Mode
Payment Flag
Risk Flag
Other Flag
```

---

# 73. Refresh Safety

所有特殊 route 测试：

```text
direct URL
browser refresh
back
forward
new tab
duplicate callback
```

不能只测试 SPA navigation。

---

# 74. Cross-tab Auth

至少测试：

```text
Tab A logout
Tab B callback

Tab A login user1
Tab B OAuth user2

refresh in-flight
session replaced
```

Goal 2 已有 session race architecture。

不要在 callback 重新绕开它。

---

# 75. Sensitive URL Audit

搜索所有：

```text
token
access_token
refresh_token
secret
api_key
password
credential
```

确认不会无必要进入：

```text
query string
hash
document.title
analytics
console
```

---

# 76. localStorage Audit

只允许必要：

```text
auth tokens
safe preference
flow identifier where justified
```

临时：

```text
OAuth state
PKCE
payment secret
TOTP
```

能用 session-scoped 就不要长期 localStorage。

以安全/兼容性最佳方案为准。

---

# 77. Logging Audit

搜索：

```text
console.log
console.warn
console.error
```

确保错误对象中不会展开：

```text
tokens
credentials
payment details
OAuth code
TOTP secret
```

---

# 78. SSR Audit

重点搜索：

```text
window
document
navigator
localStorage
sessionStorage
Stripe
Airwallex
credentials
```

所有 browser-only 代码必须 client-safe。

---

# 79. Hydration

测试：

```text
callback direct load
payment direct load
setup direct load
custom page direct load
model plaza direct load
```

没有 hydration mismatch。

---

# 80. Error Recovery

Special Flow 必须尽可能给用户恢复路径。

例如：

```text
OAuth expired
→ Back to login

payment provider failed
→ Retry / Orders

setup failed
→ Retry

custom page failed
→ Retry

passkey canceled
→ Try again / password login
```

不要 dead-end。

---

# 81. Unknown State

当 backend 返回未知新 enum：

不能 crash。

显示安全 fallback。

尤其：

```text
OAuth status
payment status
order status
security method
```

---

# 82. i18n

Special Flow 全部：

```text
zh
en
```

包括：

```text
processing
redirecting
cancel
expired
provider error
payment result
security error
setup
```

---

# 83. Responsive

至少测试：

```text
390×844
768×1024
1440×900
```

特别：

```text
QR code
OAuth errors
payment SDK iframe
setup form
passkey dialog
model cards
dynamic HTML
```

---

# 84. Dark Mode

支付 SDK 自身不一定受控，

但外层：

```text
background
loading
error
result
```

必须一致。

---

# 85. Accessibility

重点：

```text
QR alternative text/instructions
form labels
error role=alert
focus after callback error
dialog
keyboard
passkey fallback
```

---

# 86. Tests — Auth

增加：

```text
auth-special.spec.ts
```

至少：

```text
register
email verify
forgot/reset

OAuth success
OAuth denial
OAuth state mismatch
callback backend failure
redirect restoration

DingTalk email completion

TOTP enable/error
Passkey cancel/success
```

---

# 87. Tests — Payment

增加：

```text
payment-flows.spec.ts
```

至少前述 provider matrix。

---

# 88. Tests — Setup

```text
setup.spec.ts
```

至少：

```text
needs setup
already initialized
status API failure
validation
submission success
submission conflict
```

---

# 89. Tests — Dynamic Routes

```text
dynamic-public.spec.ts
```

覆盖：

```text
custom page sanitized
custom 404
model plaza disabled
model plaza public
model plaza auth-required
backend mode
```

---

# 90. Unit Security Tests

增加高价值 tests：

```text
safe redirect
OAuth state handling
payment status normalization
postMessage origin validation
custom HTML sanitization
masked secret preservation
route policy
```

---

# 91. No Real Provider Dependency In CI

CI/E2E 不得依赖：

```text
LinuxDo
DingTalk
WeChat
OIDC external server
Stripe production
Airwallex production
```

使用：

```text
backend mocks
provider sandbox contract
SDK adapter mocks
```

---

# 92. Adapter Boundary

第三方 SDK 推荐建立薄 adapter：

```text
lib/providers/stripe
lib/providers/airwallex
lib/auth/webauthn
```

目的：

```text
testability
cleanup
client boundary
```

不是构建巨大 abstraction framework。

---

# 93. Final Migration Scan

完成后扫描整个：

```text
frontend-new
```

而不是仅新改文件。

检查：

```text
alert(
window.confirm
TODO
next iteration
.catch(() =>
hardcoded sensitive secret
unsafe dangerouslySetInnerHTML
unvalidated redirect
unvalidated postMessage
direct third-party SDK SSR import
```

---

# 94. Old Frontend Feature Parity

重新扫描旧：

```text
frontend/src/router
frontend/src/views
frontend/src/api
```

建立最后 diff：

```text
Old route/function
→ New equivalent
```

任何没有 equivalent 的功能：

必须：

```text
VERIFIED
or
REMOVED_WITH_REASON
```

不能：

```text
forgotten
```

---

# 95. Definition Of VERIFIED — Special Flow

必须满足：

```text
backend contract verified
complete state machine
refresh-safe
direct-load-safe
security reviewed
error recovery
feature flags
route policy
i18n
responsive
dark
a11y
E2E
```

---

# 96. Auditor

实现结束后运行独立 Auditor。

重点不是普通 UI。

重点：

```text
OAuth CSRF/state
redirect vulnerability
callback replay
session race
token leak

double payment
payment false success
poll leak
postMessage origin

WebAuthn error handling
TOTP secret leak

Setup lockout

XSS
unsafe HTML

feature flag bypass
backend mode bypass
```

---

# 97. P0 Examples

以下自动视为 P0：

```text
XSS
open redirect
token/secret leakage
wrong-account session
payment false-positive
duplicate charge/order due frontend
auth bypass
admin bypass
setup takeover
```

必须修复后才可 Approved。

---

# 98. Quality Gates

每组：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

全部 green。

---

# 99. Final Goal 5 Report

输出：

```text
Special routes discovered
VERIFIED
REMOVED_WITH_REASON
Remaining

Auth flows
OAuth providers
TOTP
Passkeys
Binding

Payment providers
QR
Stripe
Airwallex
Result flow

Setup

Custom Page
Model Plaza

Security audit
Route-policy audit
Backend-mode audit

Unit tests
E2E tests

P0/P1/P2/P3

lint
typecheck
test
build
e2e
```

---

# 100. Stop Condition

Goal 5 完成：

**停止。**

不要删除：

```text
frontend/
```

不要：

```text
frontend-new → frontend
```

不要修改 production build cutover。

下一阶段专门做：

```text
GOAL 6
Full-System QA
+
Visual Regression
+
Behavioral Parity
+
Production Cutover Readiness
```

---

# Final Objective

Goal 5 完成以后：

```text
Old Vue frontend
```

应该已经：

> 没有任何独占业务能力。

但仍保留作为最后一次：

```text
parity oracle
```

直到 Goal 6 完成。

此阶段成功标准：

```text
User       ✅
Admin      ✅
Auth       ✅
OAuth      ✅
Security   ✅
Payment    ✅
Setup      ✅
Dynamic    ✅
```

而不是：

```text
大多数页面能打开
```

最终要求是：

> 所有特殊生命周期都可被正确进入、刷新、失败、恢复和完成。
