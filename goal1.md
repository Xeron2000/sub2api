# Sub2API Frontend Rewrite Goal

## 0. Mission

全面重写 Sub2API Frontend。

旧 frontend 只作为：

* 业务逻辑参考
* API Contract 参考
* Route 参考
* 权限逻辑参考
* 功能参考
* i18n 文案参考
* Edge Case 参考

**不要复制旧 UI。**

新前端使用：

```bash
pnpm dlx shadcn@latest init --preset b7WQfDSML --template start
```

目标技术栈：

* React
* TypeScript
* TanStack Start
* TanStack Router
* TanStack Query
* shadcn/ui
* Tailwind CSS
* Lucide / preset 指定 icon library
* React Hook Form
* Zod
* Playwright
* Vitest

核心原则：

> Backend stays unchanged.
>
> Business behavior stays compatible.
>
> Frontend architecture and UI are rebuilt from first principles.

不要把现有 Go/backend 逻辑迁移进 TanStack Start server functions。

TanStack Start 在这个项目中主要承担：

* frontend framework
* routing
* layouts
* frontend application architecture

现有 Sub2API backend 仍然是唯一业务后端和数据 Source of Truth。

---

# 1. Primary Goals

本次重写重点不是“把 Vue 改成 React”。

真正目标：

1. 建立统一 Design System
2. 建立统一 Component System
3. 建立统一 Tailwind CSS 使用规范
4. 建立统一 Page Layout
5. 建立统一 UX Interaction Model
6. 建立统一 Data Fetching Model
7. 建立统一 Form Model
8. 建立统一 Table/List Model
9. 建立统一 Loading/Error/Empty State
10. 建立统一 Responsive Model
11. 保留并正确迁移所有现有业务能力
12. 显著降低未来 Agent 新增页面时产生 UI drift 的概率

最终效果应该是：

> 即使不同页面由不同 Coding Agent 分别完成，
> 用户也应该感觉它们来自同一个设计团队、同一个产品、同一套设计系统。

---

# 2. Non-Goals

本次 frontend rewrite 不做：

* backend architecture rewrite
* API redesign
* 数据库修改
* 无关业务功能重构
* 为“更现代”而改变业务语义
* 无必要的大型状态管理框架
* 无必要的新 abstraction
* 大量 animation
* 炫技型 UI
* landing-page 风格的后台管理界面

不要为了使用 TanStack Start 而重新实现已经存在于 Go backend 的能力。

---

# 3. Absolute Rule: Design System First

## 禁止直接开始迁移页面。

正式页面开发之前必须先完成：

```text
Foundation
  ↓
Design Tokens
  ↓
UI Primitives
  ↓
Shared Components
  ↓
Application Patterns
  ↓
Shell / Layout
  ↓
Representative Pages
  ↓
Other Pages
```

如果 Design System 尚未稳定：

**禁止批量迁移页面。**

---

# 4. shadcn Preset Is The Visual Source Of Truth

初始化：

```bash
pnpm dlx shadcn@latest init --preset b7WQfDSML --template start
```

preset 产生的：

* color system
* typography
* radius
* icon style
* component style
* menu style
* design personality

视为新的视觉基线。

不要在后续页面中随意偏离 preset。

---

# 5. Component Architecture

组件严格分四层：

```text
src/
├── components/
│   ├── ui/
│   ├── shared/
│   ├── domain/
│   └── layout/
```

---

## Layer 1 — UI Primitives

```text
components/ui/
```

来自 shadcn/ui。

例如：

```text
button
input
textarea
select
checkbox
radio-group
switch
badge
card
table
dialog
alert-dialog
sheet
dropdown-menu
popover
tooltip
tabs
separator
skeleton
progress
command
pagination
breadcrumb
avatar
```

这些是 Design System primitives。

### Rules

不要在业务页面复制 primitive。

错误：

```tsx
<button className="rounded-md bg-blue-500 px-3 py-2 ...">
```

正确：

```tsx
<Button>
```

同理：

禁止页面自行重新实现：

* button
* input
* select
* modal
* dropdown
* tooltip
* checkbox
* table primitive

---

# 6. Shared Components

```text
components/shared/
```

