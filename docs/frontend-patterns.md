# Frontend Patterns — Frozen after Goal 2

> **Status: FROZEN — 2026-08-26**  
> These patterns are frozen after Goal 2. Subsequent pages must reuse them; if a new requirement cannot be met by composition, ask: "should this become a global pattern?" If not `Yes`, keep it as lightweight domain-specific composition. Do not silently mutate frozen patterns.

Source: `frontend-new/` preset `b7WQfDSML` (base-sera/taupe/remixicon), `src/styles.css` + `components.json`.

---

## Layout Pattern

```tsx
<AppShell> // user/admin/public/auth variants
  <PageContainer> // mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8 lg:px-8
    <PageHeader titleKey="..." descriptionKey="..." action={<Button>Primary</Button>} />
    <PageSection titleKey="..." action={...}> ... </PageSection>
    // gap-6 between sections, gap-4 between cards, gap-2 for controls
  </PageContainer>
</AppShell>
```

- `AppShell` owns sidebar + header + document title (via `routeMeta` + `useDocumentTitle`).
- `PageContainer` is the ONLY place that defines page max-width/padding — never per-page `max-w-[...]` or `p-[...]`.
- `PageHeader` layout: Title (`text-2xl font-semibold`) + Description (`text-sm text-muted-foreground`) left, Actions right (wrap on mobile, `gap-2`).
- Mobile: sidebar hidden, `Sheet` trigger with `RiMenuLine 18px`, header `h-14 border-b bg-background sticky`.

## CRUD Page Pattern

```tsx
<PageHeader />
<Toolbar> // Search | Filters | Clear | Spacer | Refresh | Primary Action
  <Input value={search} onChange={setSearch} />
  <Button variant="ghost" onClick={clear}>Reset</Button>
  <Button variant="outline" onClick={refetch}>Refresh</Button>
  <Button onClick={openCreate}>Create</Button>
</Toolbar>
<DataTable data={rows} loading={isLoading} error={errorMsg} onRetry={refetch} getRowId={r=>r.id} />
<DataTablePagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
<Dialog><ApiKeyForm /></Dialog>
<DeleteConfirmDialog />
```

- Query: `useQuery({ queryKey: queryKeys.keys.list({page,search}), queryFn: ({signal})=>listKeys(...,{signal}) })` — always forward `AbortSignal` to `apiClient`.
- Search: `useDebouncedValue(search,300)` (250–400ms), `page→1` on debounced change via `useEffect`.
- Pagination: `pageSize 10`, total from backend, page correction on delete (if last item on last page removed, `setPage(pages)`).
- Mutations: `submit → button loading (aria-busy, disabled) → success close dialog + invalidate + toast → failure keep dialog open + inline error`.

## Form Pattern

```tsx
const schema = z.object({ name: z.string().min(1, t("common.name")+" required") })
const form = useForm({ resolver: zodResolver(schema) })
<form onSubmit={form.handleSubmit(onSubmit)} noValidate>
  <Label htmlFor="field">Name</Label>
  <Input id="field" {...form.register("name")} aria-invalid={!!errors.name} />
  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
  {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
  <DialogFooter><Button variant="outline">Cancel</Button><Button type="submit" disabled={isPending}>Confirm</Button></DialogFooter>
</form>
```

- Stack: `React Hook Form + Zod + zodResolver + shadcn Input/Label` — never custom validation outside Zod.
- Backend 422: map `AppError.metadata` fields to `form.setError`.
- Actions: `Cancel | Primary` desktop, `disabled` while `isPending`, spinner `h-4 w-4 animate-spin rounded-full border-2` inside button (no layout shift).

## Async Pattern

```
idle -> loading (button spinner, Skeleton for page) -> success (toast + invalidate) -> error (inline or ErrorState)
```

- Button: `idle` (enabled), `loading` (`disabled aria-busy` + spinner), `disabled`.
- Page: `isLoading → <LoadingState />` (Skeleton h-8 + h-24*2), `error → <ErrorState message onRetry>`, `empty → <EmptyState>`, `populated → <DataTable>`.
- Never `catch(()=>{items:[]})` — error must surface as `ErrorState`, not `Empty`.

## Feedback Pattern

