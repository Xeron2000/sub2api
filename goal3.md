# GOAL 3 — Sub2API Full User Frontend Migration

## Mission

在 Goal 2 已通过 Auditor Approved、Design/UX Patterns 已冻结的基础上：

**完整迁移并生产化 Sub2API 普通用户侧前端。**

本阶段不是继续设计 UI。

本阶段核心工作变为：

```text
Existing Frozen Pattern
+
Backend Contract
+
Old Frontend Behavior
=
Production-ready User Feature
```

---

# 0. Source Of Truth

优先级：

```text
Backend
>
Existing Tests
>
Old Vue Frontend
>
Documentation
>
Inference
```

Backend 是 API Contract Source of Truth。

旧 Vue frontend 是：

* behavior oracle
* edge-case reference
* workflow reference

但不是视觉参考。

---

# 1. Frozen Pattern Is Immutable

必须首先阅读：

```text
docs/frontend-patterns.md
AGENTS.md
docs/frontend-pattern-audit.md
```

Goal 2 已冻结：

```text
AppShell
PageContainer
PageHeader
PageSection

DataTable
DataTablePagination

Form
Dialog
ConfirmDialog

EmptyState
ErrorState
LoadingState

StatusBadge
CopyButton

Search
Filter
Pagination

Theme
i18n
Async feedback
```

本阶段不得为了某一个页面方便而随意修改 Frozen Pattern。

如果发现 Frozen Pattern 无法满足需求：

先判断：

> 这个需求是否应该成为全 Sub2API 通用能力？

如果否：

使用轻量 domain-specific composition。

如果是：

记录：

```text
Pattern Change Proposal
Reason
Affected Pages
Backward Compatibility
```

再进行最小修改。

禁止 silent pattern drift。

---

# 2. Scope

本阶段聚焦普通用户功能。

优先完整迁移：

```text
/dashboard       already hardened
/keys            already hardened

/usage
/redeem
/affiliate
/available-channels
/profile
/subscriptions
/monitor
/batch-image
/key-usage
```

如果实际 Router / backend 中还存在其他普通用户页面：

自动识别并加入 inventory。

---

# 3. Explicitly Out Of Scope

本阶段不要深入重写：

## Admin

```text
/admin/*
```

除 Goal 2 已完成的 `/admin/users` 外保持现状。

Admin 全量迁移属于 Goal 4。

---

## Payment Provider Flows

暂不重构：

```text
/payment/qrcode
/payment/result
/payment/stripe
/payment/airwallex
/payment/stripe-popup
```

以及任何：

```text
Stripe SDK
Airwallex SDK
WeChat payment callback
payment polling
provider callback
```

这些属于 Special Flows Goal。

---

## OAuth / Auth Special Flows

暂不深入改：

```text
/auth/*/callback
email verification special callback
OIDC callback
LinuxDo callback
DingTalk callback
WeChat callback
```

除非普通用户页面迁移必须修复一个明确 blocker。

---

## Setup

```text
/setup
```

单独留给 Special Flows。

---

# 4. First Task — Build User Feature Inventory

不要直接开始改页面。

扫描：

```text
frontend/src/router
frontend/src/views/user
frontend/src/api
frontend/src/types
frontend/src/stores

frontend-new/src/routes
frontend-new/src/lib/api

backend routes
backend handlers
backend DTOs
```

生成：

```text
docs/frontend-user-migration.md
```

表格至少：

```text
Route
Feature
Old Vue Page
Backend Endpoints
Role
Feature Flag
Current React Status
Behavior Parity
E2E Status
Notes
```

状态：

```text
NOT_STARTED
SCAFFOLD_ONLY
PARTIAL
MIGRATED
VERIFIED
```

---

# 5. Detect Scaffold-Only Pages

Goal 1 已经生成不少 route 文件。

**文件存在不代表 feature migrated。**

自动扫描：

```text
alert(
console.log(
TODO
placeholder
mock
next iteration
.catch(() =>
fake empty
fake zero
hardcoded sample
disabled action without reason
```

并检查：

