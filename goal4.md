# GOAL 4 — Sub2API Full Admin Frontend Migration

## Mission

在 Goal 2 Frozen Pattern 与 Goal 3 User Frontend VERIFIED 的基础上：

**完整迁移 Sub2API Admin Frontend，使管理员可以脱离旧 Vue frontend 完成所有正常后台管理工作。**

核心公式：

```text
Frozen UI/UX Pattern
+
Typed Admin API Layer
+
Backend Contract
+
Old Vue Behavioral Parity
=
Production-ready Admin Frontend
```

本阶段不是重新设计 Admin。

也不是把已有 scaffold route 补成“看起来能用”。

目标是：

> Admin 业务能力真正迁移完成。

---

# 1. Source Of Truth

优先级：

```text
Backend
>
Backend Tests
>
Old Vue Frontend
>
Existing Documentation
>
Inference
```

Backend 是 API Contract Source of Truth。

旧 Vue frontend 是：

```text
behavior oracle
workflow oracle
edge-case oracle
feature inventory oracle
```

不是视觉参考。

---

# 2. Read Before Work

首先阅读：

```text
docs/frontend-patterns.md
docs/frontend-pattern-audit.md
docs/frontend-user-migration.md
AGENTS.md
```

Goal 2 Frozen Pattern 不得 silent drift。

继续严格复用：

```text
AppShell / AdminShell
PageContainer
PageHeader
PageSection

DataTable
DataTablePagination

Search / Filter Toolbar
Dialog
ConfirmDialog

RHF + Zod

LoadingState
EmptyState
ErrorState

StatusBadge
CopyButton

Sonner
Theme
i18n
```

---

# 3. First Deliverable — Admin Inventory

**不要先写代码。**

扫描：

```text
frontend/src/router/index.ts
frontend/src/views/admin/**
frontend/src/features/**
frontend/src/api/**
frontend/src/stores/**

frontend-new/src/routes/admin/**
frontend-new/src/lib/api/**

backend admin routes
backend handlers
backend DTO
backend feature flags
backend tests
```

创建：

```text
docs/frontend-admin-migration.md
```

表格：

```text
Route
Feature
Old Vue Source
Current React Source
Backend Endpoints
Feature Flag
Simple Mode Rule
Risk Level
Current Status
Parity
Tests
Notes
```

状态：

```text
NOT_STARTED
SCAFFOLD_ONLY
PARTIAL
MIGRATED
VERIFIED
DEFERRED_SPECIAL_FLOW
```

---

# 4. Never Trust Existing React Route Existence

当前已有很多：

```text
frontend-new/src/routes/admin/*.tsx
```

但：

> Route file exists ≠ feature migrated.

自动扫描：

```text
direct apiClient
hardcoded English
placeholder action
missing mutation
missing filter
fake DTO
fake default
TODO
alert(
console.log(
.catch(() =>
```

并与旧 Vue 页面能力逐项比较。

---

# 5. Admin Route Inventory

至少检查：

```text
/admin/dashboard

/admin/users
/admin/groups

/admin/channels/pricing
/admin/channels/monitor

/admin/accounts
/admin/proxies

/admin/subscriptions

/admin/announcements

/admin/redeem
/admin/promo-codes

/admin/usage
/admin/audit-logs

/admin/affiliates/invites
/admin/affiliates/rebates
/admin/affiliates/transfers

/admin/orders/dashboard
/admin/orders
/admin/orders/plans

/admin/settings

/admin/risk-control
/admin/prompt-audit

/admin/ops
```

以及扫描旧 Router/Backend 自动发现的其他 Admin 能力。

不要只依据当前 React route tree。

---

# 6. Existing Admin Users

`/admin/users` 已在 Goal 2 hardened。

不要重写。

它现在是：

> Standard Admin CRUD reference implementation.

其他普通 CRUD 页面应优先模仿：

```text
Admin Users
```

的：

```text
query
toolbar
datatable
dialog
mutation
dropdown actions
feedback
pagination
guard
```

---

# 7. Central Admin Guard

所有 `/admin/*` 必须使用统一 Admin Guard。

禁止页面自己：

```ts
JSON.parse(localStorage...)
```

判断权限。

禁止：

```text
page A 一套 guard
page B 一套 guard
page C 没 guard
```

建立/复用统一：

```text
requireAuth
requireAdmin
requireFeature
requireNotSimpleMode
```

architecture。

---

