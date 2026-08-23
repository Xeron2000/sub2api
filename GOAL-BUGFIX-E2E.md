# GOAL — Sub2API 全量真实 API 路径对齐、网关联调与交互缺陷修复

> **目标**：修复由 Chrome DevTools E2E 深入审计与真实上游渠道（Nvidia Integrate API `openai/gpt-oss-120b`）联调发现的 **API 路由路径不一致、表单 Submit 空实现、前端 Polling 资源泄漏、以及用户/管理员核心业务链路缺陷**，使 54 个页面 100% 具备真实生产级可用性。

---

## 1. 发现的真实 Bug 与待修复清单

### 1.1 API 端点路径对齐修复（CRITICAL）
经与 Go 后端路由映射比对，以下前端页面的请求路径必须立即修正：

| 页面文件 | 当前错误路径 | 后端真实有效路径 | 说明 |
| :--- | :--- | :--- | :--- |
| `src/pages/user/KeysPage.tsx` | `/user/api-keys` | `/keys` | 用户 API Key 增删改查全套端点 |
| `src/pages/user/UsagePage.tsx` | `/user/usage` | `/usage` | 用户使用记录与 `/usage/errors` |
| `src/pages/user/RedeemPage.tsx` | `/user/redeem` | `/redeem` & `/redeem/history` | 用户卡密兑换与历史查询 |
| `src/pages/user/AvailableChannelsPage.tsx` | `/user/channels/available` | `/channels/available` | 用户可用渠道与延迟查询 |
| `src/pages/user/ChannelStatusPage.tsx` | `/channel-monitors` | `/channels/available` | 用户渠道监控列表 |
| `src/pages/admin/RedeemPage.tsx` | `/admin/redeem` | `/admin/redeem-codes` | 管理员卡密生成与管理 |
| `src/pages/public/ModelPlazaPage.tsx` | `/model-plaza/models` | `/model-plaza` | 公开模型广场 |
| `src/pages/user/DashboardPage.tsx` | `/dashboard/stats` | `/usage/dashboard/stats` | 用户仪表盘指标 |

### 1.2 表单与 CRUD 提交补齐（HIGH）
以下页面的 Sheet/Dialog 存在 `console.log` 占位，需补齐 `useMutation` 真实调用与 TanStack Query 缓存失效（`invalidateQueries`）：
1. **`src/pages/admin/UsersPage.tsx`**：
   - 新建/编辑用户：`POST /admin/users`、`PUT /admin/users/:id`（支持 email、role、status、balance、concurrency）。
   - 删除/封禁：`DELETE /admin/users/:id`、`POST /admin/users/:id/ban`。
2. **`src/pages/admin/GroupsPage.tsx`**：
   - 新建/编辑分组：`POST /admin/groups`、`PUT /admin/groups/:id`。
   - 删除分组：`DELETE /admin/groups/:id`。
3. **`src/pages/admin/ChannelsPage.tsx`**：
   - 新建/编辑渠道：`POST /admin/channels`、`PUT /admin/channels/:id`（支持 name、group_ids、model_pricing、model_mapping）。
   - 渠道状态切换：`PUT /admin/channels/:id`（status: active/disabled）。
4. **`src/pages/admin/AccountsPage.tsx`**：
   - 新建/编辑上游账号：`POST /admin/accounts`、`PUT /admin/accounts/:id`（支持 platform、type、credentials: { api_key, base_url }, group_ids, concurrency）。
   - 健康检测与状态切换：`POST /admin/accounts/:id/test`。
5. **`src/pages/user/KeysPage.tsx`**：
   - 新建 Key：`POST /keys`（返回包含真实完整明文密钥 `key`，并弹窗提示用户复制）。
   - 编辑 Key：`PUT /keys/:id`（修改 name、group_id、ip_whitelist）。
   - 删除 Key：`DELETE /keys/:id`。

### 1.3 支付轮询与生命周期资源泄漏修复（MEDIUM）
* **`PaymentQRCodePage.tsx` / `PaymentResultPage.tsx` / `AirwallexPaymentPage.tsx`**：
  - 修复 `refetchInterval` 在路由切换后仍可能继续轮询的问题。
  - 确保组件卸载（Unmount）时取消 Polling，并添加最大轮询次数或超时保护。

### 1.4 上游网关与模型广场联调验证（Nvidia Integrate API）
* 已在后端配置真实 Channel 与 Account：
  - **平台**：OpenAI 协议兼容 (`openai`)
  - **Base URL**：`https://integrate.api.nvidia.com/v1`
  - **API Key**：`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`
  - **模型**：`openai/gpt-oss-120b` (倍率/映射: `gpt-oss-120b`)
* 前端需要确保：
  - 在 `/keys` 创建的 Key 能够展示正确的可用模型与分组；
  - 在 `/model-plaza` 能够展示该模型及其倍率与所属分组。

---

## 2. 验收标准与验证合约

1. **类型与代码规范**：
   ```bash
   pnpm --dir frontend typecheck
   pnpm --dir frontend lint
   ```
   退出码均为 0，无任何类型错误。
2. **构建成功**：
   ```bash
   pnpm --dir frontend build
   ```
   打包成功，产物正常输出到 `dist/`。
3. **自动化端到端测试（Chrome DevTools）**：
   ```bash
   node frontend/test-e2e-devtools.mjs
   ```
   40+ 路由全部 200 OK 通过，0 页面崩溃，0 控制台未捕获异常。
4. **业务操作实测闭环**：
   - 真实在前端 `/keys` 页面创建一条 API Key，并成功复制密钥；
   - 真实在 `/admin/users` 创建/编辑一个测试账号；
   - 真实在 `/admin/settings` 修改站点名称并持久化保存。