```text
Button exists but no real mutation
Form exists but no POST/PUT
Table exists but missing filters
UI exists but old feature disappeared
```

所有这些标记为：

```text
SCAFFOLD_ONLY
```

或：

```text
PARTIAL
```

---

# 6. No Fake Parity

禁止：

> 页面大概长这样，所以算迁移完成。

迁移完成必须同时满足：

```text
Route parity
Behavior parity
API parity
Permission parity
State parity
UX parity
Error parity
i18n parity
Responsive parity
```

---

# 7. API Layer Rule

Route Components 不应该散落：

```ts
apiClient.get(...)
apiClient.post(...)
apiClient.put(...)
apiClient.delete(...)
```

为每个 feature 建立明确 API layer。

例如：

```text
src/lib/api/usage.ts
src/lib/api/redeem.ts
src/lib/api/affiliate.ts
src/lib/api/channels.ts
src/lib/api/profile.ts
src/lib/api/subscriptions.ts
```

Route 主要做：

```text
query orchestration
mutation orchestration
page composition
```

---

# 8. API Contract Table

对每个 feature 建立：

```text
UI Action
→ frontend API function
→ HTTP method
→ path
→ request DTO
→ backend handler
→ response DTO
→ query invalidation
```

不要猜。

必须实际读取 backend。

---

# 9. DTO Type Safety

禁止为了快速迁移大量：

```ts
any
unknown as
Record<string, any>
```

为真实 Backend Response 建立 DTO。

特别检查：

```text
nullable
optional
enum
number/string mismatch
pagination
money
quota
usage
timestamp
timezone
```

---

# 10. Query Keys

所有 Server State 使用 TanStack Query。

每个 feature 使用统一：

```text
queryKeys
```

例如：

```ts
queryKeys.usage.list(filters)
queryKeys.usage.summary()

queryKeys.subscriptions.list()
queryKeys.subscriptions.current()

queryKeys.affiliate.summary()
queryKeys.affiliate.records()

queryKeys.channels.available()
queryKeys.channels.status()
```

不要页面自己散落：

```ts
["usage"]
["usage-data"]
["currentUsage"]
```

---

# 11. AbortSignal

所有 list/search/filter Query：

必须转发：

```ts
signal
```

到 API Client。

保持 Goal 2 已冻结的 race-safety。

---

# 12. No Silent Error

绝对禁止：

```ts
.catch(() => [])
.catch(() => ({ total: 0 }))
.catch(() => null)
```

把：

```text
500
timeout
network error
```

伪装成：

```text
empty
zero
```

必须明确区分：

```text
0
```

和：

```text
failed to load
```

---

# 13. Auth Guard

所有 authenticated user route：

必须使用 Goal 2 Frozen Auth Guard。

不能只依赖 Sidebar。

测试：

```text
anonymous → redirect login
normal user → allowed
admin → allowed if user feature supports
```

---

# 14. Usage Page

完整迁移 `/usage`。

必须读取旧 frontend + backend，恢复真实能力。

至少核实：

```text
usage records
date range
model/provider filtering
API key filtering
pagination
usage totals
cost
tokens
request count
sorting
export if supported
```

只实现 backend/旧产品真实存在的能力。

---

# 15. Usage Formatting

统一 formatter。

不要页面自行：

```ts
value.toFixed(...)
new Date(...).toLocaleString(...)
```

建立或复用：

```text
formatMoney
formatNumber
formatTokens
formatDateTime
formatPercentage
```

---

# 16. Usage Filter UX

复用 Frozen Toolbar。

合理组合：

```text
Search
Date Range
Model
API Key
Status
Clear
Refresh
```

实际存在什么由 backend 决定。

Filter 改变：

```text
page → 1
```

---

# 17. Usage Loading / Empty / Error

必须区分：

```text
Loading
Empty usage
Backend Error
Populated
```

Empty State 要描述：

> 当前筛选条件没有 usage records

而不是统一：

```text
No data
```

---

# 18. Redeem Page

迁移 `/redeem`。

核实真实流程：

