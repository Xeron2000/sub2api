# GOAL 2 — Sub2API Frontend Hardening & Pattern Freeze

## Mission

对 `frontend-new` 第一阶段成果进行 production hardening。

本阶段**禁止批量迁移剩余页面**。

目标不是增加页面数量，而是把：

* Login
* Dashboard
* API Keys
* Admin Users

这四个 Representative Pages 从“可展示的 React UI”提升到：

> 功能真实、API Contract 正确、状态完整、UX 一致、可自动测试，并且足以作为后续全站迁移模板。

完成本阶段后，对核心 UI/UX Pattern 执行 **Pattern Freeze**。

后续页面原则上只能组合这些 Pattern，而不是重新设计。

---

# 1. Core Rule

本阶段优先级：

```text
Correctness
>
Behavioral Parity
>
UX Consistency
>
Component Consistency
>
Type Safety
>
Visual Polish
```

不要继续追求“页面数量”。

不要批量迁移其他 routes。

不要因为 UI 已经看起来正常，就认为功能已经完成。

---

# 2. Start With An Audit

第一步不要修改代码。

先完整审计：

```text
frontend-new/src/components
frontend-new/src/lib
frontend-new/src/routes/login.tsx
frontend-new/src/routes/dashboard.tsx
frontend-new/src/routes/keys.tsx
frontend-new/src/routes/admin/users.tsx
frontend-new/src/routes/dev/ui.tsx
```

同时对照：

```text
frontend/
backend/
tests/
```

尤其对照旧 frontend：

* API client
* auth
* token refresh
* API Keys
* Admin Users
* Dashboard
* route guards
* permission
* i18n
* feature flags

生成：

```text
docs/frontend-pattern-audit.md
```

分类：

```text
P0 — security/data corruption
P1 — broken core behavior / API mismatch
P2 — UX/component inconsistency
P3 — polish
```

然后开始修复。

---

# 3. Remove Fake Success

这是本阶段最高优先级规则之一。

禁止：

```ts
apiCall().catch(() => ({
  data: {
    items: [],
    total: 0,
  },
}))
```

或者：

```ts
.catch(() => defaultValue)
```

把真实失败伪装成正常状态。

例如：

```text
Backend 500
```

不能显示成：

```text
No API keys yet
```

必须区分：

```text
Loading
Success
Empty
Error
```

真实 API error 必须进入：

```text
ErrorState
```

或对应 operation error。

---

# 4. No Placeholder Actions

扫描 Representative Pages。

禁止残留：

```text
alert(...)
console.log(...)
TODO action
placeholder button
mock success
next iteration
```

任何用户看到并可以点击的 action：

必须真实工作。

否则删除该 action，直到功能真正实现。

尤其修复：

```text
API Keys:
Create
Edit
Delete
Enable/Disable if supported
Copy

Admin Users:
Create if backend supports it
Edit
Enable/Disable
Delete if backend supports it
Other existing important actions
```

业务能力以：

```text
backend
+
old frontend
```

为准。

不要凭感觉新增能力。

---

# 5. Restore API Client Behavioral Parity

当前新 API client 不能只做到：

```text
401
↓
clear localStorage
↓
redirect /login
```

必须研究旧 frontend 的 API client 与 token refresh 实现。

恢复旧系统已有的重要行为。

至少包括：

## Authentication Header

统一添加 access token。

## Refresh Token

401 且满足 refresh 条件时：

```text
failed request
↓
refresh access token
↓
retry original request
```

不能直接 logout。

---

# 6. Concurrent Refresh

必须处理：

```text
20 requests
simultaneously return 401
```

只能产生合理的 single-flight refresh 行为。

禁止：

```text
20 × /auth/refresh
```

避免 refresh storm。

其他请求应等待同一次 refresh 的结果。

---

# 7. Session Race Safety

参考旧 frontend 行为。

必须正确处理：

```text
request A starts
↓
session changes/logout/login another account
↓
old refresh resolves
```

旧请求不能覆盖新 session。

---

# 8. Failed Refresh

真正 refresh 失败时：

```text
clear auth state
↓
mark session expired if appropriate
↓
redirect login
```

避免：

```text
redirect loop
```

---

# 9. Request Metadata Parity

检查旧 frontend 是否向 backend 添加：

```text
Accept-Language
Timezone
Admin UI request marker
User UI request marker
```

等已有语义。

如果 backend 仍依赖这些行为：

新 frontend 必须保留。

不要因为 rewrite 删除隐式 API Contract。

---

# 10. Standardize AppError

所有 API error 归一化为统一结构。

