# `src/app/` — Next.js 16 App Router & UI Architecture Rules

1. **Async Dynamic Params**:
   - In Next.js 16, `params` and `searchParams` are Promises. Always `const { slug } = await params;` in `page.tsx`.
2. **Server-First Data Fetching**:
   - Pages in `src/app/**/page.tsx` are React Server Components that call `src/lib/boardgames/queries.ts` (backed by `public.bg_*_v2` RPCs).
3. **Mutations & Optimistic UI**:
   - Mutations live in `src/app/actions/boardgames.ts`, validate inputs with Zod (`src/lib/boardgames/schemas.ts`), call `public.bg_*_v2` RPCs, and call `revalidatePath`.
   - Interactive cheers/reactions use `React.useOptimistic` + `startTransition` for zero-latency feedback.
4. **Atmospheric Minimalism & High-Craft Dark UI**:
   - Obsidian-slate canvas (`#0B0C10`), elevated card surfaces (`#13151C`), hairline borders (`border-white/[0.08]`), and `tabular-nums` on every ELO rating, score, win rate, H-index, and playtime metric.