# 8. Three-state Auth

继续保持：

```text
unknown
anonymous
authenticated
```

不得 hydration 时：

```text
Admin page flashes
↓
then redirect
```

---

# 9. Normal-user Direct URL

所有：

```text
/admin/*
```

必须测试：

```text
normal user
→ forbidden / proper redirect
```

不能只隐藏 Sidebar。

---

# 10. Admin Compliance Parity

旧前端存在：

```text
ADMIN_COMPLIANCE_ACK_REQUIRED
HTTP 423
```

以及 Admin Compliance initialization。

必须调查完整行为。

Admin route 进入时：

```text
admin
↓
compliance state
↓
acknowledgement if required
↓
admin content
```

不得因为 React rewrite 丢失。

---

# 11. Feature Flag Parity

重点：

```text
payment_enabled
risk_control_enabled
ops_monitoring_enabled
simple mode
backend mode
```

Navigation / Route / Page / API 行为必须一致。

---

# 12. Simple Mode

旧前端明确限制例如：

```text
/admin/groups
/admin/subscriptions
/admin/redeem
```

等路径。

不要每个页面手写 localStorage 判断。

形成统一 route policy。

---

# 13. Payment Admin Routes

以下 Admin route：

```text
/admin/orders/dashboard
/admin/orders
/admin/orders/plans
```

必须遵循：

```text
payment_enabled
```

如果关闭：

```text
Sidebar
Route
Direct URL
```

行为统一。

---

# 14. Risk Control Routes

```text
/admin/risk-control
/admin/prompt-audit
```

受：

```text
risk_control_enabled
```

控制。

三层一致：

```text
Sidebar
Router
Backend
```

---

# 15. Typed Admin API Layer

禁止 route 中散落：

```ts
apiClient.get(...)
apiClient.post(...)
```

建立例如：

```text
lib/api/admin/dashboard.ts
lib/api/admin/groups.ts
lib/api/admin/accounts.ts
lib/api/admin/channels.ts
lib/api/admin/proxies.ts
lib/api/admin/redeem.ts
lib/api/admin/promo.ts
lib/api/admin/subscriptions.ts
lib/api/admin/usage.ts
lib/api/admin/audit.ts
lib/api/admin/settings.ts
lib/api/admin/risk.ts
lib/api/admin/ops.ts
lib/api/admin/orders.ts
lib/api/admin/affiliate.ts
```

不要求机械地每页一个文件。

按 domain 合理组织。

---

# 16. Query Keys

统一扩展：

```text
queryKeys.admin.*
```

例如：

```ts
queryKeys.admin.groups.list(filters)
queryKeys.admin.groups.detail(id)

queryKeys.admin.accounts.list(filters)

queryKeys.admin.channels.list(filters)

queryKeys.admin.settings.detail()

queryKeys.admin.orders.list(filters)
```

禁止：

```ts
["admin", "groups"]
```

散落页面。

---

# 17. AbortSignal

所有：

```text
list
search
filter
pagination
monitor
logs
```

Query 必须支持：

```text
AbortSignal
```

继续保持 Goal 2/3 race safety。

---

# 18. No Silent Failure

绝对禁止：

```ts
.catch(() => [])
.catch(() => ({ total: 0 }))
```

Admin 尤其不能把：

```text
500
```

显示成：

```text
No users
No accounts
No orders
```

---

# 19. Migration Groups

不要随机迁移。

按照以下 Group 顺序。

---

# GROUP A — Read-heavy Admin

先完成：

```text
/admin/dashboard
/admin/usage
/admin/audit-logs
/admin/announcements
```

目标：

先把：

```text
admin layout
admin query
filter
stats
logs
read-heavy tables
```

稳定下来。

---

# 20. Admin Dashboard

恢复旧 Admin Dashboard 的实际：

```text
system stats
users
usage
accounts
requests
cost
trend
health
```

以 backend 实际提供为准。

不要只做几个假 StatCard。

失败不能显示 0。

---

# 21. Admin Usage

复用 User Usage 已验证的：

```text
formatters
filter concepts
date handling
DataTable
pagination
```

但 Admin 通常还有：

```text
user
key
group
account/provider
```

等额外筛选。

必须从旧 frontend/backend 恢复。

---

# 22. Audit Logs

Audit Log 是典型只读高密度页面。

核实：

```text
actor
action
resource
IP
result
timestamp
details
filters
pagination
```

Sensitive fields 不应无脑全部显示。

