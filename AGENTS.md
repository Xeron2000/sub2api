# AGENTS — frontend-new/ Guardrails

> This file is the agent contract for the frontend rewrite. Every new page must satisfy these before merge.

## Before creating a UI component

1. Search existing `shadcn/ui` and `shared/` components first (`components/ui/*`, `components/shared/*`, `components/domain/*`, `components/layout/*`).
2. Check if it's a variant of an existing component (`<Button variant="...">`), not a new `BlueButton`/`CustomModal`.
3. Follow the reuse chain: shadcn → `ui/` → `shared/` → `domain/` → variant → only then new.

## Tokens & Styling

- Never introduce arbitrary colors when semantic tokens exist (`background`, `foreground`, `primary`, `muted`, `border`, etc. in `src/styles.css`).
- Never hardcode `bg-blue-500`, `text-gray-600`, `bg-[#123456]`, `w-[437px]`, `mt-[13px]` in business pages (exceptions: charts, SDK, computed layout).
- Use spacing scale `gap-1/2/3/4/6/8` and `PageContainer`/`PageHeader` for page padding (16px mobile, 24px desktop).
- Never mix `rounded-md` vs `rounded-3xl` arbitrarily — follow preset `radius: 0` semantics.

## Architecture

- Do not alter backend API contracts to simplify frontend code. Backend is source of truth (`http://localhost:18786`).
- Do not move Go/backend logic into TanStack Start server functions. Start is for routing/layouts only.
- All server state via `TanStack Query` with `queryKeys.*` (e.g. `queryKeys.users.list(filters)`), not scattered `['users']` or duplicated Context.
- All forms via `React Hook Form + Zod + shadcn Form`; backend 422 must map to field errors.

## States & UX

- All async operations require explicit loading and error behavior (button spinner, no layout shift, no duplicate submit).
- All list pages require `loading` (Skeleton), `empty` (`<EmptyState>` with CTA), `error` (`<ErrorState>` with retry), and `populated` states.
- Destructive actions must use `AlertDialog` with object + consequence + irreversibility; never `window.confirm()`.
- Toast only for short feedback; never for validation or page errors.

## Verification per page

- Every new page must work in **light and dark** mode.
- Every new page must be checked at **390px** and **desktop (1440px)** width.
- Every new page must have `loading`/`empty`/`error` states handled (no blank page).
- UI consistency > local cleverness. When in doubt, copy the nearest representative page pattern.

## Frozen Patterns (Goal 2)

> Patterns frozen at `docs/frontend-patterns.md` — do not mutate silently. New pages compose existing patterns.

## Never Do

- Never silently convert API errors into empty states (no `.catch(()=>{items:[]})` fake success).
- Never use browser `alert`/`confirm` for product UX — use `Dialog`/`AlertDialog`.
- Never create a new primitive before checking `shadcn/ui`.
- Never hardcode user-visible strings outside `i18n`.
- Never hardcode visual colors when semantic tokens exist.
- Never add route actions without real backend behavior — remove placeholder until implemented.
- Never bypass shared `Page/Table/Form/Dialog` patterns.
- Never duplicate server state outside `TanStack Query` without a reason.
- Never weaken authentication or token-refresh behavior during migration (keep single-flight, session race, headers parity).
- All user and admin routes must enforce authorization at route level (not just Sidebar hide).
- Do not mass-migrate pages until frozen patterns are established.

## References

- Design system: `docs/frontend-design-system.md`
- Frozen patterns: `docs/frontend-patterns.md` (AUTHORITATIVE)
- Pattern audit: `docs/frontend-pattern-audit.md`
- Inventory: `docs/frontend-feature-inventory.md`
- Route map: `docs/frontend-route-migration.md`
- Preset: `b7WQfDSML` (`frontend-new/components.json` → `base-sera/taupe/remixicon`, `frontend-new/src/styles.css`)