建立全站重复出现的产品级组件。

至少评估建立：

```text
PageHeader
PageContainer
PageSection

DataTable
DataTableToolbar
DataTablePagination

EmptyState
ErrorState
LoadingState

SearchInput
FilterBar

ConfirmDialog
DeleteConfirmDialog

StatusBadge
CopyButton

FormField
FormActions

StatCard
InfoCard

AsyncButton

DateTimeDisplay
MoneyDisplay
UsageDisplay

ResponsiveDialog

AppTooltip
```

这些组件不是业务实体。

它们定义 Sub2API 的统一视觉和交互语言。

---

# 7. Domain Components

```text
components/domain/
```

只放具有明确业务语义的组件。

例如：

```text
UserStatusBadge
APIKeyCard
SubscriptionStatus
ChannelStatus
OrderStatus
UsageSummary
ModelBadge
AccountStatus
```

Domain Component 可以组合 shared/ui component。

但不能重新创造另一套设计系统。

---

# 8. Layout Components

```text
components/layout/
```

至少统一：

```text
AppShell
AdminShell
PublicShell
AuthShell

AppSidebar
AppHeader
MobileNavigation

PageContainer
PageHeader
```

不要让每个页面自己决定：

```text
max-width
padding
header height
page gap
mobile padding
```

---

# 9. Component Reuse Rule

创建新组件前必须按顺序检查：

```text
1. shadcn/ui 有没有？
2. components/ui 有没有？
3. components/shared 有没有？
4. components/domain 有没有？
5. 是否只是已有组件的 variant？
6. 以上都不满足才允许创建新组件。
```

禁止出现：

```text
BlueButton
SmallBlueButton
DangerRedButton
CustomModal
SimpleModal
AdminModal
UserModal
PrettyInput
SearchBox2
```

这类组件。

---

# 10. Variant Over Duplication

视觉差异首先使用 variant。

例如：

```tsx
<Button variant="default" />
<Button variant="secondary" />
<Button variant="outline" />
<Button variant="ghost" />
<Button variant="destructive" />
```

而不是创建多个按钮组件。

---

# 11. Tailwind CSS Rules

Tailwind 是实现 Design System 的工具。

**不是让页面随意写 CSS 的许可证。**

---

# 12. Semantic Tokens First

颜色必须优先使用 semantic token：

```text
background
foreground

card
card-foreground

popover
popover-foreground

primary
primary-foreground

secondary
secondary-foreground

muted
muted-foreground

accent
accent-foreground

destructive

border
input
ring
```

禁止业务页面大量直接使用：

```text
bg-blue-500
text-gray-600
border-gray-200
bg-red-600
```

业务状态颜色除外，但必须封装到统一组件，例如：

```tsx
<StatusBadge status="success" />
```

而不是每个页面单独决定绿色是什么绿色。

---

# 13. No Arbitrary Visual Values

尽量禁止：

```text
w-[437px]
mt-[13px]
text-[15px]
rounded-[11px]
shadow-[...]
bg-[#123456]
```

除非：

* 第三方 SDK
* 图表
* 特殊计算布局
* 明确无法由 Design Token 表达

普通页面必须使用统一 spacing scale。

---

# 14. Spacing System

页面布局优先使用：

```text
gap-1
gap-2
gap-3
gap-4
gap-6
gap-8
```

主要层级：

```text
4px
8px
12px
16px
24px
32px
```

避免无规则：

```text
gap-5
gap-7
gap-9
```

除非视觉上有明确理由。

---

# 15. Page Spacing

所有业务页面默认：

```text
Page
├── PageHeader
│
├── Section
│
└── Section
```

统一：

```text
mobile horizontal padding: 16px
desktop horizontal padding: 24px
large desktop: 32px where appropriate

major section gap: 24px
related control gap: 8px / 12px
form field gap: consistent globally
```

不要每个页面自行定义 page padding。

---

# 16. Border Radius

严格跟随 preset。

禁止：

一个页面：

```text
rounded-md
```

另一个页面：

```text
rounded-xl
```

第三个页面：

```text
rounded-3xl
```

除非组件层级确实不同。

Radius 必须具有语义：

```text
control
card
dialog
floating surface
```