```text
redeem code input
validation
redeem mutation
success result
balance/quota update
error code handling
```

---

# 19. Redeem Mutation

统一：

```text
Submit
↓
Loading
↓
Backend result
```

成功：

```text
toast
+
relevant query invalidation
+
clear or preserve form according to old UX
```

失败：

保留输入。

显示明确 error。

禁止重复提交。

---

# 20. Affiliate Page

完整迁移 `/affiliate`。

核实：

```text
invite code
invite link
copy
commission
referrals
statistics
history
withdraw-related info if supported
```

不要根据页面名称自行发明功能。

---

# 21. Affiliate Copy UX

所有邀请码/邀请链接复制：

必须使用 Frozen：

```tsx
<CopyButton />
```

禁止：

```ts
navigator.clipboard.writeText(...)
```

散落。

---

# 22. Available Channels

完整迁移：

```text
/available-channels
```

核实 backend 提供：

```text
channel
model
availability
pricing
capabilities
status
provider
limits
```

哪些字段。

---

# 23. Channel Status Semantics

Channel 状态统一通过：

```text
StatusBadge
```

或：

```text
ChannelStatusBadge
```

domain wrapper。

不要页面自己决定：

```text
green/red/yellow
```

---

# 24. Monitor / Channel Status

迁移：

```text
/monitor
```

核实它与：

```text
available-channels
```

是否重复。

如果业务语义不同：

保持分开。

如果旧 frontend 本就两个页面：

不要为了“简化”强行合并。

---

# 25. Profile Page

完整迁移 `/profile`。

核实：

```text
account info
nickname/name
email
password
locale
security
passkey
OAuth binding
2FA
preferences
```

具体以现有 backend + old frontend 为准。

---

# 26. Profile Section Architecture

Profile 通常不是 DataTable 页面。

使用：

```text
PageHeader

PageSection
  Account

PageSection
  Security

PageSection
  Preferences
```

保持信息层级。

不要塞成几十个独立 Card。

---

# 27. Security-sensitive Actions

例如：

```text
change password
unbind provider
delete credential
revoke passkey
```

必须：

* 后果明确
* ConfirmDialog if destructive
* loading
* error
* success feedback

禁止 browser confirm。

---

# 28. Sensitive Data

禁止：

```text
password
token
secret
API key secret
refresh token
```

进入：

```text
console.log
toast
error serialization
URL query
```

---

# 29. Subscriptions

完整迁移：

```text
/subscriptions
```

核实：

```text
current subscription
plan
quota
period
expiration
status
renewal
history
limits
```

---

# 30. Subscription Status

不要简单把所有状态映射成：

```text
active green
else red
```

读取 backend enum。

建立：

```text
SubscriptionStatus
```

domain semantic mapping。

---

# 31. Purchase Entry Point

如果 `/subscriptions` 内存在：

```text
Buy
Renew
Upgrade
```

可以正常导航到：

```text
/purchase
```

但不要在本阶段重构 Payment Provider 内部流程。

---

# 32. Purchase Page Boundary

如果普通用户 journey 必须展示 `/purchase`：

可以迁移：

```text
plan selection
price display
order creation entrypoint
```

但：

```text
Stripe SDK
Airwallex
QR payment polling
provider callbacks
```

留给 Special Flow Goal。

如果无法安全拆分：

在 migration doc 中标记：

```text
DEFERRED_SPECIAL_FLOW
```

不要写假功能。

---

# 33. Batch Image Guide

迁移：

```text
/batch-image
/docs/batch-image
```

重点：

```text
documentation readability
code blocks
copy
responsive
i18n
```

如果它只是 guide：

不要为了“组件化”引入复杂 server state。

---

# 34. Key Usage

迁移：

```text
/key-usage
```

注意它可能是：

```text
public / semi-public
```

必须核实旧 router 的 auth requirement。

不要因为名字包含 key 就默认 requiresAuth。

---

# 35. Key Usage Security

如果页面允许：

```text
输入 API key 查看 usage
```

确认：

* key 是否进入 URL
* 是否进入 browser history
* 是否进入 logs
* 是否进入 analytics

