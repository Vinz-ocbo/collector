# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository status

**Bootstrapped + design system + auth + Collection + Search + Stats + i18n in place.** Source-of-truth documents:

- `.clinerules-dev` — engineering rules — **French**, authoritative for code decisions
- `.clinerules-design` — UX/UI rules — **French**, authoritative for UI decisions
- `SOURCES/Appli Magic Collector (specs).md` — functional MVP specs
- `docs/design/` — concrete design artifacts (arborescence, wireframes ASCII, specs fonctionnelles per écran)

What's wired:
- 15 design system components in `src/shared/ui/` (incl. CardThumbnail with 5:7 ratio + lazy loading)
- Auth (`src/features/auth/`): provider-agnostic interface + dev mock backend (Dexie)
- Onboarding (`src/features/onboarding/`): 3-slide first-launch flow with persistent completion flag
- Collection (`src/features/collection/`): Dexie-backed repository, CRUD hooks (TanStack Query), 3 view modes (list/grid/stack), filters/sort/view-mode bottom sheets, item detail + edit + delete, dev seed (20 Magic cards w/ SVG placeholders)
- Search (`src/features/search/`): provider-agnostic backend (mock searches the local Dexie cards table), debounced search input, "déjà possédée" indicator, recent searches (Dexie prefs), catalog card detail page, AddToCollectionSheet
- Stats (`src/features/stats/`): pure selectors over collection items, custom SVG charts (Donut + horizontal bars), overview KPIs + by color/type/rarity sub-pages
- i18n (`src/i18n/`): i18next + LanguageDetector (localStorage → navigator), FR default + EN, fully type-safe via module augmentation, all UI strings extracted (~250 keys) including Zod schema messages
- Top-level AppGate routes first-launch users to /onboarding
- Tab-bar pages: Collection + Search + Stats real; Scan still stub
- Bundle splitting: 6 vendor chunks via `manualChunks` — react/ui/data/i18n/forms separated from app code (initial JS ~22 KB gzip + react-vendor 67 KB cached separately). Total 222 KB gzip across 16 chunks; per-chunk budget 250 KB enforced by `npm run bundle:check`.
- CI (`.github/workflows/ci.yml`): two jobs — `verify` (typecheck + lint + format:check + tests with coverage) and `build` (build + bundle:check). Triggers on push to main + PR. Uses Node 20 + npm cache.
- 126 tests passing (~6 s).

## Project at a glance

**`tcg-collector`** — a mobile-first PWA to inventory trading card collections. MVP targets **Magic: The Gathering**; architecture must let **Pokémon** (and other TCGs) be added as a *new folder*, not a rewrite. Features: manual card entry, photo recognition (single + batch), collection management (binders, condition, foil, language, quantity), search/filter, stats, CSV/JSON import-export, offline-first.

Working language for product/UI copy and the rules docs is **French** (FR default, EN second). Code, identifiers, commit messages: English.

## Stack (imposed — see `.clinerules-dev` §2)

- **Front**: React 18+ / **TypeScript strict** / Vite / React Router v6 / Tailwind / Radix or Headless UI / React Hook Form + Zod / `vite-plugin-pwa` (Workbox)
- **Server state**: TanStack Query (single source for Scryfall data — never duplicate into Zustand)
- **Local storage**: Dexie (IndexedDB). Blobs for images, **never base64**. No `localStorage` for business data.
- **Card recognition**: TensorFlow.js / ONNX Runtime Web client-side when feasible; Tesseract.js for OCR; Scryfall lookup for canonicalization. Always show candidates with confidence — never auto-validate.
- **Backend**: Node (Fastify or NestJS) + PostgreSQL. The client never calls Scryfall directly in production — backend proxies, caches bulk data weekly, enforces rate limit (~10 req/s, identifiable User-Agent `TCGCollector/x.y.z`).
- **Auth**: managed (Auth0 / Clerk / Supabase). No homemade auth.
- **Tests**: Vitest + Testing Library (unit/component), Playwright (E2E mobile viewport), MSW for network mocks, axe-core for a11y. Unit suite must run under 30 s.

## Architecture rules (load-bearing)

```
src/
  app/        bootstrap, providers, routes
  features/   one folder per feature; export only via index.ts
  shared/     ui · lib · api · db · domain (TCG-agnostic types)
  tcg/        magic/ · pokemon/ (placeholder) · index.ts (registry)
```