而不是凭感觉决定。

---

# 17. Shadows

后台系统默认：

**少用 shadow。**

优先依赖：

```text
background hierarchy
border
spacing
```

禁止：

* 大面积 heavy shadow
* Glow
* Neon
* 浮夸 hover shadow

只有浮层组件使用必要 elevation：

```text
dropdown
popover
dialog
tooltip
```

---

# 18. Typography System

定义固定 typography hierarchy。

例如：

```text
Page Title
Section Title
Card Title
Body
Secondary Body
Label
Caption
Code / Number
```

页面禁止自行创造：

```text
text-[17px]
font-[550]
```

推荐控制在少量字号：

```text
text-xs
text-sm
text-base
text-lg
text-xl
text-2xl
```

大多数后台正文：

```text
text-sm
```

大多数辅助信息：

```text
text-sm text-muted-foreground
```

---

# 19. Information Density

Sub2API 是 SaaS/Admin/API 管理产品。

UI 应：

* clean
* compact
* calm
* information-dense
* professional

而不是：

* 巨大卡片
* 巨大标题
* 大面积留白
* landing page
* glassmorphism
* gradient everywhere

Admin 页面尤其保持较高信息密度。

---

# 20. Icons

只使用 preset 确定的 icon library。

禁止同时出现：

```text
Lucide
Heroicons
FontAwesome
random SVG
emoji
```

作为普通 UI icon。

统一：

```text
16px — 普通 action
20px — navigation / prominent action
```

图标按钮必须 Tooltip 或 accessible label。

---

# 21. Button UX

Button hierarchy 全站统一。

## Primary

每个操作区域尽量只有一个 Primary Action。

例如：

```text
Create API Key
Save Changes
Create User
```

## Secondary

普通操作：

```text
Cancel
Export
Refresh
```

## Ghost

低优先级 UI action：

```text
row action
toolbar icon
```

## Destructive

只用于：

```text
Delete
Revoke
Disable destructive operation
```

---

# 22. Button State

所有异步按钮统一：

```text
idle
↓
loading
↓
success / error
```

Loading 时：

* 防止重复提交
* 显示 spinner
* 文案保持稳定或明确变为 processing
* 不允许 layout shift

例如：

```text
Save
Saving...
```

---

# 23. Forms

统一使用：

```text
React Hook Form
+
Zod
+
shadcn Form primitives
```

禁止每个页面自己写一套 validation architecture。

---

# 24. Form Layout

默认：

```text
Label
Input
Description
Error
```

所有页面顺序一致。

Required 字段表示一致。

Validation timing 一致。

错误显示位置一致。

---

# 25. Validation UX

优先：

* client validation
* backend validation

两层结合。

Backend error 必须映射成用户能理解的信息。

禁止：

```text
Request failed with status code 422
```

直接显示给用户。

---

# 26. Form Actions

Desktop 默认：

```text
Cancel | Primary
```

位置与顺序全站统一。

危险操作除外。

Mobile 可根据空间调整，但 interaction hierarchy 不变。

---

# 27. Destructive Actions

删除、撤销 Key、禁用账号等操作：

必须使用：

```text
AlertDialog
```

必须明确说明：

* 即将操作的对象
* 后果
* 是否不可逆

禁止：

```text
window.confirm()
```

---

# 28. Toast Rules

Toast 只用于短暂 operation feedback：

```text
Saved successfully
API key copied
User deleted
Failed to update settings
```

Toast 不用于：

* 长说明
* Form validation
* 页面级错误
* 需要用户持续阅读的信息

---

# 29. Error UX

错误分三级。

## Field Error

显示在 field。

## Operation Error

Toast 或局部 inline alert。

## Page Error

统一：

```tsx
<ErrorState />
```

提供：

```text
Retry
```

如果可恢复。

禁止 blank page。

---

# 30. Loading UX

禁止全站到处出现：

```text
Loading...
```

使用：

### Page initial load

Skeleton。

### Button mutation

Button spinner。

### Small region refresh

局部 loading state。

### Background refresh

尽量保持 stale data，不清空页面。

---

# 31. Empty State

所有 list/table 必须有 EmptyState。

