# Frontend Pattern Audit — frontend-new (Goal 2 Baseline)

> Date: 2026-08-26  
> Scope: `frontend-new/src/components`, `src/lib`, `src/routes/login.tsx`, `dashboard.tsx`, `keys.tsx`, `admin/users.tsx`, `dev/ui.tsx` vs `frontend/` (old), `backend/`, `tests/`
> Method: static scan (`rg`, read) +对照旧 `frontend/src/api/client.ts`, `tokenRefresh.ts`, `adminUIRequest.ts`, `url.ts` + `backend/internal` handler 约定

## Summary

| Severity | Count | Must fix in Goal 2 |
|----------|-------|-------------------|
| P0 security/data corruption | 3 | yes |
| P1 broken core / API mismatch | 9 | yes |
| P2 UX/component inconsistency | 10 | yes |
| P3 polish | 7 | yes (freeze) |

---

## P0 — Security / Data Corruption

| ID | Location | Issue | Evidence | Fix |
|----|----------|-------|----------|-----|
| P0-1 | `lib/api/client.ts:53-61` | 401 直接 `removeItem`+`href=/login`，无 refresh→retry，token 刚过期即登出；旧前端 `tokenRefresh.ts` 有 `inFlightRefresh` + `WebLock` 单飞 + `sessionChanged` 竞态保护 | 新 client 无 `inFlightRefresh`, 无 `/auth/refresh` 调用 | 复刻 `frontend/src/api/tokenRefresh.ts` 的 single-flight + session 竞态 |
| P0-2 | `routes/keys.tsx:32`, `admin/users.tsx:29`, `dashboard.tsx:46`, `usage.tsx:28` 等 9 处 | `.catch(()=>({data:{items:[],total:0}}))` 把 500/401 伪装成 Empty，导致用户误以为“无数据” | `rg -n "\.catch\(\(\)"` 命中 9 处 | 删除 fake fallback，错误走 `ErrorState` |
| P0-3 | `lib/api/client.ts:18-35` | 请求头缺 `Accept-Language`，`Admin/User UI Marker` 未透传；旧 client 在 `request` 拦截器中添加 `Accept-Language=getLocale()` + `X-Admin-UI-Request`/`X-User-UI-Request` 语义，backend 依赖 | 新 client 仅发 `timezone` | 补齐 4 个 header/param 语义 |

## P1 — Broken Core Behavior / API Mismatch

| ID | Location | Issue | Evidence |
|----|----------|-------|----------|
| P1-1 | `lib/api/client.ts` | 无并发 401 的 single-flight：20 请求同时 401 会触发 20 次 refresh 风暴；旧 `tokenRefresh.ts` 用 `inFlightRefresh` + `TOKEN_REFRESH_LOCK_NAME` + `PEER_REFRESH_WAIT_MS` 防风暴 | 新 client 直接 `removeItem` |
| P1-2 | `lib/api/client.ts` | 无 Session Race Safety：请求 A 发起→用户登出/切换账号→旧 refresh 覆盖新 session；旧实现对比 `refresh_token` + `auth_user` 的 `sessionChanged` 判定 | 新 client 无对比 |
| P1-3 | `lib/api/client.ts:61` | `window.location.href=/login` 造成 redirect loop 风险，且与 TanStack Router 守卫语义不一致；旧实现由 `__root` 守卫 + `refreshFailed` 才定向 | 新 client 无 loop 防护 |
| P1-4 | `lib/api/errors.ts` | `toAppError` 未覆盖 `code/reason/metadata` 的结构化透传；旧 client 在 422/429/409 等场景依赖 `code` 区分 | `errors.ts` 仅 `status/message` |
| P1-5 | `lib/query/keys.ts` | `queryKeys` 已有，但部分页面仍手写 `useQuery` 且 `retry:false` 缺失、未传 `AbortSignal`，搜索竞态会让旧请求覆盖新结果 | `keys.tsx` 未用 `signal` |
| P1-6 | `routes/__root.tsx` | `<html lang="en">` 写死，未跟随 `locale`；`title` 仍为 `TanStack Start Starter` | `__root.tsx:19,27` |
| P1-7 | `routes/__root.tsx` + `lib/api/client.ts` | `localStorage`/`window` 直接访问未包 client boundary，SSR  hydration 可能闪 Admin 内容 | `login.tsx:34-36` 同步写 storage 后 `navigate` 无 `auth_user` hydration 等待 |
| P1-8 | `routes/login.tsx` | 成功后仅写 storage + `navigate(/dashboard)`，未更新 `queryClient` 的 `auth.currentUser`，后续 `dashboard` 的 `/auth/me` 可能仍 401 | 旧 `frontend` 有 `auth` store |
| P1-9 | `lib/api/auth.ts` | 仅 `login`/`getCurrentUser`，缺 `refresh`, `logout`, `register` 等旧 `auth.ts` 能力，字段 `expires_in` 未持久化 `token_expires_at` | 旧 `setTokenExpiresAt` 未移植 |

## P2 — UX / Component Inconsistency