Dependency rule: `features` → `shared`; `shared` depends on nothing applicative; `tcg/*` depends only on `shared/domain`. Enforce with `eslint-plugin-boundaries` or equivalent.

**TCG-agnostic core.** Each TCG provides a `TcgProvider` adapter (`searchCards`, `getCardById`, `recognizeFromImage`, `getSets`, …). Magic-specific concepts (WUBRG, mana cost) stay in `tcg/magic` — never leak into `shared/domain` or generic UI. **Any literal `"magic"` / `"mtg"` string in a generic component is a design break.** A `game` column/parameter exists from the first DB migration and the first API endpoint.

UI components orchestrate; hooks/services compute. **No business logic in components or `useEffect`.** Server state lives in TanStack Query, not duplicated in Zustand.

## Non-negotiables (`.clinerules-dev` §14, `.clinerules-design` §15)

1. Mobile-first at 360 px, dark mode shipped with MVP.
2. WCAG 2.2 AA — keyboard path always exists alongside camera; alt/aria on every interactive element.
3. HTTPS + strict CSP (explicit `img.scryfall.com`, no `unsafe-inline`/`unsafe-eval`).
4. No secrets client-side. Tokens never in `localStorage`.
5. Respect Scryfall ToS: no image alteration, copyright/artist preserved, rate-limited proxy, identifiable User-Agent.
6. Performance budgets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, initial JS ≤ 200 KB gzip, Lighthouse Perf ≥ 90. CI blocks PRs over budget.
7. Card image ratio ~5:7 — never stretch, never filter, never watermark.

## Conventions

- Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`, `perf:`, `a11y:`, `security:`).
- No unjustified `any` (require `// eslint-disable-next-line ... -- reason`).
- No bare `TODO` — must reference an issue: `// TODO(#123): ...`.
- i18next from day one; no hard-coded strings. FR default.
- Dexie schema changes = new version + tested migration.
- Every bug fix lands with a regression test that would have failed before.

## Commands

| Goal | Command |
|---|---|
| Dev server (port 5173) | `npm run dev` |
| Production build | `npm run build` |
| Preview prod build | `npm run preview` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` (zero warnings) |
| Lint with autofix | `npm run lint:fix` |
| Format | `npm run format` (check: `npm run format:check`) |
| Unit tests (Vitest) | `npm run test` (watch: `npm run test:watch`) |
| Single test file | `npm run test -- src/shared/lib/cn.test.ts` |
| Coverage report | `npm run test:coverage` |
| E2E (Playwright) | `npm run test:e2e` (UI: `npm run test:e2e:ui`) |
| Pre-commit gate | `npm run verify` (typecheck + lint + tests) |
| Format check | `npm run format:check` |
| Bundle size check (post-build) | `npm run bundle:check` |

Playwright browsers must be installed once: `npx playwright install`.

## File layout (current)

```
src/
  app/        App.tsx · providers.tsx · router.tsx · Layout.tsx · index.css
  features/   collection/ · search/ · scan/ · stats/ · profile/ (each: index.ts + Page.tsx stub)
  shared/
    domain/   Card, CollectionItem, Binder — TCG-agnostic types
    db/       Dexie v3: items, binders, prefs, cards (+ getPreference/setPreference)
    api/      fetch wrapper + ApiError
    lib/      cn() helper (clsx + tailwind-merge) — has tests
    ui/       design system: Button, Input, Switch, Stepper, Badge, Chip,
              Skeleton, Card, CardThumbnail, EmptyState, Toast (+ useToast +
              Toaster), BottomSheet (Vaul), AlertDialog (Radix), FAB, PageHeader
  features/
    auth/         AuthBackend interface + mockBackend (Dexie) + hooks +
                  RequireAuth + AuthLayout + Login/Signup/Forgot pages
    onboarding/   3-slide flow + useOnboardingStatus / useCompleteOnboarding
    collection/   repository (CRUD, filters, sort, getOwnedCountByCardId) +
                  hooks (useOwnedCounts) + seed (20 Magic cards w/ SVG
                  placeholders) + Collection/Item pages + Filters/Sort/
                  ViewMode bottom sheets
    search/       SearchBackend interface + mock (queries local cards table) +
                  hooks (debounced useSearchCards, useCatalogCard, recent
                  searches) + SearchPage + CatalogCardDetailPage +
                  AddToCollectionSheet
    stats/        pure selectors (computeOverview/ByColor/ByType/ByRarity) +
                  hooks (memoized over useCollectionItems) + custom SVG
                  charts (DonutChart, BarChartHorizontal) + StatsPage +
                  ByColor/ByType/ByRarityPage
  tcg/
    index.ts  TcgProvider interface + provider registry
    magic/    MagicMeta + magicProvider stub
  test/       Vitest setup · MSW handlers/server