至少：

```ts
type AppErrorKind =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation"
  | "conflict"
  | "rate_limit"
  | "network"
  | "timeout"
  | "server"
  | "unknown"
```

保留必要：

```text
status
code
message
reason
metadata
```

页面不要理解 AxiosError 内部结构。

---

# 11. Route Authorization

建立正式 TanStack Router auth architecture。

不要只靠：

```text
Sidebar hiding
```

保护页面。

至少验证：

```text
anonymous
normal user
admin
```

---

# 12. Protected User Route

例如：

```text
/dashboard
/keys
/usage
/profile
```

未登录直接访问 URL：

必须得到正确行为。

---

# 13. Admin Route

例如：

```text
/admin/users
/admin/dashboard
```

普通用户直接访问 URL：

必须被拒绝或 redirect。

Sidebar、Router、Backend 三层语义必须一致。

---

# 14. Auth State

建立单一明确 Auth State contract。

至少表达：

```text
unknown
anonymous
authenticated
```

authenticated user 至少包含：

```text
id
email
role
```

SSR hydration 阶段不能错误闪烁：

```text
Admin content
↓
then redirect
```

---

# 15. Login Hardening

把 Login 做成正式 Pattern。

完整支持：

```text
idle
validation error
submitting
backend error
success
```

必须：

* 防 double submit
* accessible labels
* 错误信息明确
* 正确 redirect
* 登录成功更新 auth state
* 登录失败不污染 token
* 不产生 layout shift

---

# 16. Login i18n

禁止 Zod schema 长期硬编码：

```text
Invalid email
Password required
```

最终用户可见 Validation Message 必须进入统一 i18n。

至少：

```text
zh
en
```

---

# 17. API Keys — Complete Real Workflow

`/keys` 是本阶段最重要 Representative Page。

完成真实：

```text
List
Search
Pagination
Create
Edit
Delete
Status
```

具体功能以 backend + old frontend 为准。

不要实现 backend 不支持的东西。

---

# 18. API Key Create

实现正式 Create Dialog。

使用：

```text
React Hook Form
+
Zod
+
shadcn components
```

根据 backend Contract 支持真实字段。

参考旧 frontend 已有能力，例如可能包括：

```text
name
group
custom key
quota
expiration
IP whitelist
IP blacklist
rate limit
```

但必须逐项核实 backend。

不要猜字段。

---

# 19. API Key Edit

Create/Edit 应尽可能共享：

```text
ApiKeyForm
```

而不是复制两个 Form。

但不要为了复用制造复杂 framework。

---

# 20. API Key Mutation UX

统一：

```text
submit
↓
button loading
↓
backend success
↓
dialog close
↓
query cache update/invalidate
↓
success feedback
```

失败：

```text
dialog remains
+
error visible
```

不能失败后自动关闭。

---

# 21. API Key Delete

统一使用：

```text
DeleteConfirmDialog
```

必须明确：

```text
object identity
consequence
loading
failure
success
```

成功后：

列表正确刷新。

如果删除的是当前页最后一项：

检查 pagination page correction。

---

# 22. Search Pattern

不要每次 keystroke 无控制地请求 backend。

建立统一：

```text
SearchInput
```

或统一 hook。

推荐：

```text
250–400ms debounce
```

搜索条件改变：

```text
page → 1
```

---

# 23. Query Cancellation / Race

快速：

```text
abc
↓
abcd
↓
abcde
```

不能让较旧请求最终覆盖新 query。

优先利用 TanStack Query + AbortSignal。

API layer 必须支持 cancellation。

---

# 24. Admin Users — Complete Representative CRUD Pattern

`/admin/users` 用于冻结 Admin CRUD Pattern。

完成旧 frontend/backend 真正支持的重要操作。

至少核实：

```text
search
filters
pagination
create
edit
status
role
disable/enable
delete
quota/balance/group
```

具体支持范围以 backend 为准。

---

# 25. Admin Users Toolbar Pattern

冻结：

```text
Search
Filters
Clear Filters
Spacer
Refresh
Primary Action
```

行为一致。

Mobile 下合理 wrap。

---

# 26. Row Action Pattern

不要把所有操作平铺成按钮。

高频：

可以直接按钮。

低频：

统一进入：

```text
DropdownMenu
```

例如：

```text
Edit
Disable
Delete
Reset...
```

最终冻结一套规则。

---

# 27. DataTable Hardening

当前 DataTable 是未来全站最危险也最重要的 Shared Component。

重构为真正可 Freeze 的版本。

必须修复：

