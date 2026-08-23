# GOAL — Sub2API Frontend V2 全量重构与真实后端业务闭环

> **项目目标**：在 `frontend/` 目录下，基于 **React 18+ / Vite 6+ / TypeScript Strict / pnpm / shadcn UI (radix preset `b4YsqxoEWf`)** 技术栈，全量重写 Sub2API 前端，覆盖原有 Vue 前端的所有 **54 条业务路由与全部功能模块**，全量对接真实 Go 后端 API（`http://localhost:8080/api/v1`），彻底替代旧版前端并达到生产可用标准。

---

## 1. 架构与工程规范

### 1.1 技术选型与视觉基线
* **核心框架**：React 18+、Vite 6+、TypeScript (strict 模式)。
* **包管理**：`pnpm`（保证 `pnpm-lock.yaml` 为单一权威锁文件）。
* **UI 体系**：`shadcn/ui` + Tailwind CSS，以 preset `b4YsqxoEWf`（Radix-lyra Taupe）为统一视觉基线。
* **数据流与网络**：TanStack Query (React Query v5) + Axios 统一拦截器（含单飞行 Token 刷新与错误归一化）。
* **表单与校验**：React Hook Form + Zod（统一 Schema 验证与 Inline 错误提示）。
* **表格与状态**：TanStack Table v8（受控分页、排序、筛选）+ `useTableUrlState` Hook（全量与 URL Query 同步）。
* **国际化与主题**：`src/i18n`（中文 / 英文双语完整覆盖）+ `next-themes`（Light / Dark / System 自适应）。

### 1.2 鉴权与传输规范
* **Token 存储**：`auth_token`、`refresh_token` 与 `auth_user` 严格遵循统一管理。
* **请求头自动注入**：`Authorization: Bearer <token>`、`Accept-Language`、`X-UI-Request: true`、GET 请求自动附加 `?timezone=`。
* **401 故障恢复**：自动触发单飞 `POST /auth/refresh`；刷新失败则安全清空缓存并重定向至 `/login?redirect=...`。
* **路由守卫**：`Protected` 组件支持 `requiresAuth`、`requiresAdmin`、`requiresPayment`、`requiresRiskControl`，拦截未配置管理员时自动导向 `/setup`。

---

## 2. 全量 54 条路由与功能模块清单

### 模块 A：系统初始化与公开页面 (Setup & Public)
1. **`/setup`**：系统初始化向导（引导配置管理员账号、数据库与核心参数，完成后自动跳转）。
2. **`/home` (及 `/` 重定向)**：产品首页、特性介绍、快捷入口。
3. **`/model-plaza`**：模型广场（展示支持的模型、倍率、可用分组，支持未登录/已登录两种视角）。
4. **`/key-usage`**：免登录单 Key 额度与用量公网查询页（支持 `?key=` 参数自动填充与数据可视化）。
5. **`/legal/:documentId`**：法律条款与服务协议展示页。

### 模块 B：认证与安全中心 (Auth & Security)
6. **`/login`**：账号密码登录、验证码登录、Passkey 免密登录入口、OAuth 快捷登录入口、记住我。
7. **`/register`**：用户注册（支持邮箱验证码、邀请码与促销码实时校验）。
8. **`/email-verify`**：邮箱激活与验证流程。
9. **`/forgot-password` & `/reset-password`**：找回密码与重置密码流程。
10. **OAuth 回调体系**：
    * `/auth/callback`（GitHub / Google 通用 OAuth 回调）；
    * `/auth/linuxdo/callback`（LinuxDo OAuth）；
    * `/auth/wechat/callback` & `/auth/wechat/payment/callback`（微信扫码与服务号授权）；
    * `/auth/dingtalk/callback` & `/auth/dingtalk/email-completion`（钉钉授权与邮箱补全）；
    * `/auth/oidc/callback`（企业级 OIDC / SSO 回调）；
    * 未绑定账号时的 Pending OAuth 补全与关联流。
11. **双因素认证 (2FA / WebAuthn)**：TOTP 动态口令校验、WebAuthn / Passkey 注册与认证。

### 模块 C：用户控制台 (User Portal)
12. **`/dashboard`**：用户仪表盘（实时余额/配额卡片、今日调用统计、公告通知、快捷操作）。
13. **`/keys`**：API Key 管理（创建 Key、分组绑定、IP 白名单、速率限制、复制、禁用/删除、单 Key 每日消耗折线图）。
14. **`/usage`**：用量详情（按时间/模型/Key 多维筛选、请求记录分页、错误详情弹窗、Token 消耗统计）。
15. **`/subscriptions`**：用户订阅套餐（当前生效订阅、用量进度条、续费管理）。
16. **`/purchase`**：套餐购买与额度充值（支持不同周期的订阅计划选择）。
17. **`/orders`**：用户历史订单列表与状态查询。
18. **收银台与支付网关**：
    * `/payment/qrcode`：微信/支付宝 Native 扫码支付与长轮询状态监听；
    * `/payment/stripe` & `/payment/stripe-popup`：Stripe Elements 信用卡支付与 3D Secure 弹窗；
    * `/payment/airwallex`：Airwallex 嵌入式组件支付；
    * `/payment/result`：支付结果回调落地页。