- **Field error**: inline `text-sm text-destructive` under input, `aria-invalid` + `aria-describedby`.
- **Operation**: `toast.success("Saved") / toast.error(message)` — short, via `lib/toast` (Sonner-ready), never for field validation.
- **Page error**: `<ErrorState message={getAppErrorMessage(err)} onRetry={refetch} />` — card with `border-destructive/50` + Retry button.
- **Copy**: `<CopyButton value={key} />` → `navigator.clipboard` success → "Copied" 1.5s, failure → "Failed to copy".

## Destructive Pattern

```tsx
<DeleteConfirmDialog
  open={!!deleteId}
  title="Delete API key"
  description={`Delete "${row.name}" (ID ${row.id})? This cannot be undone.`}
  onConfirm={()=>delMut.mutate(id)}
  loading={delMut.isPending}
/>
```

- Uses `AlertDialog` (not `window.confirm`/`alert`): Title + Description (object identity + consequence + irreversibility) + `Cancel` + `Destructive Action` (`variant="destructive"`).
- Loading: `disabled` + `processing` label, no double submit.
- Failure: dialog stays open, error via toast or inline.

## Search / Filter Pattern

- `useDebouncedValue(value, 300)` hook, `setPage(1)` on debounced change.
- `apiClient.get(..., { signal })` + TanStack Query cancellation — old request never overwrites new.
- Toolbar order frozen: `Search (max-w-sm) | Clear Filters (ghost) | Spacer (ml-auto) | Refresh (outline) | Primary (default)`. Mobile `flex-wrap gap-2`.

## Responsive Pattern

- Breakpoints tested: `390×844, 768×1024, 1024×768, 1440×900`.
- Tables: `overflow-x-auto` wrapper + `DataTable` with `rounded-md border`, never squeeze — horizontal scroll preferred; mobile card only if unified pattern.
- Alignment freeze: `text left, email left, identifier left, status left, date left, number right, money right, actions right` (via `align` prop on `DataTableColumn`).
- Touch target: icon `16px` but button `h-9` hit area (≥44px container).

## Theme Pattern

- `light | dark | system` via `ThemeProvider` (`src/lib/theme.tsx`) — `localStorage "sub2api_theme"` + `matchMedia("(prefers-color-scheme: dark)")`, `document.documentElement.classList` + `colorScheme`.
- Toggle: header `Button size="icon"` with `RiSunLine`/`RiMoonLine 18px`, `aria-label`.
- No hydration flash: `applyTheme` on mount + `system` listener; SSR safe (`typeof window` guard).
- Never `bg-white`, `text-black`, `bg-gray-*`, hex — always semantic `bg-background`, `text-muted-foreground`, `border`, `primary`, etc.

## i18n Pattern

- `I18nProvider` (`src/i18n`) with `localStorage "sub2api_locale"` + `navigator.language` fallback, `document.documentElement.lang` sync.
- All user-visible strings via `t("common.*")` — never hardcode `Clear filters` etc. in 4 representative pages.
- Zod messages via `t` inside component (`useMemo` schema), not hardcoded `"Invalid email"`.
- `<html lang>` follows `locale` (effect in `I18nProvider`), not fixed `en`.

---

## Frozen Components

- `AppShell`, `PageContainer`, `PageHeader`, `PageSection`
- `DataTable` (+ `DataTablePagination`) — `align` rule frozen, `getRowId` supported, no `any` in callers (debt noted)
- `EmptyState`, `ErrorState`, `LoadingState`
- `StatusBadge` — `success/warning/error/info/default` → `Badge variant` mapping centralized
- `ConfirmDialog` / `DeleteConfirmDialog`
- `CopyButton`
- `Input`, `Label`, `Button`, `Dialog`, `Select`, `Checkbox`, `Switch`, `Badge`, `Card`, `Table`, `Skeleton`, `Tabs`

## Frozen UX Decisions

- Button hierarchy: one Primary per region, Secondary for cancel, Ghost for row, Destructive only for delete.
- Icon: `remixicon` only, `16px` regular, `20px` prominent, never emoji `☰`/`●`.
- Devtools: `TanStackDevtools` only in `import.meta.env.DEV`.

## Subsequent Pages

New pages must: choose existing pattern + connect `lib/api/<feature>.ts` + compose existing components + verify at 390px/desktop + light/dark. Do not invent new primitives before checking `shadcn/ui`.

## API Contract Source

Backend is SoT (`http://localhost:18786`). For each page, maintain `UI Action → lib/api fn → HTTP method/path → backend handler → response DTO` table (see `docs/frontend-pattern-audit.md`).