---

# 23. Announcements

完整：

```text
list
create
edit
enable/disable
delete
schedule if supported
priority/type if supported
```

使用标准：

```text
CRUD Pattern
```

---

# GROUP B — Business CRUD

完成：

```text
/admin/redeem
/admin/promo-codes
/admin/subscriptions

/admin/orders/dashboard
/admin/orders
/admin/orders/plans

/admin/affiliates/invites
/admin/affiliates/rebates
/admin/affiliates/transfers
```

---

# 24. Redeem Management

完整核实：

```text
create codes
batch create
type
value
quota
expiration
status
usage
delete/disable
export
```

只保留真实 backend 功能。

---

# 25. Promo Codes

与 Redeem Code 不得因为“长得像”而错误合并。

如果 domain semantics 不同：

保持独立 API + Domain types。

---

# 26. Admin Subscriptions

完整恢复：

```text
list
search user
status
plan
period
quota
assign
modify
cancel
delete
```

具体以 backend 为准。

Mutation 后正确 invalidation。

---

# 27. Payment Dashboard

不得创造假 analytics。

只显示 backend 真正提供：

```text
order count
revenue
status
plan distribution
trend
```

---

# 28. Orders

至少检查：

```text
order ID
user
plan
amount
provider
status
created
paid
filters
details
```

退款/取消等 destructive mutation：

只有 backend 支持才提供。

---

# 29. Payment Plans

这是重要 CRUD。

完整：

```text
list
create
edit
enable/disable
pricing
duration
quota
limits
delete
```

根据 backend contract。

---

# 30. Affiliates Admin

三个页面分别核实：

```text
Invites
Rebates
Transfers
```

不要把三张不同业务表粗暴合并。

---

# GROUP C — Infrastructure Management

迁移：

```text
/admin/accounts
/admin/proxies
/admin/channels/pricing
/admin/channels/monitor
```

这是高风险区域。

---

# 31. Accounts

旧 Accounts 页面非常复杂。

不要把它理解成：

```text
ID | Name | Status
```

必须系统提取旧能力。

调查：

```text
provider/account type
credential status
OAuth state
quota
health
priority
weight
group
proxy
model
rate limit
error
refresh
test
enable/disable
batch actions
```

实际支持哪些由 backend 决定。

---

# 32. Credential Safety

绝对禁止 Admin frontend：

```text
console.log(secret)
toast(secret)
URL ?token=
plaintext debug
```

Credential/refresh token/API secret：

只有产品明确需要时可见。

默认 mask。

---

# 33. Account Testing

如果旧系统支持：

```text
Test Account
Refresh Credential
Check Quota
```

必须恢复。

异步 operation：

```text
pending
success
failed
timeout
```

状态清晰。

---

# 34. Proxies

恢复真实：

```text
CRUD
protocol
host
port
auth
status
test
latency
enabled
assignment
```

密码字段不可意外回显。

---

# 35. Channel Pricing

旧 Channels 页面约 69 KB，不是简单 Table。

系统提取：

```text
channel/provider
model
pricing
priority
weight
status
availability
rate
routing
```

---

# 36. Channel Monitor

复用 Goal 3：

```text
monitor architecture
status semantics
formatters
```

但 Admin 可以显示更详细诊断数据。

禁止复制第二套 monitor component ecosystem。

能共享 domain layer 就共享。

---

# GROUP D — Groups

`/admin/groups`

必须单独处理。

旧页面规模很大，是复杂 feature，不是普通 CRUD。

---

# 37. Groups Inventory First

在写 Group UI 前：

专门生成：

```text
docs/admin-groups-parity.md
```

从旧页面提取全部功能。

至少调查：

```text
basic group settings
rate multiplier

models
supported model scopes

image pricing
video pricing

reasoning effort

messages dispatch

profit control

rate limits

group permissions

routing/provider relation

model mapping
```

不要漏掉隐藏 tabs / dialogs。

---

# 38. Group Domain Architecture

允许创建：

```text
features/admin-groups/
```

例如：

```text
api.ts
types.ts
schemas.ts

components/
  GroupForm
  ModelPricingEditor
  ProfitControlEditor
  ReasoningPolicyEditor
```

但保持 KISS。

不要把旧 267 KB 单文件简单翻译成一个：

```text
GroupsPage.tsx 12000 lines
```

---

# 39. Group Editor UX

复杂配置：

优先：