例如：

```text
No API keys yet

Create an API key to start using Sub2API.

[Create API Key]
```

不要只显示：

```text
No data
```

如果用户可以解决 empty state，应提供 CTA。

---

# 32. Tables

后台 table 必须走统一 `DataTable` architecture。

统一：

```text
header
row density
hover
selection
actions
pagination
empty
loading
error
```

禁止每个 Admin 页面重新实现 table 风格。

---

# 33. Table Alignment

统一：

```text
text → left
identifier → left
status → left
date → left
number → right
money → right
actions → right
```

不要随页面变化。

---

# 34. Row Actions

低频操作放：

```text
DropdownMenu
```

高频核心操作可以直接显示。

不要一行出现：

```text
Edit Delete Disable Reset Copy Details ...
```

七八个按钮。

---

# 35. Filters

统一顺序：

```text
Search
Filters
Date Range
Spacer
Refresh / Export / Create
```

Active filter 必须可识别。

必须有：

```text
Clear filters
```

逻辑。

---

# 36. Pagination

分页行为全站一致：

* page
* page size
* total
* previous
* next

切换 Filter/Search 时：

默认 reset 到 page 1。

---

# 37. Search UX

Search 默认 debounce：

```text
250–400ms
```

避免每个 keystroke 发请求。

发生 race condition 时必须保证：

**最新 query 的 response 才能成为最终 UI state。**

---

# 38. Dialog / Sheet Rules

Desktop：

创建/编辑简单实体优先 Dialog。

复杂配置：

使用 page 或较大的 Dialog。

Mobile：

空间不足时可以使用 Sheet / ResponsiveDialog。

不要把巨型 Form 塞进窄 Modal。

---

# 39. Dialog Actions

统一 footer：

```text
Cancel
Primary Action
```

Destructive dialog：

```text
Cancel
Delete
```

Loading 时禁止关闭导致状态不明确，除非 operation 本身可安全取消。

---

# 40. Navigation

保持清晰的：

```text
Public
User
Admin
```

information architecture。

Sidebar item：

* icon
* label
* selected state

必须一致。

不要加入重复导航入口。

---

# 41. Route Compatibility

先读取旧 Vue Router。

创建：

```text
docs/frontend-route-migration.md
```

记录：

```text
Old Route
New Route
Role
Feature Flag
Migration Status
Notes
```

原则：

尽量保持已有 URL。

例如已有用户 bookmark/API documentation 不应该因为 UI rewrite 全部失效。

---

# 42. Authentication

迁移现有：

* Login
* Register
* Logout
* Forgot Password
* Reset Password
* Email Verification
* OAuth callbacks
* OIDC
* LinuxDo
* WeChat
* DingTalk

等现有流程。

不要因为改框架而改变 backend auth contract。

---

# 43. SSR / Client Boundary

TanStack Start 存在 SSR 环境。

因此：

禁止无保护地在 server rendering 阶段访问：

```text
window
document
localStorage
sessionStorage
navigator
```

浏览器 SDK：

```text
Stripe
Airwallex
QR/payment SDK
browser-only auth SDK
```

必须使用明确 client boundary / lazy loading。

---

# 44. Server State

所有 API server state 优先使用：

```text
TanStack Query
```

例如：

```text
users
keys
subscriptions
orders
channels
usage
settings
```

禁止复制到多个 React Context/useState 中形成多份 Source of Truth。

---

# 45. Query Key Convention

集中规范 Query Key。

例如：

```ts
queryKeys.users.all
queryKeys.users.list(filters)
queryKeys.users.detail(id)

queryKeys.keys.all
queryKeys.keys.list(filters)
```

不要在页面散落：

```ts
['users']
['user-list']
['users-data']
```

---

# 46. Mutation Behavior

所有 mutation 明确：

```text
mutation
↓
success
↓
invalidate/update cache
↓
UI reflects server state
```

禁止：

操作成功 → toast 成功 → 页面还是旧数据。

---

# 47. Local State

局部 UI state：

```text
useState
```

跨组件简单状态：

React context，仅必要时使用。

不要因为旧项目用了 Pinia，就立刻加入 Zustand/Redux。

原则：

