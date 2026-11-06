---
applyTo: "packages/web/**"
paths:
  - "packages/web/**"
---

# React and SSR

- Server state lives in TanStack Query only: never copied into `useState`, never fetched in `useEffect`. Hooks in `src/hooks/` own the query; export its `queryOptions` when a route loader needs it.
- Every input that changes the response is in the query key (`['posts', { page, pageSize }]`); a mutation invalidates the owning key prefix.
- Derive during render; `useEffect` only to sync with something outside React.
- Conditional rendering uses a ternary or an explicit boolean, never `count && …`.
- List keys come from data (`post.id`), never the index.
- React Compiler is not enabled: keep existing `useMemo`/`useCallback`/`memo` and add one only for a measured cost.
- `type`, not `interface` (the `Register` module augmentation in `src/router.tsx` is the exception).
- `toSorted`/`toReversed` over mutating `sort`/`reverse`.
- Any new dependency is asked first. Reuse `src/components/ui/` (Base UI), `cn`, Hugeicons and TanStack Form before adding anything.
- Routes are files in `src/routes/`; `src/routeTree.gen.ts` is generated, never edited. A new public page that should be prerendered is added to `pages` in `vite.config.ts`; a private page goes under `_authenticated`.
- Router, `QueryClient` and session context are built per request in `getRouter()`; browser-only APIs never run during SSR.
- A page that reads server data shows its loading, empty and error states.
- UI copy states the state or the action: titles ≤ 5 words, descriptions one short clause, no hedging.
- Tests use Vitest, query by role or label and assert what the user sees.