| ID | Location | Issue |
|----|----------|-------|
| P2-1 | `components/shared/DataTable.tsx` | `Column.cell: (row:any)=>ReactNode`, `data: T[]` 但调用处 `as unknown as Record<string,unknown>[]`，`key={ri}` 用 index，hook 顺序：early return 在 `useTranslation()` 前风险 |
| P2-2 | `routes/keys.tsx:50` | `alert("Create flow...")` placeholder action，用户可点但无真实行为 |
| P2-3 | `routes/dev/ui.tsx:164` | `alert("retry")` 作为 ErrorState demo 的 retry 实现 |
| P2-4 | `routes/admin/users.tsx:10-35` | 硬编码文案 `"Clear filters" "Refresh" "ID" "Email" "Role"` 未走 `t()`，i18n 缺漏 |
| P2-5 | `routes/dashboard.tsx` | `statsQuery` 失败伪装为 `0`，`StatCard` 无法区分 `0` 与 `Failed` |
| P2-6 | `routes/keys.tsx` + `admin/users.tsx` | Search 无 debounce，无 `page→1` 统一 hook，每次 keystroke 打 backend |
| P2-7 | `components/shared/StatusBadge.tsx` | 仅 `success/warning/error/info/default`，未集中语义映射；页面各自 `r.status===active?success:warning` 零散判断 |
| P2-8 | `routes/__root.tsx` | `TanStackDevtools` 无 `import.meta.env.DEV` 守卫，生产向普通用户暴露 |
| P2-9 | `components/layout/AppShell.tsx` + `styles.css` | Theme 仅存在 token，未实现 `light/dark/system` Provider + Toggle + persistence + 无 hydration flash |
| P2-10 | `routes/login.tsx` | Zod message 硬编码 `Invalid email/Password required`，未进 i18n；`Label`/`Input` 未关联 `aria`，可访问性不足 |

## P3 — Polish (Freeze 必做)

| ID | Location | Issue |
|----|----------|-------|
| P3-1 | `components/ui/*` | 部分 icon 仍用 `●` 字符（`dev/ui.tsx:60` `animate-pulse` ●）而非 `remixicon` |
| P3-2 | `routes/keys.tsx` / `admin/users.tsx` | `DataTable` 列对齐未冻结；`actions` 应 `right`，`text/email` 应 `left`，现混用 |
| P3-3 | `components/shared/*` | `PageContainer/PageHeader/PageSection` 间距未文档化，页面各自 `mt-6 space-y-4` 不一致 |
| P3-4 | `components/shared/ConfirmDialog.tsx` / `DeleteConfirmDialog` | 未统一 destructive pattern 的 Title/Description/Cancel/Loading/Failure 语义 |
| P3-5 | `routes/login.tsx` | 缺 `AsyncButton` 统一 `idle/loading/disabled` 态，手写 `disabled={mutation.isPending}` |
| P3-6 | `routes/dev/ui.tsx` | 仅 4 个 tab，未覆盖 `Typography/Colors/Spacing/Form/Dialog/Toast/Pagination/PageHeader/Empty/Error/Loading` 全量（goal2 §49） |
| P3-7 | `lib/api/admin/*` | Route 直接 `apiClient.get` 散落，未收敛为 `lib/api/keys.ts`, `lib/api/users.ts` 的 feature function（§66） |

---

## API Contract Parity Checklist (backend is SoT)

> 旧 `frontend/src/api/*.ts` 仅作行为参考，最终以 `backend/internal` handler 为准（`goal2.md §65` 约定）

| Page | UI Action | Frontend fn | HTTP | Backend handler (to verify) | Notes |
|------|-----------|-------------|------|------------------------------|-------|
| Login | submit | `lib/api/auth.login` | `POST /auth/login` | `internal/handler/auth` | 需核 `expires_in` |
| Keys | list | `apiClient.get /keys` | `GET /keys?page&page_size&search` | `internal/handler/keys` | 需核 `search`/`timezone` |
| Keys | create | — (alert placeholder) | `POST /keys` | 同上 | backend 支持字段待逐项核 |
| Admin Users | list | `apiClient.get /admin/users` | `GET /admin/users` | `internal/handler/admin` | 需核 search/filter |
| Dashboard | stats | `GET /usage/dashboard/stats` | `GET /usage/dashboard/stats` | `internal/handler/usage` | 区分 0 vs error |

Headers to preserve: `Authorization: Bearer`, `Accept-Language`, `timezone` param, `X-Admin-UI-Request: 1`, `X-User-UI-Request: 1`

---

## Route Guard Inventory

| Route | Current guard | Required |
|-------|---------------|----------|
| `/login`, `/register` | none | anonymous only → 已登录重定向 `/dashboard` |
| `/dashboard`, `/keys`, `/usage`, `/profile` | Sidebar hide only | 需 TanStack Router `beforeLoad` 鉴权，未登录→`/login?redirect=` |
| `/admin/*` | Sidebar hide only | 需 `role===admin` 校验，普通用户→`/` 或 403 |

## Counts

- `rg "\.catch\(\(\)"` : 9 hits (P0-2)
- `rg "alert\(|console\.log"` in representative pages: 2 hits (keys, dev/ui)
- `rg "as any|as unknown"` in representative pages + DataTable: 6+ hits
- `rg "bg-white|text-black|bg-gray"` : 0 in business pages (ok), but semantic token sweep still required