> No global state unless the state is actually global.

---

# 48. API Layer

统一：

```text
src/lib/api/
```

或：

```text
src/api/
```

负责：

* base URL
* auth
* request
* response
* error normalization
* token refresh
* timeout
* cancellation

页面禁止直接：

```ts
fetch(...)
```

散落调用 backend。

---

# 49. API Contract

Backend 是 Source of Truth。

不要为了让新 frontend 好写而偷偷改变 response interpretation。

迁移时核对：

```text
HTTP Method
Path
Query
Body
Response
Pagination
Error
Nullable
Enum
Timezone
Money
Rate
Permission
```

---

# 50. Error Normalization

建立统一：

```ts
AppError
```

至少可表达：

```text
unauthorized
forbidden
not_found
validation
conflict
rate_limit
network
timeout
server
unknown
```

UI 不应该理解 Axios/TanStack 底层 error shape。

---

# 51. Responsive Rules

目标 viewport：

```text
390px
768px
1024px
1440px
```

Mobile-first。

---

# 52. Responsive Philosophy

不要把 desktop UI 简单压缩。

根据内容选择：

### Simple content

自然 stack。

### Form

single column。

### Dense table

horizontal scroll 或 mobile-specific card representation。

### Sidebar

mobile Sheet。

### Toolbar

wrap / condensed actions。

---

# 53. Mobile Touch Target

可操作区域至少保持合理 touch target。

避免：

```text
12px icon
+
tiny click area
```

Icon 可以 16px，但 clickable container 应更大。

---

# 54. Dark Mode

所有 Design Token 必须支持：

```text
light
dark
```

禁止页面硬编码：

```text
bg-white
text-black
```

除非确实是业务要求。

新页面必须同时在 Light/Dark 下验收。

---

# 55. i18n

保留 Sub2API 现有：

```text
Chinese
English
```

能力。

禁止：

新页面随意 hardcode Chinese/English。

新 UI 文案必须走统一 i18n architecture。

---

# 56. Date / Number / Money

禁止页面自己 format：

```text
date
time
currency
percentage
token usage
large number
```

建立统一 formatter。

特别注意：

* locale
* timezone
* decimal
* percentage
* price precision

---

# 57. Accessibility

所有新 UI 至少满足：

* semantic HTML
* keyboard navigation
* visible focus
* accessible label
* dialog focus trap
* ESC behavior
* label/input association
* icon button aria-label
* reasonable contrast

优先依赖 shadcn primitives 已有 accessibility behavior。

不要破坏它。

---

# 58. Motion

默认 motion 极少。

允许：

```text
dialog transition
popover transition
sidebar
small loading indicator
```

禁止：

* page flying animation
* excessive fade
* card hover movement
* decorative bouncing
* animated gradients

Sub2API 是工具，不是 marketing showcase。

---

# 59. Page Architecture

推荐：

```text
routes/
features/
components/
lib/
hooks/
```

不要形成：

```text
components/
  EverythingInTheEntireApp.tsx
```

也不要过度 atomic design。

保持 KISS。

---

# 60. Feature Organization

复杂 feature 可以：

```text
features/users/
├── api.ts
├── queries.ts
├── schemas.ts
├── components/
└── utils.ts
```

简单 feature 不需要强行建立完整目录。

抽象必须来自真实复杂度。

---

# 61. Page Composition Rule

Route component 应主要负责：

```text
data orchestration
layout composition
feature composition
```

不要一个 route file 3000 行。

同时也不要为了减少行数把每个 `<div>` 都拆组件。

---

# 62. Representative Pages First

Design System 完成后，不要立刻迁移全部页面。

先选择四类代表页面。

## A. Auth

Login

验证：

* Form
* Error
* Button
* Card
* OAuth

## B. User

Dashboard

验证：

* Page layout
* Stats
* Cards
* Loading

## C. Data-heavy

Usage / API Keys

验证：

* Table
* Filter
* Pagination
* Empty State
* Dialog

## D. Admin

Admin Users

验证：

* Dense table
* Search
* Filters
* Bulk/action
* Permission
* CRUD

只有这四类页面视觉和 UX 稳定之后：

才允许继续批量迁移。

---

