# Admin Groups Parity — GroupsView.vue (6843L) → React

> Source: `frontend/src/views/admin/GroupsView.vue` + `frontend/src/views/admin/apiKeyGroupFilterOptions.ts` + 7× `groups*.ts`
> Generated: 2026-08-26 | Status: inventory before React migration

## Overview

`GroupsView.vue` is the largest admin CRUD (~6850 lines, ~2× `SettingsView` complexity per domain). It manages **API Key Groups** — pricing, routing, model scopes, profit control, and dispatch policy.

Current React stub `routes/admin/groups.tsx` has only a 4-col table + localStorage guard — 95% gap.

## Group Domain — Backend Contract (via `api/admin/groups.ts`)

- `GET /admin/groups` (paginated, search)
- `POST /admin/groups` (create)
- `PUT /admin/groups/:id` (update)
- `DELETE /admin/groups/:id`
- Duplicate/idempotency handling via `duplicateOperationKeys` + `getStoredDuplicateOperationKey`

## Feature Map — Tabs / Sections / Dialogs

### 1. List View (table)
- Columns: ID, name, `rate_multiplier`, `profit_control_enabled`, status, `rate_limited_account_count`, actions
- Search + pagination; row actions: Edit, Duplicate, Delete
- Status badge unknown-enum safe

### 2. Create Dialog (multi-section, NOT one huge Dialog — per spec must be Page/Tabs/Sections)

**Sections (createForm):**

| Section | Field | Type | Notes |
|---------|-------|------|-------|
| Basic | `name`, `description`, `platform` | string | `platform` selects model family (OpenAI/Claude/Gemini/others) |
| Group Settings | `rate_multiplier` | number (decimal precision, no UI rounding) | multiplier vs percentage — validated per backend unit |
| Models | `supported_model_scopes`, `model_pricing[]` | array + nested editor | `PricingEntryCard` + `addGroupPricing()`; `long_context_pricing_enabled` toggles interval pricing; `web_search_price_per_call` |
| Image Pricing | `image_price_1k/2k/4k` | number | `getImagePricePlaceholder(platform, key)` — placeholder unit validation |
| Video Pricing | `video_price_480p/720p/1080p` + `video_model_prices[family][res]` | nested map | Family rows via `videoModelPriceFamilyRows()`; data-testid `create-grok-video-model-prices` etc |
| Reasoning Effort | `max_reasoning_effort`, `reasoning_effort_mappings` | number + mappings | Component `ReasoningEffort` with `id-prefix="create-group-reasoning"` |
| Messages Dispatch | `allow_messages_dispatch` | boolean toggle | Toggles batch vs single dispatch semantics |
| Profit Control | `profit_control_enabled`, `profit_min_margin_percent`, `profit_safety_buffer_percent` | toggle + 2 numbers | Conditional section (only if enabled) + hints (`enabledHint/disabledHint/minMarginHint/safetyBufferHint`) |
| Misc | `search_price_per_1k`, `audio_realtime_price_per_min`, `audio_tts_price_per_million_chars`, `audio_stt_price_per_hour` | numbers | Audio/search pricing per domain |

### 3. Edit Dialog (same structure as create, via `editForm`)
- Same sections as create but with `id-prefix="edit-group-reasoning"` and `edit-grok-video-*` testids
- Loads via `GET /admin/groups/:id` then populates `editForm.*`
- Same validation + pricing precision handling

### 4. Pricing Precision (P0 — per goal4.md §40)
- All rates/multipliers/token prices/image/video prices must preserve decimal precision (no UI `Math.round`)
- Unit confusion risk: multiplier vs percentage — backend defines; UI must not convert silently
- Null vs 0 distinction preserved

### 5. Validation & Errors
- RHF+Zod schema per section (name required, multipliers finite, image/video prices >=0)
- Backend 409 (name conflict) → field error, not generic toast
- 422 detail → `form.setError` per field
- Unknown enum (platform/status) → safe fallback chip, no crash

### 6. Guard & Flags
- Simple Mode: `/admin/groups` in `restrictedPaths` → redirect to `/admin/dashboard` (both Sidebar hidden + Router/beforeLoad enforced + unified helper; no raw `JSON.parse(localStorage)`)
- No `payment/risk` flag for groups (pure admin capability)

### 7. UX Requirements (goal4.md §39)
- Complex config uses **Page / Tabs / Sections**, not giant Dialog — simple create/edit basic info in Dialog, but pricing/profit/reasoning sections as Tabs or PageSections
- Desktop dense table (`1440×900` priority), horizontal scroll for narrow viewports, not card-per-row

## Domain Architecture (allowed per §38)
```
features/admin-groups/
  api.ts        — thin wrapper over apiClient groups endpoints
  types.ts      — Group, GroupForm, ModelPricingEntry, ProfitControl, ReasoningPolicy
  schemas.ts    — Zod schemas (create/update), pricing precision validators
  components/
    GroupForm.tsx
    ModelPricingEditor.tsx
    ProfitControlEditor.tsx
    ReasoningPolicyEditor.tsx
    ImagePricingFields.tsx
    VideoPricingFields.tsx
```

KISS: don't copy 6843L into one `GroupsPage.tsx`; reuse `components/shared/*` + domain leaf editors.

## Parity Checklist

- [ ] List + search + pagination + row actions parity
- [ ] Create form — all sections above
- [ ] Edit form — all sections above
- [ ] Model pricing `PricingEntryCard` + long-context toggle + web_search price
- [ ] Image pricing 1k/2k/4k with platform placeholder
- [ ] Video pricing 480p/720p/1080p + family map
- [ ] Reasoning effort max + mappings
- [ ] Profit control enable/minMargin/safetyBuffer conditional
- [ ] Messages dispatch toggle
- [ ] Search/audio pricing
- [ ] Decimal precision preserved (no UI rounding)
- [ ] 409/422 → field errors, unknown enum fallback
- [ ] Simple Mode guard unified + no raw localStorage
- [ ] Typed API + `queryKeys.admin.groups.*` + AbortSignal
- [ ] i18n zh/en all headers/labels/hints/tooltips
- [ ] Light/dark, 1440/390, keyboard/nav a11y, Loading/Empty/Error, ConfirmDialog for delete

## References
- Old source: `frontend/src/views/admin/GroupsView.vue` (lines 631–3242 key sections)
- Helpers: `apiKeyGroupFilterOptions.ts`, `groupsImagePricing.ts`, `groupsVideoModelPricing.ts`, `groupsModelsList*.ts`, `groupsProfitControl.ts`, `groupsReasoningEffort.ts`, `groupsSupportedModelScopes.ts`, `groupsMessagesDispatch.ts`