敏感 token 尽量不要进入 query string。

保持旧 backend contract 的同时检查风险。

---

# 36. Route Metadata

每一个迁移页面：

必须：

```text
title
description where appropriate
i18n
```

使用 Frozen route metadata architecture。

不能重新出现：

```text
TanStack Start Starter
```

或 hardcoded English title。

---

# 37. Sidebar Parity

用户页面迁移完成后重新审核：

```text
AppSidebar
```

确保：

```text
visible route
actual accessible route
feature enabled
```

一致。

不要出现：

```text
Sidebar hidden
but URL works unexpectedly
```

或：

```text
route exists
but no navigation
```

除非明确属于 deep-link 页面。

---

# 38. Feature Flags

读取旧 frontend/backend 的 feature flags。

例如：

```text
payment enabled
affiliate enabled
channel monitoring enabled
registration settings
other runtime settings
```

如果某菜单/页面受 flag 控制：

三层保持一致：

```text
Navigation
Route
Backend Behavior
```

---

# 39. Empty State Quality

每个页面根据业务提供 contextual Empty State。

例如：

```text
No usage records for this period.
```

```text
No subscriptions yet.
```

```text
No available channels.
```

不要所有页面：

```text
No data.
```

---

# 40. Error State Quality

Page Error：

```text
ErrorState
```

Operation Error：

```text
inline / toast
```

Field Error：

```text
form field
```

严格遵守 Goal 2 Frozen Feedback Pattern。

---

# 41. Toast Discipline

不要变成：

```text
任何请求成功都 toast
```

只给需要确认的 mutation：

```text
saved
redeemed
updated
copied
deleted
```

普通：

```text
page load
filter
pagination
background refresh
```

不要 toast。

---

# 42. Loading Discipline

禁止：

```text
整个页面 spinner
```

作为所有场景统一答案。

遵循：

```text
initial page → Skeleton / LoadingState
mutation → button loading
background refetch → preserve stale data
small widget → local skeleton
```

---

# 43. Stale Data

TanStack Query background refresh：

优先保留已有数据。

不要：

```text
每次 filter/refresh
↓
整个页面消失
↓
Loading...
```

除非数据语义要求。

---

# 44. Forms

所有 Form：

```text
React Hook Form
+
Zod
```

不允许：

```text
10 个 useState 控 Form
```

如果 Form 极简单且没有 validation，可以合理例外，但保持一致 UX。

---

# 45. Backend Validation

对于：

```text
400
409
422
```

尽可能映射到：

```text
field error
```

如果无法定位 field：

使用 Form-level error。

不要只：

```text
toast.error("Request failed")
```

---

# 46. Responsive

所有 Goal 3 页面至少验证：

```text
390×844
768×1024
1440×900
```

重点：

```text
table horizontal scroll
filter toolbar wrap
cards
forms
long identifiers
long emails
long model names
large numbers
```

---

# 47. Dark Mode

每一个 Goal 3 页面：

必须：

```text
light
dark
```

均可用。

禁止引入：

```text
bg-white
text-black
gray arbitrary color
hex
```

绕过 semantic token。

---

# 48. i18n

全部用户可见文本：

```text
zh
en
```

禁止硬编码：

```text
Refresh
Search
Save
No data
Status
```

包括：

```text
empty states
errors
dialog title
form validation
tooltips
table headers
```

---

# 49. Long English Text

英语模式测试：

```text
button overflow
dialog overflow
toolbar wrap
table header width
```

不能只测试中文。

---

# 50. Accessibility

至少检查：

```text
Tab
Enter
Space
ESC
focus visible
label
aria-label
aria-invalid
dialog focus trap
```

Icon-only Button 必须：

```text
aria-label
```

---

# 51. No UI Reinvention

本阶段非常重要：

不要为：

```text
Usage
Affiliate
Subscription
Profile
```

各自发明一套视觉体系。

优先：

```text
PageHeader
PageSection
Card
DataTable
StatusBadge
Form
Dialog
```

组合。

---

# 52. Domain Components

允许新增：