```text
Page / Tabs / Sections
```

而不是：

```text
巨大 Dialog
```

简单 Create/Edit basic info 才适合 Dialog。

---

# 40. Pricing Precision

所有：

```text
rate
multiplier
token pricing
image pricing
video pricing
```

必须验证：

```text
decimal precision
unit
null
0
percentage vs multiplier
```

这是高风险数据。

禁止 UI 自己随意 round。

---

# GROUP E — System / Risk / Ops

最后处理：

```text
/admin/settings
/admin/risk-control
/admin/prompt-audit
/admin/ops
```

---

# 41. Settings Is A Feature, Not A Form

旧：

```text
SettingsView.vue
```

规模非常大。

禁止迁移成：

```text
Site Name
Email Template
Save
```

这种简化版。

---

# 42. Settings Inventory

写代码前创建：

```text
docs/admin-settings-parity.md
```

自动提取所有：

```text
setting key
section
frontend control
backend field
default
type
validation
feature dependency
security sensitivity
```

---

# 43. Settings Sections

按真实旧系统组织。

可能涉及：

```text
General
Registration
Auth/OAuth
API behavior
Payment
Email
Risk Control
Monitoring
OpenAI/Claude/Gemini provider policy
Frontend behavior
Security
Custom menu/pages
```

具体以代码为准。

不要凭这份列表发明字段。

---

# 44. Settings Schema

Settings 不允许：

```text
hundreds of useState
```

建立：

```text
typed settings DTO
+
Zod schema where appropriate
+
section components
```

---

# 45. Settings Dirty State

管理员改了设置但没保存：

必须明确。

如果切 section / navigation：

避免无提示丢失。

如果旧产品本就每项即时保存：

保持行为 parity。

---

# 46. Sensitive Settings

例如：

```text
secret
token
client secret
SMTP password
API key
```

必须：

```text
masked
safe update semantics
no accidental clear
```

最危险情况：

Backend 返回：

```text
********
```

Frontend Save 后把：

```text
********
```

当真实密码覆盖回去。

必须检查这种 edge case。

---

# 47. Email Template Editor

旧 Settings 还有专门：

```text
EmailTemplateEditor
```

必须核实：

```text
template variables
preview
validation
save
reset
```

如果产品仍支持则迁移。

---

# 48. Feature Flags From Settings

Settings 改变：

```text
payment_enabled
risk_control_enabled
...
```

成功后：

相关：

```text
Sidebar
route permission
query cache
```

必须及时更新。

不能刷新浏览器后才生效。

---

# 49. Risk Control

旧 Risk Control 页面约 118 KB。

必须先 inventory。

不要仅做：

```text
enabled switch
```

调查：

```text
rules
events
limits
fingerprint
account/user controls
alerts
allow/deny
```

实际能力。

---

# 50. Prompt Audit

保持：

```text
risk_control_enabled
```

feature policy。

调查：

```text
records
filters
prompt display
decision
status
details
actions
```

涉及内容数据时：

处理长文本、code/pre、potential HTML safely。

---

# 51. Ops

Ops Monitoring 与普通 Dashboard 不同。

检查：

```text
health
queue
DB
Redis
requests
errors
latency
workers
runtime
```

以及 backend：

```text
Ops monitoring disabled
```

的特殊行为。

---

# 52. Ops Disabled

如果 backend 明确：

```text
Ops monitoring is disabled
```

Navigation / Route / UI：

统一响应。

不能：

```text
404 generic error
```

让管理员以为系统坏了。

---

# 53. Admin Sidebar

Goal 4 结束必须重做一次完整：

```text
Sidebar ↔ Router ↔ Feature Flag ↔ Backend
```

consistency audit。

特别检查：

```text
simple mode
payment
risk control
ops
```

---

# 54. Admin Information Density

Admin UI：

保持：

```text
compact
dense
scan-friendly
predictable
```

禁止因为 shadcn：

```text
每一行数据一个巨大 Card
```

桌面优先充分利用 DataTable。

---

# 55. Batch Actions

旧 Admin 如果存在：

```text
bulk enable
bulk disable
bulk delete
bulk assign
bulk test
```

必须恢复。

但只有真实存在时。

需要：

```text
selection
selected count
clear selection
confirmation
partial failure handling
```

---

# 56. Partial Failure

批量操作：

```text
10 accounts
8 success
2 fail
```

不能简单：

```text
Success
```

必须报告 partial result。

---