e2e/          Playwright smoke + axe-core a11y
```

## Architecture rules (enforced by ESLint)

`eslint-plugin-boundaries` enforces the dependency rule from `.clinerules-dev` §3:

| from | can import | cannot import |
|---|---|---|
| `app` | features, shared, tcg | — |
| `features` | shared, tcg | other features in deep paths (only via barrel `index.ts`) |
| `shared` | shared | features, app, tcg |
| `tcg` | shared | features, app, other tcg |

Deep imports into a feature (`@/features/collection/CollectionPage` from outside) are blocked by `no-restricted-imports`. Always import via `@/features/<name>` barrel.

## Conventions baked into the toolchain

- TypeScript: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` (use `import type` for types). For optional props that may receive explicit `undefined` (common in test setups), type as `T | undefined`.
- ESLint: type-aware rules on (`recommended-type-checked`), max-warnings = 0. `react-refresh/only-export-components` disabled in `src/shared/ui/` because the design system co-locates variant helpers (CVA) and hooks with components.
- Prettier: 100-char width, single quotes, trailing commas. Tailwind class sorting via plugin.
- Path alias: `@/*` → `src/*` (configured in `tsconfig.app.json` AND `vite.config.ts` AND `vitest.config.ts`).
- Tailwind: design tokens via CSS variables in `src/app/index.css` (surface, fg, accent, semantic, border), `media`-based dark mode, tap target spacing class `min-h-tap` (44 px).
- PWA: manifest + service worker auto-update + Scryfall image cache (stale-while-revalidate).

## Design system — usage rules