# 63. Build A UI Playground

增加开发用：

```text
/dev/ui
```

仅开发环境可访问。

展示：

```text
Buttons
Inputs
Selects
Checkboxes
Badges
Cards
Tables
Dialogs
Dropdowns
Form Fields
Toast
Empty State
Error State
Skeleton
Status
Typography
Spacing
Colors
```

它相当于轻量 Storybook。

目的：

以后 Agent 修改 Design System 时可以一次看到所有组件。

不需要为了这个需求引入重量级 Storybook。

---

# 64. Design Documentation

建立：

```text
docs/frontend-design-system.md
```

记录：

## Colors

semantic tokens。

## Typography

层级。

## Spacing

规则。

## Components

使用方式。

## Layout

标准。

## Interaction

标准。

## Do / Don't

典型反例。

---

# 65. Agent Guardrails

建立：

```text
AGENTS.md
```

至少加入：

> Before creating a UI component, search existing shadcn/ui and shared components.

> Never introduce arbitrary colors when semantic tokens exist.

> Never implement a custom Button/Input/Dialog/Select if an existing primitive can be used.

> Follow existing PageHeader, PageContainer, DataTable and Form patterns.

> Do not alter backend API contracts solely to simplify frontend code.

> All async operations require explicit loading and error behavior.

> All list pages require loading, empty, error and populated states.

> Every new page must work in light/dark mode.

> Every new page must be checked at 390px and desktop width.

> UI consistency is more important than local cleverness.

---

# 66. Preserve Existing Functionality

开始迁移前制作：

```text
docs/frontend-feature-inventory.md
```

从旧 frontend 自动提取：

```text
routes
pages
API calls
dialogs
forms
filters
tables
permissions
feature flags
payment flows
OAuth flows
i18n namespaces
```

每项标记：

```text
[ ] Not Started
[~] In Progress
[x] Migrated
[x] Verified
```

不能靠记忆迁移。

---

# 67. Old Frontend As Behavioral Oracle

遇到业务逻辑不确定时：

先阅读旧实现。

不要自己猜。

尤其：

```text
Auth
Token refresh
Payment
Subscription
API Key
Channel
Admin permissions
Feature flags
Setup flow
OAuth
```

旧 frontend 不一定完美，但在没有其他文档时它是行为参考。

Backend 最终是 Contract Source of Truth。

---

# 68. Migration Strategy

推荐：

## Phase 0

Inventory existing frontend.

## Phase 1

Initialize new frontend.

## Phase 2

Design tokens.

## Phase 3

UI primitives.

## Phase 4

Shared components.

## Phase 5

AppShell + navigation.

## Phase 6

API/auth/query architecture.

## Phase 7

Representative pages.

## Phase 8

Review Design System.

## Phase 9

User pages migration.

## Phase 10

Admin pages migration.

## Phase 11

Payment/OAuth/special flows.

## Phase 12

Responsive/dark/i18n audit.

## Phase 13

E2E regression.

## Phase 14

Remove old Vue frontend.

---

# 69. Never Big-Bang Blind Rewrite

禁止：

```text
删掉旧 frontend
↓
Agent 连续生成 60 个页面
↓
build
↓
“Done”
```

正确：

```text
Inventory
↓
Foundation
↓
4 Representative Pages
↓
Visual Review
↓
Pattern Freeze
↓
Batch Migration
↓
Regression
```

---

# 70. Pattern Freeze

代表页面完成后，对这些 Pattern 进行 Freeze：

```text
Page Layout
Page Header
Table
Form
Dialog
Toolbar
Filters
Card
Empty
Error
Loading
Toast
Navigation
Status
```

Freeze 之后：

新页面只能复用。

如果需要修改 Pattern：

必须确认这个修改应该应用到**全站**，而不是当前页面 special-case。

---

# 71. Automated Tests

建立：

```text
Vitest
+
Playwright
```

Vitest：

```text
utils
formatters
schemas
API normalization
important hooks
```

Playwright：

```text
auth
navigation
critical user flows
critical admin flows
responsive smoke
theme smoke
permission
```

---

# 72. Visual Regression

对代表页面保存 screenshot：