# 57. Long-running Admin Mutations

例如：

```text
test account
backup
refresh
sync
health check
```

不要：

```text
button click
→ wait indefinitely
```

明确：

```text
pending
timeout
success
failure
```

---

# 58. Confirmation Levels

普通修改：

```text
Save
```

危险操作：

```text
ConfirmDialog
```

非常危险：

例如：

```text
bulk delete
reset critical state
```

如果旧产品已有更严格确认机制：

保持。

---

# 59. Backup / Data Management

扫描旧 Admin Settings/Views/Backend 是否存在：

```text
backup
restore
import
export
data management
```

如果它属于当前 Admin 正式功能：

加入 inventory。

不要因为没有独立 React route 就漏掉。

如果它其实是 Settings 内部 feature：

保持合理入口。

---

# 60. Admin API Errors

重点测试：

```text
400
401
403
404
409
422
423
429
500
timeout
network
```

尤其：

```text
423 ADMIN_COMPLIANCE_ACK_REQUIRED
```

---

# 61. 409 Conflict

Admin CRUD 很容易出现：

```text
name conflict
already exists
resource in use
```

不要统一显示：

```text
Request failed
```

给用户可理解反馈。

---

# 62. 422 Validation

Backend field errors：

尽量：

```text
form.setError()
```

映射到具体字段。

---

# 63. Unknown Enum

Admin 经常遇到 backend 新增状态。

任何：

```text
status
provider
type
mode
```

出现 unknown value：

不能 crash。

使用 safe fallback。

---

# 64. Date / Number / Money

继续使用 Goal 3 已建立：

```text
formatDateTime
formatMoney
formatNumber
formatTokens
formatPercentage
```

不要 Admin 再造另一套 formatter。

---

# 65. Table Action Consistency

标准：

```text
frequent primary row action
+
DropdownMenu for secondary
```

不要 Admin 页面出现：

```text
Edit Delete Disable Reset Copy Test Refresh Bind ...
```

一排 8 个按钮。

---

# 66. Filters

遵循 Frozen：

```text
Search
Filters
Clear
Spacer
Refresh
Primary
```

复杂 Admin 页面可多 filters。

但 hierarchy 不变。

---

# 67. URL State

对于复杂 Admin filters：

评估将重要：

```text
page
search
filter
```

同步到 Router search params。

如果旧系统需要可分享/返回状态，应保留。

不要为简单页面过度实现。

---

# 68. i18n

Admin 全部：

```text
zh
en
```

包括：

```text
table header
dialog
form
validation
tooltip
status
empty
error
tabs
settings labels
```

禁止 scaffold 当前这种：

```text
Refresh
ID
Name
Rate
Profit
Enabled
Disabled
General
Save
```

硬编码。

---

# 69. Responsive

Admin 重点：

```text
1440×900
1024×768
768×1024
390×844
```

Mobile 不要求所有数据一屏显示。

复杂 table：

```text
horizontal scroll
```

优先。

---

# 70. Settings Mobile

Settings 可能大量 Tabs/Sections。

确保：

```text
navigation usable
inputs usable
no 100vw overflow
save action reachable
```

---

# 71. Dark Mode

所有 Admin 页面：

```text
light
dark
```

检查：

```text
charts
status
code blocks
table hover
form disabled
danger area
monitor graphs
```

---

# 72. Accessibility

继续：

```text
keyboard
focus
label
aria
dialog trap
ESC
```

特别检查：

```text
DropdownMenu
Tabs
Select
complex Settings
```

---

# 73. E2E Structure

不要给每个小按钮写测试。

按 Admin Journey。

建立例如：

```text
admin-core.spec.ts
admin-business.spec.ts
admin-infra.spec.ts
admin-groups.spec.ts
admin-settings.spec.ts
admin-risk-ops.spec.ts
```

---

# 74. Admin Auth E2E

全局：

```text
anonymous → login
normal user → denied
admin → allowed
```

---

# 75. Group A E2E

至少：

```text
dashboard load
usage filter
audit load
announcement CRUD
```

---

# 76. Group B E2E

核心：

```text
redeem CRUD
promo CRUD
subscription mutation
orders load/filter
plan CRUD
affiliate tables
```

全部安全 mock/test data。

---

# 77. Group C E2E

核心：

```text
account list/filter
account mutation
proxy CRUD
proxy test mocked
channel pricing
channel monitor
```

不要访问真实付费 upstream。

---

