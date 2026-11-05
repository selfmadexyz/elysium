---
applyTo: "packages/web/**"
paths:
  - "packages/web/**"
---

# React and SSR

- Server data belongs in TanStack Query hooks, not duplicated component state or ad hoc effect fetches. Query keys include every input that changes the response; keep invalidation aligned with the owning hook's key.
- Preserve TanStack Start file routes in `src/routes/` and the router factory in `src/router.tsx`. Do not edit generated `src/routeTree.gen.ts` by hand. Use route loaders for critical data where appropriate; show pending, empty and failure states.
- Construct router, QueryClient and session context per SSR request. Browser-only APIs must not execute on the server. Auth redirects supplement server authorization.
- Derive values during rendering instead of synchronizing redundant state with effects. Effects synchronize external systems. Stable list keys come from data.
- Reuse `src/components/ui/` Base UI patterns, `cn`, existing Hugeicons imports and TanStack Form. Keep labels, keyboard behavior and dialog focus handling intact.
- Do not introduce a new cache, state library, UI kit or dependency without a task-specific reason. React Compiler is not configured: do not remove memoization by assuming it is.
- Test visible behavior by role/label. A query/auth change needs isolation, error and invalidation coverage proportionate to its behavior. Inspect UI changes in a browser and report if unavailable.
