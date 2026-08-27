# Frontend Design System — frontend-new/ (preset b7WQfDSML)

> Source of truth: `frontend-new/src/styles.css` + `frontend-new/components.json` (`style: base-sera`, `baseColor: taupe`, `icon: remixicon`, `menu: inverted`)
> Stack: React + TanStack Start + Tailwind 4 + shadcn/ui (Base UI) + Oxanium Variable

## 1. Colors — Semantic Tokens First

Use semantic tokens, never raw `bg-blue-500` in business pages.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `background` / `foreground` | `oklch(1 0 0)` / `oklch(0.147 0.004 49.3)` | inverted | page |
| `card` / `card-foreground` | `1 0 0` / `0.147` | `0.214` / `0.986` | cards |
| `popover` / `popover-foreground` | same as card | same as card | popovers |
| `primary` / `primary-foreground` | `0.214` / `0.986` | `0.922` / `0.214` | primary actions |
| `secondary` / `secondary-foreground` | `0.96` / `0.214` | `0.268` / `0.986` | secondary |
| `muted` / `muted-foreground` | `0.96` / `0.547` | `0.268` / `0.714` | muted text, secondary body |
| `accent` / `accent-foreground` | `0.96` / `0.214` | `0.268` / `0.986` | hover, subtle |
| `destructive` | `0.577 0.245 27.325` | `0.704 0.191 22.216` | delete/danger only |
| `border` / `input` / `ring` | `0.922` / `0.922` / `0.714` | `10%` / `15%` / `0.547` | borders, focus |
| `chart-1..5` | taupe ramp | same | charts |
| `sidebar*` | taupe light | taupe dark + `0.488 0.243 264.376` primary | sidebar |

**Rule**: business status colors → wrap in `<StatusBadge status="success|warning|error" />`, never inline `bg-green-*`.

## 2. Typography

- Font: `Oxanium Variable` (`@fontsource-variable/oxanium`), `font-sans` on `html`.
- Hierarchy (use Tailwind scale, no arbitrary `text-[17px]`):
  - `text-2xl` Page Title, `text-xl` Section Title, `text-base` Card Title, `text-sm` Body (default for admin), `text-sm text-muted-foreground` Secondary, `text-xs` Caption/Label, `font-mono` for code/numbers.
- Allowed: `text-xs` `text-sm` `text-base` `text-lg` `text-xl` `text-2xl`. Others need justification.

## 3. Spacing

- Scale: `gap-1 (4px)` `gap-2 (8px)` `gap-3 (12px)` `gap-4 (16px)` `gap-6 (24px)` `gap-8 (32px)`. Avoid `gap-5/7/9` without reason.
- Page: `PageContainer` handles padding — `px-4 (16px)` mobile, `px-6 (24px)` desktop, `px-8 (32px)` large. Section gap `gap-6 (24px)`, control gap `gap-2/3 (8/12px)`, form field gap uniform.
- No arbitrary `w-[437px]` `mt-[13px]` `bg-[#123456]` except SDK/charts/special layout.

## 4. Radius & Shadows

- Radius: preset `0` (sharp). Semantic: `control (--radius)` `card (--radius-lg)` `dialog (--radius-xl)` `floating (--radius-2xl)`. Do not mix `rounded-md` vs `rounded-3xl` arbitrarily.
- Shadows: minimal. Use `border` + `spacing` + `background` hierarchy. Only `dropdown`/`popover`/`dialog`/`tooltip` get elevation.

## 5. Icons

- Library: `remixicon` only (per preset). No Lucide/Heroicons/emoji mixed.
- Sizes: `16px` regular action, `20px` nav/prominent. Icon buttons require `aria-label` + `Tooltip`.

## 6. Components — 4 Layers

```
src/components/ui/      — shadcn primitives (button, input, select, dialog, table, etc.)
src/components/shared/  — product primitives (PageHeader, DataTable, EmptyState, ErrorState, etc.)
src/components/domain/  — business (UserStatusBadge, APIKeyCard, ChannelStatus, etc.)
src/components/layout/  — shells (AppShell, AdminShell, AppSidebar, AppHeader)
```

**Reuse check** before creating: 1) shadcn has it? 2) `ui/` has it? 3) `shared/` has it? 4) `domain/` has it? 5) variant? 6) only then new.