* React Hooks 调用顺序
* broad `any`
* index key
* inconsistent cell typing

---

# 28. DataTable Type Safety

设计合理 generic：

```ts
DataTable<T>
```

Column Definition 不能主要依赖：

```ts
any
```

避免页面不断：

```ts
as unknown as Record<string, unknown>[]
```

如果现有实现迫使所有页面疯狂 cast：

说明 abstraction 不合格。

---

# 29. Stable Row Identity

DataTable 必须允许：

```text
getRowId
```

或者 equivalent。

禁止默认长期使用 array index 作为业务 row key。

---

# 30. DataTable States

统一：

```text
loading
error
empty
populated
```

Loading 时要维持真实 table skeleton 感，而不是页面结构完全变化。

---

# 31. Responsive DataTable

至少测试：

```text
390px
768px
1024px
1440px
```

后台复杂表格不强制塞进 mobile。

根据具体表格：

```text
horizontal scroll
```

优先。

如果采用 mobile card：

必须形成统一 Pattern，而不是单页面特例。

---

# 32. DataTable Alignment Freeze

统一：

```text
text        left
email       left
identifier  left
status      left
date        left
number      right
money       right
actions     right
```

---

# 33. Page Layout Freeze

冻结：

```text
AppShell
PageContainer
PageHeader
PageSection
```

确定：

```text
page max width
desktop padding
mobile padding
major vertical gap
section gap
header spacing
```

迁移新页面时不得自行重新决定。

---

# 34. PageHeader Freeze

统一：

```text
Title
Description
Actions
```

Mobile：

Actions wrap/stack 规则固定。

不要后续某页面：

```text
title 20px
```

另一个：

```text
title 32px
```

---

# 35. Form Pattern Freeze

建立全站标准 Form Pattern：

```text
Label
Control
Description
Validation Error
```

然后：

```text
FormActions
```

顺序固定。

Desktop 默认：

```text
Cancel | Primary
```

---

# 36. AsyncButton

评估增加：

```text
AsyncButton
```

统一：

```text
idle
loading
disabled
```

避免所有页面手写不同 spinner/loading text。

如果 shadcn Button variant 可以简单实现，不要过度 abstraction。

---

# 37. StatusBadge Freeze

定义真正 semantic status mapping。

不要页面自己判断：

```text
active → success
inactive → default
disabled → warning?
failed → destructive?
```

集中定义常见状态。

Domain-specific status 可以包一层 Domain Component。

---

# 38. Toast / Operation Feedback

选择一套统一机制。

优先采用 shadcn 推荐生态。

例如：

```text
Sonner
```

用于：

```text
Create success
Update success
Delete success
Copy success
Operation error
```

但：

Field validation 不用 Toast。

Page load error 不用 Toast 代替 ErrorState。

---

# 39. CopyButton

冻结统一 Copy UX：

```text
click
↓
clipboard success
↓
brief confirmation
```

失败必须有 feedback。

不要各页面自己调用：

```ts
navigator.clipboard.writeText(...)
```

---

# 40. ConfirmDialog

冻结 destructive-action pattern：

```text
Title
Description
Cancel
Destructive Action
```

loading 时：

禁止 double submit。

失败：

Dialog 保持可理解状态。

---

# 41. Theme Architecture

完整实现：

```text
light
dark
system
```

如果产品最终只需要 light/dark，可简化，但必须形成统一 Provider。

不能只靠 CSS token 存在就认为 Dark Mode 完成。

---

# 42. Theme Toggle

App Header 中提供一致 Theme Toggle。

必须：

* persistence
* no hydration flash where reasonably possible
* icon consistent with preset
* accessible label

---

# 43. No Hardcoded Theme Colors

扫描 Representative Pages + shared components。

禁止无必要：

```text
bg-white
text-black
bg-gray-*
text-gray-*
hex colors
```

继续优先 semantic tokens。

---

# 44. i18n Hardening

四个 Representative Pages：

禁止残留用户可见 hardcoded：

```text
Clear filters
Refresh
ID
Email
Role
Status
Actions
Edit
Disable
No users
```

全部迁入：

```text
zh
en
```

---

# 45. Document Language

`<html lang>` 必须跟随当前 locale。

不能固定：

```html
<html lang="en">
```

---

# 46. Page Metadata

去掉 starter 残留：

```text
TanStack Start Starter
```

统一：

```text
Page Name - Sub2API
```

并跟随 i18n。

---

# 47. Devtools

TanStack Devtools：

只在开发环境启用。

Production build 不应默认向普通用户暴露 development UI。

---

# 48. Icons

