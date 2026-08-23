# Frontend V2 Baseline — Phase 0

> Goal: Sub2API Frontend V2 — Phase 0-6 基金会
> Branch: `prep/decouple-frontend`
> Fork: `Xeron2000/sub2api` (from `Wei-Shaw/sub2api`)

## Upstream Baseline

- **Upstream repo:** `Wei-Shaw/sub2api`
- **Upstream SHA:** `d45135d87540720e5e35a1b558fa76de72b549fa` — Merge PR #6068 `fix/codex-guardian-parent-affinity`
- **Fork commit at branch start:** `d45135d87`
- **Prep commit:** `a30c4c664` — `chore: add decoupling prep audit`
- **Recorded:** 2026-08-23T22:08+08:00 via `gh repo fork Wei-Shaw/sub2api --clone`
- **Remote verification:**
  ```
  origin    git@github.com:Xeron2000/sub2api.git (fork)
  upstream  https://github.com/Wei-Shaw/sub2api.git
  ```

## Backend Baseline Verification

```bash
go -C backend vet ./internal/web   # exit 0 (2026-08-23)
go -C backend build -o /tmp/sub2api ./cmd/server && /tmp/sub2api --version
# => Sub2API 0.1.179 (commit: unknown, built: unknown)
```

## Legacy Frontend Baseline

- **Location:** `frontend/` (Vue 3.4 + Vite 5 + pnpm, 764 files under `frontend/src`)
- **Build output (legacy coupling):** `frontend/vite.config.ts: outDir = '../backend/internal/web/dist'`
- **Preservation strategy:** 覆盖式原地重建 — 旧实现仅由 Git 历史与本 baseline 保留，不另存 `frontend-legacy/`。需对照时 `git show d45135d:frontend/...`。
- **Decoupling prep:** `docs/decoupling-prep.md` ( coupling B1-B4/F1-F3 ) 已推送至 `prep/decouple-frontend`

## Branch Policy

- 本 Goal 所有工作在 `prep/decouple-frontend` 上进行
- `main` 保持可回滚至 `d45135d`
- 新前端初始化后 `frontend/` 将被 clean-room 替换，历史对照以本 SHA 为锚点