```text
components/domain/
```

例如：

```text
SubscriptionStatus
ChannelStatus
UsageSummary
AffiliateSummary
QuotaDisplay
```

仅当：

* 有明确业务语义
* 有真实重复
* 不属于通用 UI primitive

---

# 53. Shared Component Promotion Rule

如果一个新组件只服务：

```text
Subscription
```

不要放：

```text
components/shared
```

除非至少两个无关 feature 真的需要相同行为。

避免 Shared 目录变垃圾场。

---

# 54. Visual Density

继续遵守：

```text
Fast
Calm
Predictable
Consistent
Professional
Dense but not cluttered
```

禁止这阶段：

```text
gradient dashboard
huge hero
glass card
giant metrics
over-animation
```

---

# 55. User Journey E2E

Goal 2 已有基础 Playwright。

本阶段扩展 User E2E。

不要给每个 `<Button>` 都写测试。

测试真实 journey。

---

# 56. Core Journey

至少：

```text
Login
↓
Dashboard
↓
Keys
↓
Usage
↓
Profile
```

验证：

```text
navigation
auth persistence
no console.error
no pageerror
no unexpected failed request
```

---

# 57. Usage E2E

至少：

```text
load populated
empty
API error
filter
pagination if available
```

---

# 58. Redeem E2E

至少：

```text
valid
invalid
double submit prevention
backend error
```

使用测试数据/mock。

不要消耗真实 redemption code。

---

# 59. Affiliate E2E

至少：

```text
load
copy
empty referrals
populated referrals
```

---

# 60. Channels E2E

至少：

```text
available
empty
error
status rendering
```

---

# 61. Profile E2E

测试非破坏性的核心：

```text
load profile
edit supported field
validation
backend error
```

Security destructive flows只在安全 mock 环境测试。

---

# 62. Subscription E2E

至少：

```text
no subscription
active
expired/canceled if supported
```

不要在 E2E 创建真实付费订单。

---

# 63. Browser Error Gate

继续沿用 Goal 2：

```text
console.error
pageerror
unexpected network failure
```

→ test fail。

---

# 64. Contract Tests

增加重要 API unit/contract tests：

```text
DTO normalization
query key
enum/status mapping
formatter
error mapping
```

不用追求 100% coverage。

优先高风险业务逻辑。

---

# 65. Old vs New Behavioral Audit

每迁移完一个页面：

对照旧 frontend。

逐项检查：

```text
Feature exists?
Same backend call?
Same important fields?
Same permission?
Same feature flag?
Same success behavior?
Same failure behavior?
```

记录：

```text
PARITY
INTENTIONAL_CHANGE
DEFERRED
BUG_FIXED
```

---

# 66. Intentional Changes

如果新 frontend 行为故意与旧 frontend 不同：

必须记录原因。

例如：

```text
Old:
API error silently returned empty list

New:
ErrorState

Reason:
Old behavior was incorrect.
```

这种属于：

```text
BUG_FIXED
```

而不是 parity failure。

---

# 67. No Backend Rewrite

Goal 3 原则上：

```text
backend stays unchanged
```

发现 backend bug：

记录：

```text
Backend Blocker
Endpoint
Evidence
Impact
Suggested Fix
```

只有确实无法迁移且修复明显正确时才修改 backend。

不要因为 React 写起来方便就改 API。

---

# 68. Page Size

Route file 应主要做：

```text
orchestration
composition
```

当业务逻辑明显复杂时拆：

```text
feature API
query hooks
domain components
schemas
formatters
```

不要出现：

```text
3000-line route
```

也不要每 10 行拆一个 component。

保持 KISS。

---

# 69. Performance

检查明显问题：

```text
duplicate request
N+1 request
unbounded query
large table render
unnecessary refetch
expensive render
```

不做 premature optimization。

---

# 70. Query Defaults

统一检查：

```text
retry
staleTime
gcTime
refetchOnWindowFocus
```

不要每个页面凭感觉配置。

只有业务需要时 override。

---

# 71. Loading Race

快速：