```text
Login
Dashboard
Keys
Usage
Admin Users
Admin Channels
Settings
```

至少：

```text
desktop light
desktop dark
mobile light
```

作用不是追求 pixel-perfect。

作用是发现：

```text
spacing drift
component drift
broken layout
accidental theme regression
```

---

# 73. Quality Gate

每阶段结束必须通过：

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

E2E 建立后：

```bash
pnpm test:e2e
```

不得：

* skip failed test
* delete test
* suppress TypeScript
* broad `any`
* suppress lint
* swallow errors

来制造绿色结果。

---

# 74. Definition Of Done — Every Page

页面只有同时满足以下条件才叫 migrated：

* [ ] Feature behavior matches backend
* [ ] Correct route
* [ ] Correct permission
* [ ] Uses shared design system
* [ ] No duplicated primitive
* [ ] Loading state
* [ ] Empty state where applicable
* [ ] Error state
* [ ] Mutation feedback
* [ ] Responsive
* [ ] Light mode
* [ ] Dark mode
* [ ] zh
* [ ] en
* [ ] Keyboard usable
* [ ] No console error
* [ ] No unexpected network error
* [ ] Relevant automated test passes

---

# 75. Definition Of Done — Entire Rewrite

本次 rewrite 完成的标准不是：

> 所有 `.vue` 文件变成 `.tsx`。

而是：

### Architecture

* React/TanStack architecture 清晰
* API architecture 统一
* Server state 统一
* Feature boundaries 合理

### Design

* 全站使用统一 Design Token
* 无明显 component drift
* 无明显 spacing drift
* 无明显 typography drift

### UX

* Async feedback 一致
* Dialog 一致
* Form 一致
* Table 一致
* Error 一致
* Empty 一致
* Destructive action 一致

### Functional

* Existing user features preserved
* Existing admin features preserved
* Auth preserved
* Payment preserved
* OAuth preserved
* Permission preserved

### Quality

* lint passes
* typecheck passes
* unit tests pass
* E2E critical tests pass
* build passes

---

# 76. Final Design Principle

遇到任何 UI/UX 决策时，按以下优先级判断：

```text
1. Consistency
2. Clarity
3. Usability
4. Accessibility
5. Simplicity
6. Information density
7. Visual polish
8. Novelty
```

Novelty 永远最低。

---

# 77. Final Engineering Principle

优先级：

```text
Correctness
>
Consistency
>
Maintainability
>
Simplicity
>
Cleverness
```

---

# 78. Final Product Principle

Sub2API 新前端应该让用户感受到：

```text
Fast
Calm
Predictable
Consistent
Professional
Dense but not cluttered
Modern but not flashy
```

不要让用户意识到：

> “这个页面好像是另外一个 Agent 写的。”

---

# 79. First Task

现在不要开始批量写页面。

第一阶段只完成：

1. Audit current frontend
2. Generate feature inventory
3. Generate route migration matrix
4. Initialize TanStack Start with:

```bash
pnpm dlx shadcn@latest init --preset b7WQfDSML --template start
```

5. Establish project structure
6. Establish Design Tokens
7. Establish shared component architecture
8. Create `/dev/ui`
9. Create `frontend-design-system.md`
10. Create/update `AGENTS.md`
11. Implement AppShell
12. Implement API client foundation
13. Implement auth foundation

然后只迁移：

```text
Login
Dashboard
API Keys
Admin Users
```

完成后暂停批量迁移。

对这四个页面进行：

* UI consistency audit
* UX consistency audit
* responsive audit
* light/dark audit
* component reuse audit

确认 Pattern 后再进入下一阶段。

---

# 80. Reporting

每一阶段结束报告：

```text
Completed
Changed
Design decisions
Components introduced
Patterns introduced
Tests
Known gaps
Next phase
```

如果发现旧 frontend 与 backend Contract 不一致：

明确报告。

不要偷偷选择其中一个实现。

如果发现某个需求不确定：

优先从：

```text
backend
old frontend
tests
git history
```

寻找答案。

目标不是最快地产生最多代码。

目标是：

> 建立一套足够稳定的 frontend system，
> 让后面的页面迁移变成机械化组合，而不是继续进行 UI 发明。