# 78. Groups E2E

至少：

```text
create
edit basics
pricing config
one complex policy
validation
error
delete/disable where supported
```

---

# 79. Settings E2E

这是重点。

至少：

```text
load
modify normal setting
save
validation
backend error
feature flag update
sensitive-field preservation
```

---

# 80. Risk/Ops E2E

包括：

```text
risk disabled
risk enabled

ops disabled
ops enabled

normal user denied
```

---

# 81. Browser Error Gate

继续 Goal 2/3：

```text
console.error
pageerror
unexpected request failure
```

→ E2E fail。

---

# 82. No Real Destructive External Operations

E2E：

禁止：

```text
real payment
real provider charge
real upstream Claude/OpenAI/Gemini calls
real external proxy actions
```

使用：

```text
local backend
test data
mock external upstream
```

---

# 83. Group Quality Gate

每完成一个 Group：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

全部 green 才进入下一 Group。

---

# 84. Recommended Order

严格：

```text
Group A
Read-heavy
↓
Group B
Business CRUD
↓
Group C
Infrastructure
↓
Group D
Groups
↓
Group E
Settings / Risk / Ops
```

不要先啃 Settings。

---

# 85. Why Settings Last

因为 Settings 与：

```text
feature flags
navigation
auth
payment
risk
ops
```

都有交叉影响。

前面页面完成后：

更容易验证 Settings 修改产生的全局效果。

---

# 86. Migration Report

持续维护：

```text
docs/frontend-admin-migration.md
```

每页：

```text
[ ] Backend contract
[ ] Old feature inventory
[ ] Typed API
[ ] Query keys
[ ] Guard
[ ] Feature flags
[ ] Loading
[ ] Empty
[ ] Error
[ ] Mutations
[ ] i18n
[ ] responsive
[ ] dark
[ ] E2E
```

---

# 87. Definition Of VERIFIED

只有全部满足：

```text
Backend contract verified
Old behavior audited
No fake data
No placeholder
Correct admin permission
Correct feature flags
Frozen pattern reused
Loading
Empty
Error
Mutations
i18n
light/dark
responsive
keyboard
E2E
```

才能：

```text
VERIFIED
```

---

# 88. Auditor Pass

所有 Group 完成后：

启动独立 Auditor。

Auditor 不信开发 Agent 的报告。

重点找：

```text
missing old admin feature
missing hidden dialog/tab
API mismatch
wrong setting field
permission hole
feature flag mismatch
silent error
dangerous credential exposure
wrong pricing precision
batch partial failure bug
pattern drift
hardcoded strings
mobile overflow
```

---

# 89. Large-page Parity Audit

Auditor 必须重点比较：

```text
SettingsView.vue
GroupsView.vue
RiskControlView.vue
AccountsView.vue
ProxiesView.vue
ChannelsView.vue
```

因为这些旧页面复杂度明显最高。

不是看到 React 页面存在就通过。

---

# 90. Final Static Scans

扫描：

```text
alert(
window.confirm
TODO
next iteration
.catch(() =>
console.log(
direct apiClient in migrated admin routes
hardcoded common UI strings
as unknown as
any
```

合理例外必须说明。

---

# 91. Final Quality Gate

运行：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

全部通过。

---

# 92. Stop Condition

Goal 4 完成后：

**停止。**

不要进入：

```text
OAuth callback
Payment SDK flow
Setup
/custom/:id
/model-plaza
frontend cutover
```

这些留给 Goal 5。

---

# 93. Final Report

输出：

```text
Admin routes discovered
Admin routes VERIFIED
Missing/deferred

Group A result
Group B result
Group C result
Group D result
Group E result

API contracts verified
Feature flags verified
Permission audit
Simple mode audit

Settings parity
Groups parity
Accounts parity
Risk parity

Tests added
E2E count

P0 fixed
P1 fixed
P2 fixed
P3 fixed

lint
typecheck
unit
build
e2e

remaining risks
```

---

# Final Objective

Goal 4 完成后的标准：

> 管理员除了特殊 OAuth / Payment SDK / Setup 等流程之外，已经不需要旧 Vue Admin。

代码层面应该变成：

```text
Admin Route
=
Frozen Pattern
+
Typed Admin Domain
+
Backend Contract
+
TanStack Query
```

而不是：

```text
Old 500KB Vue file
→
New 500KB React file
```

真正目标是：

> 保留业务复杂度，消除实现混乱度。