**Variant over duplication**: `<Button variant="default|secondary|outline|ghost|destructive">`, not `BlueButton`.

## 7. Layout

- Shells: `AppShell` (user), `AdminShell` (admin), `PublicShell`, `AuthShell`.
- All pages: `<PageContainer><PageHeader /><Section />...` — never per-page `max-width`/`padding`/`header height`.
- Sidebar: `AppSidebar` (desktop) + `MobileNavigation` (Sheet on <768px).
- Responsive: `390px` `768px` `1024px` `1440px`, mobile-first. Dense tables → horizontal scroll or card.

## 8. Interaction

- Button hierarchy: one `Primary` per region (`Create API Key`), `Secondary` for cancel/export, `Ghost` for row actions, `Destructive` only for delete/revoke.
- Async button: `idle → loading (spinner, no layout shift, disabled) → success/error`.
- Forms: `React Hook Form + Zod + shadcn Form`. Layout `Label → Input → Description → Error`, validation client+backend, backend 422 mapped to field errors (never raw `Request failed 422`).
- Actions: `Cancel | Primary` desktop footer; destructive uses `AlertDialog` with object+consequence+irreversibility text, never `window.confirm()`.
- Toast: only short feedback (`Saved`, `Copied`, `Failed`), not for long/locus/page errors.
- Errors: field → inline, operation → inline Alert or Toast, page → `<ErrorState retry>`.
- Loading: page → Skeleton, button → spinner, region → inline, background refresh → keep stale.
- Empty: `<EmptyState title="No API keys yet" action={<Button>Create</Button>}>`, not `No data`.
- Tables: via `DataTable` — unified header density/hover/selection/actions/pagination/empty/loading/error. Align: text left, number/money right, actions right. Row actions → `DropdownMenu`, not 7 buttons.
- Filters: `Search | Filters | DateRange | Spacer | Refresh/Export/Create`, with `Clear filters`. Search debounce 250–400ms, race guard (last query wins).
- Pagination: page + pageSize + total + prev/next, reset to 1 on filter change.
- Dialog/Sheet: simple entity → `Dialog`, complex → page/large Dialog, mobile → `ResponsiveDialog` (Sheet). Footer `Cancel | Primary`.

## 9. Responsive & Dark

- Mobile touch target ≥44px container, icon 16px ok but hit area larger.
- Dark: all tokens have `dark:` variant; never hardcode `bg-white`/`text-black`. Verify every new page in both.

## 10. i18n / Formatters

- Keep `en`/`zh` via unified i18n (no hard-coded strings). Date/number/money via shared formatters (locale/timezone aware).

## 11. Accessibility & Motion

- Depend on shadcn a11y: semantic HTML, keyboard, focus, dialog trap, ESC, label/input, aria-label, contrast.
- Motion minimal: dialog/popover/sidebar/loader only. No flying/fade/bounce/gradient.

## 12. Do / Don't

| Do | Don't |
|----|-------|
| `<Button><StatusBadge>` via tokens/variants | `<button className="bg-blue-500 rounded-xl">` or `BlueButton` |
| `gap-4` `text-sm text-muted-foreground` | `mt-[13px]` `text-[15px]` `bg-[#123456]` |
| `PageHeader` + `PageContainer` per page | per-page `max-w-[1200px] mx-auto p-6` |
| `DataTable` for all tables | per-page custom `<table>` style |
| `AlertDialog` for delete with explanation | `window.confirm('delete?')` |
| `Skeleton` for page load | `Loading...` everywhere |
| `remixicon` 16/20px + Tooltip | mixed Lucide + emoji |
| `useQuery` with `queryKeys.users.list(filters)` | `useState` + `fetch` scattered, `['users']` ad-hoc keys |

## 13. File Conventions

```
src/routes/        — file-based (TanStack Router), `__root.tsx` + `index.tsx` + `admin/users.tsx`
src/lib/api/       — baseURL, auth, interceptors, error normalization → `AppError`
src/lib/query/     — `queryKeys.*`
features/{name}/   — complex feature colocation (api.ts, queries.ts, schemas.ts, components/)
hooks/ lib/        — shared
```