移除：

```text
emoji icons
☰
●
```

作为正式界面 icon。

使用 preset 指定：

```text
Remix Icon
```

保证全站统一。

---

# 49. `/dev/ui` Upgrade

将 `/dev/ui` 从 demo page 升级成真正的 Design-System Playground。

展示并验证：

```text
Typography

Colors

Spacing

Buttons
- variants
- sizes
- disabled
- loading

Inputs
- normal
- disabled
- error

Select
Checkbox
Switch

StatusBadge

Form

Dialog
ConfirmDialog

Toast

DataTable
- loading
- empty
- error
- populated

Pagination

PageHeader

EmptyState
ErrorState
LoadingState
```

---

# 50. Playground Must Use Frozen Components

`/dev/ui` 不要另外手写 demo styling。

它必须消费 production components。

这样修改：

```text
Button
DataTable
StatusBadge
```

时，可以立即看到全局变化。

---

# 51. Remove Placeholder Playground Behavior

不要再出现：

```ts
alert("retry")
```

需要演示 ErrorState 时可以使用 local demo state。

但不要使用 browser alert 作为 UX Pattern。

---

# 52. Accessibility Baseline

四个 Representative Pages 检查：

```text
Tab navigation
Focus visible
Input labels
ARIA labels
Dialog focus
ESC
Icon buttons
Keyboard submit
Contrast
```

不要为了 visual polish 破坏 shadcn/Base UI 自带 accessibility。

---

# 53. SSR Safety

扫描：

```text
window
document
localStorage
sessionStorage
navigator
```

确保都处于明确 client boundary。

不要导致 SSR build/runtime failure。

---

# 54. Hydration

至少验证：

```text
direct navigation
refresh page
logged-out refresh
logged-in refresh
dark mode refresh
zh refresh
```

不能产生明显 hydration mismatch。

---

# 55. Representative Responsive Audit

逐个测试：

```text
Login
Dashboard
Keys
Admin Users
```

在：

```text
390×844
768×1024
1024×768
1440×900
```

检查：

```text
overflow
toolbar
tables
dialogs
forms
sidebar
header
action buttons
```

---

# 56. Pattern Freeze Document

完成所有修复后创建：

```text
docs/frontend-patterns.md
```

内容明确记录：

## Layout Pattern

```text
AppShell
PageContainer
PageHeader
PageSection
```

## CRUD Page Pattern

```text
PageHeader
Toolbar
DataTable
Pagination
Dialog
```

## Form Pattern

```text
RHF
Zod
Field
Actions
```

## Async Pattern

```text
idle
loading
success
error
```

## Feedback Pattern

```text
Field error
Operation toast
Page ErrorState
```

## Destructive Pattern

```text
ConfirmDialog
```

## Search/Filter Pattern

```text
debounce
reset page
clear filter
```

## Responsive Pattern

## Theme Pattern

## i18n Pattern

---

# 57. Pattern Freeze Rule

在：

```text
docs/frontend-patterns.md
```

明确：

> These patterns are frozen after Goal 2.

后续页面开发：

必须先尝试复用。

如果新页面发现现有 Pattern 不够：

先问：

> 这个需求是否应该成为整个 Sub2API 的通用 Pattern？

如果答案不是：

```text
Yes
```

优先保持为轻量 domain-specific composition。

禁止偷偷修改全站 Pattern。

---

# 58. Update AGENTS.md

如果当前不存在：

创建。

如果存在：

更新。

至少加入：

```text
Never silently convert API errors into empty states.

Never use browser alert/confirm for product UX.

Never create a new primitive before checking shadcn/ui.

Never hardcode user-visible strings outside i18n.

Never hardcode visual colors when semantic tokens exist.

Never add route actions without real backend behavior.

Never bypass shared Page/Table/Form/Dialog patterns.

Never duplicate server state outside TanStack Query without a reason.

Never weaken authentication or token-refresh behavior during migration.

All user and admin routes must enforce authorization at route level.

Do not mass-migrate pages until frozen patterns are established.
```

---

# 59. Testing Foundation

本阶段建立测试基础，而不是等整个 frontend 写完再测。

已有：

```text
Vitest
```

补充关键 unit tests：

```text
AppError normalization
auth token refresh
single-flight refresh
query key
formatters
permission helpers
status mapping
```

---

# 60. Add Playwright

本阶段加入最小 Playwright infrastructure。

不要一开始写几百条 E2E。

只覆盖四个 Representative Pages。

至少：

```text
auth.spec
dashboard.spec
keys.spec
admin-users.spec
```