19. **`/redeem`**：卡密/兑换码核销与历史记录。
20. **`/affiliate`**：邀请返利中心（专属邀请链接、返利比例、返利明细、返利额度划转至主账户）。
21. **`/profile`**：个人资料设置、修改密码、邮箱解绑/换绑、安全设备管理。
22. **`/available-channels` & `/monitor`**：用户端可用渠道健康度与延迟监控视图。
23. **`/custom/:id`**：自定义扩展页面渲染。

### 模块 D：管理控制台 (Admin Console)
24. **`/admin/dashboard`**：管理总览看板（总调用量、活跃用户、实时营收、模型热度排行、系统负载）。
25. **`/admin/ops`**：高级运维看板（实时 QPS 图表、并发流量监控、节点可用性、系统日志实时流）。
26. **`/admin/users`**：用户全生命周期管理（列表筛选/排序、Sheet 创建/编辑用户、分配角色/分组/配额、封禁/解封、批量操作）。
27. **`/admin/groups`**：权限与模型分组（新建/编辑分组、设置倍率、权限规则、防重复提交保护）。
28. **`/admin/channels/pricing`**：渠道与定价管理（上游渠道配置、权重分流、国内主流厂商模型倍率预设、健康检测）。
29. **`/admin/channels/monitor`**：渠道监控告警配置与聚合状态矩阵。
30. **`/admin/accounts`**：上游账号池管理（多平台账号添加、批量导入、Ollama / Cloud 连通性探测、健康状态切换）。
31. **`/admin/subscriptions`**：SaaS 订阅套餐方案配置（创建套餐、定价、周期配额、限制规则）。
32. **`/admin/promo-codes`**：促销优惠码生成与管理（折扣率、有效期、使用次数限制）。
33. **`/admin/redeem`**：卡密兑换码批量生成、导出与核销审计。
34. **`/admin/announcements`**：全局公告发布与管理（支持 Markdown、弹窗/顶部通知、定时生效）。
35. **`/admin/proxies`**：网络代理池管理（HTTP/SOCKS5 代理添加、连通性测试、分组绑定）。
36. **`/admin/settings`**：系统全局设置中心：
    * 基础站点信息与自定义注入；
    * 支付网关配置（官方/易支付 支付宝与微信、Stripe、Airwallex）；
    * 登录与注册策略（开放注册、强制验证码、OAuth 开关）；
    * 邮件与通知服务配置。
37. **`/admin/risk-control`**：风控拦截引擎（敏感行为监控、IP/用户自动封禁、规则配置与解封）。
38. **`/admin/prompt-audit`**：Prompt 审计中心（合规敏感词检测、违规调用审查与处理）。
39. **`/admin/audit-logs`**：全量系统操作审计日志（检索、导出、安全清理）。
40. **`/admin/usage`**：全局用量分析看板（按租户/组织/模型下钻统计）。

---

## 3. 实施与分阶段里程碑 (Milestones)

* **Phase 1 — 鉴权与 Setup 闭环**：实现 `/setup`、`/login`、`/register`、全套 OAuth 回调处理、JWT 刷新与守卫。
* **Phase 2 — User 业务闭环**：实现 `/dashboard`、`/keys`、`/usage`、`/profile`、`/redeem`、`/affiliate` 与支付收银台对接。
* **Phase 3 — Admin 核心管理闭环**：实现 `/admin/users`、`/admin/groups`、`/admin/channels`、`/admin/accounts` 的全量 CRUD 与高级配置。
* **Phase 4 — Admin 高级运维与设置**：实现 `/admin/settings`、`/admin/ops`、`/admin/risk-control`、`/admin/audit-logs` 与监控看板。
* **Phase 5 — 门禁与真实环境端到端验证**：针对本地真实后端（`http://localhost:8080`），完成自动化测试、静态分析与全流程联调。

---

## 4. 验收标准与核验合约 (Verification Contract)

本目标完成必须满足以下 **严格的机械与语义验证合约**：

1. **类型与代码规范**：
   ```bash
   pnpm --dir frontend typecheck
   pnpm --dir frontend lint
   ```
   两个命令必须退出码为 0，零 TypeScript 类型报错，零 ESLint 警告。
2. **生产构建成功**：
   ```bash
   pnpm --dir frontend build
   ```
   构建必须成功，产物正确输出到 `frontend/dist`，无外部依赖缺失。
3. **单元测试与组件测试**：
   ```bash
   pnpm --dir frontend test:run
   ```
   全部测试套件（Client、Guards、URL State、Hooks、Forms）100% 通过。
4. **全量 54 条路由映射完整性**：
   `frontend/src/app/router` 中必须完整声明并正确实现 `docs/frontend-v2/route-map.md` 列出的全部 54 个独立业务路由，无死链接。
5. **真实后端联调连通**：
   使用真实运行在 `http://localhost:8080` 的 Sub2API 后端服务：
   * 成功使用 `admin@sub2api.local / Admin123456` 完成真实登录并获取有效 JWT；
   * 管理员后台成功读取真实的用户列表与系统配置；
   * 普通用户成功完成创建真实 API Key 并在控制台展示。
