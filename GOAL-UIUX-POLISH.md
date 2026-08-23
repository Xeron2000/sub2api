# GOAL — Sub2API Frontend UI/UX 深度体验与默会知识一致性精细化重构

> **目标**：彻底清除当前前端系统中**违背用户默会知识的粗糙交互（如阻塞式 `window.alert`、无眼睛切换的密码框、无加载态按钮）**，统一 **shadcn/ui (radix preset `b4YsqxoEWf`)** 设计语言，补齐 **Toast 悬浮通知、主动式空状态引导 (CTA)、表格危险操作视觉警示、侧边栏活动路由高亮与顶栏主题/国际化切换器**。

---

## 1. 核心体验与设计缺陷修复清单 (UI/UX Defects)

### 1.1 全局交互反馈与通知系统重构（CRITICAL）
* **现状问题**：当前保存、创建、复制、删除操作大量使用浏览器原生 `window.alert(...)` 与 `window.confirm(...)`，完全阻塞 UI 线程，且视觉风格与整体现代暗色/浅色主题割裂。
* **重构方案**：
  - 引入并配置 `sonner`（或 Radix Toast）全局 `<Toaster position="top-right" richColors />`；
  - 将所有页面的 `alert("...")` 替换为 `toast.success(...)`、`toast.error(...)`、`toast.info(...)`；
  - 复制 Key / Token 时提供带图标的轻量级 Toast（如 `toast.success("API Key 已复制到剪贴板")`）。

### 1.2 认证与表单输入体验对齐（HIGH）
* **密码框可视化**：在 `LoginPage`、`RegisterPage`、`ProfilePage`（修改密码）、`ResetPasswordPage` 的密码输入框右侧增加 `Eye / EyeOff` 切换眼睛图标，点击可切换明文/密文显示。
* **登录偏好与快捷操作**：
  - 登录页增加“记住我 / Remember Me”复选框（持久化配置）；
  - 表单提交按钮增加 `isSubmitting` / `isPending` 加载动画（Spinner + `disabled` 禁用状态），避免重复点击。
* **系统设置表单增强**：在 `SettingsPage` 中为每个 Switch 开关（如注册开放、支付功能、TOTP、Passkey、风控开关）添加简明副标题与说明文字，而非仅仅罗列开关。

### 1.3 数据表格与危险操作视觉一致性（HIGH）
* **危险操作警示**：在 `KeysPage`、`UsersPage`、`GroupsPage`、`ChannelsPage`、`AccountsPage`、`ProxiesPage` 中，将“删除 / 禁用 / 封禁”按钮统一设置为 `text-destructive hover:bg-destructive/10 hover:text-destructive` 红色危险警示样式。
* **删除二次确认 Dialog**：点击删除时弹出规范的 `Dialog`（包含标题“确认删除？”、详细警示“此操作不可逆，将永久删除该项”、红色的“确认删除”按钮和“取消”按钮）。
* **搜索框与工具栏体验**：为 DataTable 搜索栏添加清空按钮（X 图标），支持回车即搜与自动防抖（Debounce）。

### 1.4 API 密钥展示与安全抽屉体验（HIGH）
* **`KeysPage` 密钥创建体验**：
  - 用户创建 Key 成功后，弹出专用的 **“API Key 创建成功” Dialog**；
  - 以等宽字体（`font-mono`）、高亮背景展示完整密钥，并附带醒目的 **“一键复制”** 按钮；
  - 提示明确的安全警示文本：“此密钥仅显示一次，请妥善保存”。

### 1.5 导航骨架与空状态主动式引导 (CTA)（MEDIUM）
* **AppShell 导航高亮**：侧边栏与顶栏链接在当前激活路由时高亮显示（`bg-accent text-accent-foreground font-medium` 与左侧/底部微指示线）。
* **顶栏工具条**：在 Header 右上角常驻：
  1. 主题切换器（Theme Toggler：明亮 / 暗黑 / 跟随系统）；
  2. 国际化语言切换器（Language Selector：中文 / English）；
  3. 用户信息下拉菜单（包含个人资料、修改密码、退出登录）。
* **空状态 Action 引导**：在所有列表为空时（如暂无 API Key、暂无订单、暂无使用记录），不仅展示“暂无数据”，还提供直接的 CTA 引导按钮（如“立即创建 Key”、“前往购买套餐”）。

---

## 2. 验收标准与核验合约

1. **零原生 Alert / Confirm**：
   全局代码搜索 `alert(` 与 `confirm(` 数量必须归零，全部由 `sonner` Toast 与 Radix Dialog 接管。
2. **类型与构建门禁**：
   ```bash
   pnpm --dir frontend typecheck
   pnpm --dir frontend lint
   pnpm --dir frontend build
   ```
   退出码均为 0，无任何 TypeScript 与 ESLint 报错。
3. **Chrome DevTools 视觉交互核验**：
   ```bash
   node frontend/test-e2e-devtools.mjs
   ```
   所有页面渲染正常，密码切换、Toast 弹出、Dialog 交互均流畅顺滑。