---

# 61. Login E2E

覆盖：

```text
valid login
invalid login
protected route redirect
logout/session expiration
```

---

# 62. Keys E2E

覆盖核心：

```text
list
search
empty
API error
create
edit
delete
pagination
```

使用安全 test data。

---

# 63. Admin Users E2E

覆盖：

```text
admin access
normal-user forbidden
search
pagination
important mutations
API error
```

---

# 64. Browser Error Gate

E2E 时捕获：

```text
console.error
pageerror
failed unexpected requests
```

出现未预期错误：

test fail。

---

# 65. API Contract Verification

对四个页面逐个建立：

```text
UI Action
→
frontend API function
→
HTTP method
→
path
→
request
→
backend handler
→
response
→
frontend type
```

不要仅参考旧 frontend type。

最终 backend 是 Source of Truth。

---

# 66. API Layer Organization

Route component 不要大量直接：

```ts
apiClient.get(...)
apiClient.post(...)
```

建立 feature/API functions。

例如：

```text
lib/api/keys.ts
lib/api/users.ts
```

或者合理 feature structure。

Route 主要负责：

```text
query/mutation orchestration
+
page composition
```

---

# 67. No Broad Casts

减少：

```ts
as unknown as ...
as any
```

如果 backend type 不明确：

定义准确 DTO。

不要通过 cast 压过 TypeScript。

---

# 68. Dashboard Hardening

Dashboard 不允许 stats API 失败后自动变：

```text
0
```

如果真实含义是“未知/失败”：

必须区分：

```text
0
```

与：

```text
Failed to load
```

0 是业务数据。

失败是系统状态。

二者绝不能混淆。

---

# 69. Dashboard Pattern

冻结 SaaS Dashboard Stat Pattern：

```text
StatCard
```

如果它会全站复用：

提升到：

```text
components/shared/StatCard
```

否则保留 feature-level。

不要复制多个近似 StatCard。

---

# 70. Definition Of Done — Login

* [ ] Real backend login
* [ ] Validation
* [ ] Loading
* [ ] Error
* [ ] Auth state updated
* [ ] Correct redirect
* [ ] i18n
* [ ] responsive
* [ ] dark mode
* [ ] keyboard accessible
* [ ] E2E

---

# 71. Definition Of Done — Dashboard

* [ ] Real data
* [ ] No fake zero fallback
* [ ] Loading
* [ ] Error
* [ ] Correct formatters
* [ ] responsive
* [ ] dark mode
* [ ] E2E

---

# 72. Definition Of Done — API Keys

* [ ] List
* [ ] Search
* [ ] Pagination
* [ ] Create
* [ ] Edit
* [ ] Delete
* [ ] Status where supported
* [ ] Copy where supported
* [ ] Loading
* [ ] Empty
* [ ] Error
* [ ] i18n
* [ ] responsive
* [ ] dark
* [ ] E2E

---

# 73. Definition Of Done — Admin Users

* [ ] Correct authorization
* [ ] Real backend data
* [ ] Search
* [ ] Filter where supported
* [ ] Pagination
* [ ] Real important actions
* [ ] Loading
* [ ] Empty
* [ ] Error
* [ ] i18n
* [ ] responsive
* [ ] dark
* [ ] E2E

---

# 74. Quality Gates

结束必须运行：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

全部通过。

禁止通过：

```text
skip
eslint-disable
@ts-ignore
any
catch-and-ignore
```

掩盖真实问题。

---

# 75. Stop Condition

本 Goal 完成之后：

**停止。**

不要继续批量迁移：

```text
Usage
Subscriptions
Orders
Groups
Channels
Accounts
Settings
...
```

先输出审计结果。

最终报告：

```text
P0 fixed
P1 fixed
P2 fixed
remaining risks

Frozen Components
Frozen UX Patterns
Auth parity
API contract parity
Tests added
Quality gate result
```

只有当：

```text
Login
Dashboard
API Keys
Admin Users
```

四个页面真正 production-ready，

并且：

```text
DataTable
Form
Dialog
Toolbar
Search
Pagination
Async feedback
Error
Empty
Loading
Theme
i18n
Auth
```

Pattern 已稳定，

才允许进入 Goal 3：

```text
Full User Feature Migration
```

---

# Final Principle

本阶段不是：

> 再做更多页面。

而是：

> 让未来新增 30 个页面时，不需要再做 30 次 UI/UX 决策。

完成以后，新页面应该主要变成：

```text
choose existing pattern
+
connect backend contract
+
compose existing components
```

而不是：

```text
invent another frontend
```