- Variants via `class-variance-authority` (`cva`). Each component exports its `xxxVariants` so consumers can compose.
- Headless primitives: Radix UI (Switch, Toast, AlertDialog, Slot) + Vaul (BottomSheet drag/snap).
- Toast: wrap your app in `<Toaster>` (already done in `src/app/providers.tsx`), then `const { show } = useToast(); show({ title, tone, action })`.
- BottomSheet: requires a `title` (visible) and ideally a `description`. If no description is passed, the title is repeated as `sr-only` to silence Radix a11y warnings.
- AlertDialog: reserved for **irreversible actions only** (per `.clinerules-design` §6). Reversible actions use a Toast with an Undo action.
- Tests: components use jsdom polyfills set up in `src/test/setup.ts` (matchMedia, ResizeObserver, hasPointerCapture, scrollIntoView). Vaul drag interactions are NOT exercised in unit tests (jsdom can't supply CSS transforms reliably) — covered by Vaul's own suite + Playwright e2e.

## Auth — provider-agnostic pattern

`.clinerules-dev` mandates a managed auth provider (Auth0 / Clerk / Supabase) but the choice is deferred. The architecture is built around a small `AuthBackend` interface (`src/features/auth/types.ts`) so the UI doesn't know which provider sits behind it.

- **Interface**: `getSession`, `signInWithPassword`, `signUpWithPassword`, `signOut`, `requestPasswordReset`. Errors thrown as `AuthError` with a stable `code` (`invalid_credentials`, `email_exists`, …).
- **Dev backend**: `createMockAuthBackend()` in `src/features/auth/mockBackend.ts`. Backed by IndexedDB (separate Dexie DB) + sessionStorage. Hashes passwords with SHA-256 (mock-grade — NOT production). Persists across reloads.
- **Hooks** (in `src/features/auth/hooks.ts`): `useSession` (TanStack Query, `staleTime: Infinity`), `useSignIn`, `useSignUp`, `useSignOut`, `useRequestPasswordReset`.
- **Wiring**: `<AuthBackendProvider>` is mounted inside `<Providers>` (defaults to mock). To swap, pass a `backend` prop to the provider.
- **Tests**: use `renderWithProviders` and `makeFakeBackend` from `src/test/auth-test-utils.tsx`.

When a real provider is chosen, write `createXxxAuthBackend()` that returns an `AuthBackend`, and pass it to `<AuthBackendProvider>` in `src/app/providers.tsx`. The UI does not change.

## Collection feature — patterns

The Collection feature is the reference implementation for "data-backed pages" — follow it when building Search, Stats, etc.

- **Data layer** in `src/features/collection/repository.ts`: pure async functions over Dexie (`listItems`, `getItem`, `addItem`, `updateItem`, `deleteItem`, `upsertCards`, `getSummary`, `seedDemoData`, `listBinders`, `createBinder`). No React, no hooks.
- **Hooks layer** in `src/features/collection/hooks.ts`: TanStack Query wrappers (`useCollectionItems(filter, sort)`, `useCollectionItem(id)`, `useUpdateItem`, `useDeleteItem`, `useSeedDemoData`, …). All mutations call `invalidateQueries({ queryKey: ['collection'] })` on success.
- **`Card` storage**: `cards` table holds the card metadata referenced by `CollectionItem.cardId`. The seed pre-loads 20 Magic cards with SVG placeholder images. Real Scryfall integration replaces `seedDemoData` later.
- **Filters / sort / view mode**: held in component state on `CollectionPage`. Bottom sheets edit a draft and apply on close (per design spec). Persisting these to user preferences (Dexie `prefs`) is a follow-up.
- **Virtualization deferred**: design rule kicks in at 100+ items; current seed is 20 so plain CSS grid is used. Wire `@tanstack/react-virtual` when real data arrives.
- **Tests**: repository tests use `fake-indexeddb/auto` and reset via `await db.delete(); await db.open()` in `beforeEach` (the singleton must be re-opened, not bypassed via raw `indexedDB.deleteDatabase`).
- **Dev seeding**: empty Collection page exposes a "Charger un jeu de démo" button calling `useSeedDemoData()`. Idempotent — running twice doesn't create duplicates.

## Search feature — provider-agnostic catalogue

Same pattern as Auth: a small `SearchBackend` interface (`src/features/search/types.ts`) with a dev mock (`mockBackend.ts`) that searches the local Dexie `cards` table. When the backend Scryfall proxy lands, write `createScryfallSearchBackend()` and pass it to `<SearchBackendProvider>` in `providers.tsx`. The UI does not change.

- **Interface**: `searchCards(input)`, `getCardById(id)`. Result includes `total` (for "X résultats") and `nextCursor` for pagination (mock returns single page).
- **Mock scoring**: exact name > prefix > includes > type-line match > oracle text > set code (`mockBackend.ts:score`). Sortable by relevance / name / price.
- **`hideOwned` filter**: mock joins with the local items table to skip cards already in the collection.
- **Hooks** (`hooks.ts`): `useSearchCards(input, { debounceMs?: 250, minLength?: 2 })`, `useCatalogCard(id)`, `useRecentSearches`, `usePushRecentSearch`, `useClearRecentSearches`.
- **Recent searches** persisted in Dexie `prefs` under key `search.recent` (max 10, dedup case-insensitive).
- **"Déjà possédée"** indicator: `useOwnedCounts()` from collection returns `Map<cardId, totalQty>` for fast O(1) lookup in result rows.
- **Add to collection** from a catalog card → `<AddToCollectionSheet>` → `useAddItem()` from collection. Mutation invalidates the collection cache, which cascades to `useOwnedCounts` so the indicator updates.

## Stats feature — pure selectors + custom SVG charts

- **Selectors** (`src/features/stats/selectors.ts`): pure functions taking `CollectionItemWithCard[]` → derived stats. No I/O, no React, no Dexie. Trivially testable. Exported types include color/rarity palette mappings used by the chart components.
- **Hooks** (`hooks.ts`): each hook calls `useCollectionItems({}, 'addedAt-desc')` and applies the selector inside `useMemo`. Hooks return `{ data, isPending, isError }` shaped like a query.
- **Charts** (`src/features/stats/charts/`): hand-rolled SVG components — `DonutChart` (`stroke-dasharray` arcs around a single circle) and `BarChartHorizontal` (CSS bars). Avoids ~30+ KB of chart-library deps. Each chart provides accessible labels (`role="img"`, `<title>` tooltips, `aria-label` on bar buttons).
- **Computed dimensions**: by color (W/U/B/R/G/C + multi-color "M"), by primary type (Creature/Instant/Sorcery/...), by rarity (mythic/rare/uncommon/common). The colors and labels are stable so the same palette is reused across pages.
- **No backend dependency**: stats are 100% client-side from existing collection items. Sub-pages tap → eventually deeplink to a filtered Collection (currently the link is built but the Collection page does not yet read filter from URL search params — TODO).
- **Deferred**: complétion par set (#45 — needs total cards per set from Scryfall) and value-history line chart (#46 — needs daily snapshots).

## i18n — strings & type-safe translation

- **Init** in `src/i18n/index.ts`. Imported once from `src/main.tsx` (and `src/test/setup.ts` with a forced `changeLanguage('fr')` because jsdom defaults `navigator.language` to en-US).
- **Locales** in `src/i18n/locales/{fr,en}.json` — single namespace (`translation`), nested keys organized by feature (`common`, `tabs`, `auth.*`, `onboarding.*`, `collection.*`, `search.*`, `stats.*`, `profile.*`, `notFound`, `appGate`).
- **Type safety** via `src/i18n/types.d.ts` (module augmentation): `t('foo.bar')` autocompletes and TS errors on missing/typo'd keys. The strict typing comes from declaring `resources: { translation: typeof fr }`. Keys must exist in `fr.json` to be valid.
- **Dynamic keys** (e.g. Zod error messages stored as i18n keys) bypass the strict typing via `tDynamic(t, key)` from `@/shared/lib`. Use it sparingly — only for runtime-built keys.
- **Rich text in translations** (links, `<strong>`) — use `<Trans i18nKey="..." values={{...}} components={{ strong: <strong /> }} />` from `react-i18next`.
- **Pluralization** — i18next reads keys ending in `_one` / `_other` (English) or just plain key (French). Pass `count: N` and i18next picks the right form. Example: `t('search.results', { count: 5 })`.
- **Locale-aware formatters** — `Intl.NumberFormat(i18n.language, ...)` and `Intl.DateTimeFormat(i18n.language, ...)`. Prefer over hardcoded `'fr-FR'`.
- **Adding a key**: edit both `fr.json` and `en.json` (TS will fail typecheck if `en.json` adds keys not in `fr.json` since the augmentation derives from `fr.json`; the inverse case won't error but produces fallback FR text in EN — keep both in sync).
- **Adding a language**: add `<lang>.json`, register in `i18n/index.ts` `resources` and `supportedLngs`. The augmentation stays based on `fr.json` (the canonical key set).
- **Schemas** (`src/features/auth/schemas.ts`) store i18n keys as Zod messages, e.g. `z.string().email('auth.schemas.emailInvalid')`. The form components run them through `tDynamic(t, errors.x.message)` for display.

## Bundle splitting & size budget

`vite.config.ts`'s `build.rollupOptions.output.manualChunks` splits `node_modules` into named vendor chunks:

| Chunk | Contains | Why |
|---|---|---|
| `react-vendor` | `react`, `react-dom`, `react-router-dom` | Stable, rarely changes — long-term cache |
| `ui-vendor` | `@radix-ui/*`, `vaul`, `lucide-react` | All UI primitives + icons grouped |
| `data-vendor` | `@tanstack/react-query`, `dexie` | State + storage |
| `i18n-vendor` | `i18next`, `react-i18next`, language detector | Translation runtime + (currently bundled) locales |
| `form-vendor` | `react-hook-form`, `@hookform/resolvers`, `zod` | Form + validation |
| `index-*` (per feature) | App code, lazy-loaded per route | One chunk per `lazy(() => import(...))` boundary |

`scripts/check-bundle-size.mjs` (`npm run bundle:check`) enforces a **per-chunk gzipped budget of 250 KB** and exits 1 if any chunk exceeds. The total (currently ~222 KB gzip) is reported but not strictly capped — what matters is that no single chunk balloons.

To re-tune: edit `BUDGET_KB` in the script, or refine the chunking rules in `vite.config.ts`. If a vendor legitimately grows past budget (eg. ML libs for the scan feature), split it further (one chunk per heavy module).

## CI

`.github/workflows/ci.yml` runs on push to `main` and on every PR.

- **`verify` job** — Node 20, `npm ci`, then `typecheck` + `lint` + `format:check` + `test --coverage`. Uploads coverage as artifact.
- **`build` job** — depends on `verify`. Runs `build` + `bundle:check`. Uploads `dist/` as artifact.
- **Concurrency**: in-progress runs on the same branch are cancelled when a new push lands.

Locally, `npm run verify` covers everything except the format check and bundle check; `npm run format:check && npm run build && npm run bundle:check` rounds it out before pushing.

E2E (`npm run test:e2e`, Playwright) is intentionally **not** in CI yet — needs `npx playwright install` step + a few minutes per browser. Add when the suite has more than the smoke test.

## Routing & gates

`createBrowserRouter` with two layers of gates:

1. **`AppGate`** (top-level, `src/app/AppGate.tsx`): if onboarding flag isn't set in IndexedDB, redirect to `/onboarding`. Once set, redirect away from `/onboarding`.
2. **`RequireAuth`** (per-route, `src/features/auth/RequireAuth.tsx`): if no session, redirect to `/auth/login?redirect=<original>`.

Public routes (`/auth/*`, `/onboarding`) sit under AppGate but outside RequireAuth, so users can reach them without a session. Protected routes (`/`, `/search`, `/scan`, `/stats`, `/profile`) are wrapped by `<RequireAuth>` inside `<Layout>`.

## Pre-commit gate to run before pushing

`npm run verify` (typecheck + lint + tests). Build sanity-check: `npm run build`. E2E (Playwright) is `npm run test:e2e` (browsers must be installed once via `npx playwright install`).

## TCG-agnostic core

Each TCG provides a `TcgProvider` adapter at `src/tcg/<game>/index.ts` and registers it in `src/tcg/index.ts`. Game-specific metadata lives in the adapter's `Meta` type and travels via `Card<Meta>['meta']` (discriminated union). **No literal `"magic"` / `"mtg"` strings in `shared/` or `features/`** — grep for them in code review.

## Conventions

- Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`, `perf:`, `a11y:`, `security:`).
- i18next from day one; no hard-coded UI strings. FR default. (Not yet wired — to be added with the first real feature.)
- Dexie schema changes = new version + tested migration.
- Every bug fix lands with a regression test that would have failed before.

## What's NOT yet wired (intentional gaps for later)

- **Real auth provider** — pick Auth0/Clerk/Supabase, write `createXxxAuthBackend()`, swap in `providers.tsx`. The mock is dev-only.
- **OAuth buttons on Login/Signup** — currently stubs that show a "bientôt disponible" toast.
- **Real Scryfall integration** — Search currently runs against the local Dexie cards table (mock). When the backend proxy lands, swap in `createScryfallSearchBackend()` behind the same interface.
- **Search filters bottom sheet** — set/color/rarity/price filters are designed but not implemented yet. The data layer (`SearchFilter` type + mock `passesFilter`) supports them.
- **Image fullscreen overlay** — designed (#25) but not implemented; tap on the catalog card image is currently inert.
- **Other printings + rulings** — sub-routes designed (#26, #27) but not implemented.
- **Scan feature (camera + OCR)** — separate large feature.
- **Binders UI** — repository + hooks support binders (`createBinder`, `listBinders`, `binderId` on items), but no dedicated UI yet (no `/collection/binders/*` routes). Filter by binder via the bottom sheet is also TBD.
- **Stats — completion par set + value-history** — overview/color/type/rarity are wired; the by-set page is deferred (needs Scryfall set totals); the value-history line chart is P2 (needs daily snapshots).
- **Stats deeplink to Collection** — clicking a color/type/rarity row should filter the Collection page. Currently the Collection page reads filter from local state, not from URL search params. Wire this when needed.
- **Item add flow** (`/add/manual`, `/add/manual/details`, mode série) — designed but not implemented; depends on Search feature.
- **Collection extras** — virtualization at 100+ items, persistent filter/sort/view-mode preferences (Dexie `prefs`), long-press menu, pull-to-refresh.
- **i18n DONE** — all UI strings extracted (~250 keys, FR + EN). The remaining gap is a UI language switcher (currently respects `navigator.language` only); the design earmarks it for `/profile/preferences` (a stub today).
- **Backend API** (Fastify/NestJS — separate repo or workspace).
- **Sync layer** — `CollectionItem.syncStatus` is set to `'pending'` on writes but no sync queue exists yet.
- **TanStack Query Devtools**, **Sentry / global error boundary**, **Husky/lint-staged**, **Lighthouse CI**.
- **PWA icons** (placeholders in `public/icons/`).
- **TensorFlow.js / Tesseract.js** for card recognition.
- **Combobox / Select / Tooltip / Checkbox / RadioGroup** — Radix deps installed, components not yet built.
- **Bundle splitting DONE** — see "Bundle splitting & size budget" above.