```text
change filter
change page
navigate away
navigate back
```

不能：

```text
old response overwrite new state
state update after unmount
loading stuck
```

---

# 72. Pagination Edge Cases

测试：

```text
0 rows
1 row
exact one page
multiple pages
last-page delete
filter reduces pages
```

复用 Frozen page correction Pattern。

---

# 73. Data Edge Cases

测试：

```text
null
missing optional
0
very large number
long string
long URL
unknown enum
unicode
```

Unknown enum：

页面不能 crash。

显示：

```text
Unknown
```

或 raw-safe fallback。

---

# 74. Security Sanity

对用户内容：

```text
<script>
HTML
javascript:
very long text
```

确保：

```text
no XSS
no unsafe HTML
no layout catastrophe
```

如果旧 frontend 使用 DOMPurify 的页面迁入 Goal 3：

保留 sanitization semantics。

---

# 75. Update UI Playground Only If Necessary

如果 Goal 3 新增真正通用 Pattern：

才更新：

```text
/dev/ui
```

Domain-only component 不需要全部塞入 Playground。

---

# 76. Migration Report

实时维护：

```text
docs/frontend-user-migration.md
```

最终每个页面：

```text
[x] route
[x] API contract
[x] behavior parity
[x] loading
[x] empty
[x] error
[x] mutations
[x] auth
[x] i18n
[x] dark
[x] responsive
[x] E2E
```

---

# 77. Definition Of Done — Page

任何页面必须全部满足才可以标：

```text
VERIFIED
```

* [ ] Backend contract verified
* [ ] Old behavior audited
* [ ] No fake data
* [ ] No placeholder action
* [ ] Correct route guard
* [ ] Frozen Pattern reused
* [ ] Loading state
* [ ] Empty state
* [ ] Error state
* [ ] Mutation feedback where applicable
* [ ] zh
* [ ] en
* [ ] light
* [ ] dark
* [ ] 390px
* [ ] desktop
* [ ] keyboard usable
* [ ] no console.error
* [ ] E2E / appropriate test

---

# 78. Quality Gate After Each Feature Group

不要等全部写完才测试。

推荐：

```text
Group A
Usage + Key Usage

Group B
Redeem + Affiliate

Group C
Channels + Monitor

Group D
Profile

Group E
Subscriptions
```

每组完成：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

保持 Main always-green。

---

# 79. Final Quality Gate

Goal 3 完成：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

全部通过。

并扫描：

```text
alert(
window.confirm
TODO user action
next iteration
.catch(() =>
console.log
hardcoded user-visible English
direct apiClient calls in migrated routes
```

确认没有违反 Frozen Rule。

---

# 80. Auditor Pass

实现完成后：

开启一次独立 Auditor Pass。

Auditor 重点找：

```text
missing old feature
API contract mismatch
silent error
permission regression
UI pattern drift
UX inconsistency
missing error/empty/loading
i18n leaks
mobile overflow
theme issue
unsafe sensitive data
```

Auditor 不应假设开发 Agent 的报告正确。

---

# 81. Fix Auditor Findings

按照：

```text
P0
↓
P1
↓
P2
↓
P3
```

修复。

修复后重新：

```text
lint
typecheck
unit
build
e2e
```

---

# 82. Stop Condition

本阶段完成后：

停止。

不要自动继续：

```text
/admin/*
payment provider flows
OAuth callbacks
setup
```

输出：

```text
User routes discovered
User routes migrated
Verified
Deferred special flows

API contracts verified
Behavior parity result
Patterns reused
New domain components
Tests added

P0/P1/P2/P3
Quality gate
Remaining risks
```

然后等待 Goal 4。

---

# Final Objective

Goal 3 成功的标志不是：

> React 页面数量增加了。

而是：

> 普通用户可以完全离开旧 Vue frontend，使用新 React frontend 完成所有非特殊流程核心操作。

并且从代码角度：

```text
每个新页面
≈
Frozen Pattern
+
Domain Component
+
Typed API
+
TanStack Query
```

而不是：

```text
每个页面
=
重新发明一套 frontend
```

