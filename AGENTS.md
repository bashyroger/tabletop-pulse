# TabletopPulse — Agent & Developer Handbook

**TabletopPulse** is a multi-tenant board game statistics, ELO ranking, rivalry analysis, and social stat-card sharing platform built on the **Next.js 16 (App Router) + Supabase (PostgreSQL 17) + Hostinger Node.js** architecture pattern.

---

## 1. Non-Negotiable Architecture Rules

1. **Dedicated `boardgames` Database Schema (`macnasmanager`)**:
   - All domain tables live strictly in the `boardgames` schema (`boardgames.groups`, `boardgames.group_members`, `boardgames.user_preferences`, `boardgames.games`, `boardgames.players`, `boardgames.play_sessions`, `boardgames.play_session_results`, `boardgames.shared_stat_cards`, `boardgames.session_cheers`).
   - All `SECURITY DEFINER` helpers and RPC implementations live in `boardgames_private.*` with `SET search_path = ''`.
   - Public RPC entrypoints exposed to PostgREST (`public.bg_*_v2`) are thin `SECURITY INVOKER` wrappers calling `boardgames_private.*`.
2. **Next.js 16.2+ App Router Standards**:
   - Dynamic route `params` and `searchParams` are Promises and **MUST** be `await`ed (`const { slug } = await params`).
   - Edge/Node request interception lives in `src/proxy.ts` exporting `export async function proxy(request: NextRequest)`.
   - Standalone builds (`output: "standalone"`) with `experimental: { cpus: 4 }` and `TOKIO_WORKER_THREADS = "4"` prevent thread exhaustion on Hostinger's 64-core build container.
3. **Database-First Aggregations**:
   - Never pull raw session result rows into Node.js to calculate ELO, Win Rate, Podium Rate, or Group H-Index in JavaScript loops. Use the pushed-down `public.bg_*_v2` RPCs.
4. **Supabase Advisor Gate**:
   - Every migration must pass `get_advisors(type: "security")` and `get_advisors(type: "performance")` with **0 warnings/errors** in the `boardgames` and `boardgames_private` schemas.

---

## 2. Directory Map & Scoped Rules

- [`src/app/AGENTS.md`](file:///c:/Users/rogie/Documents/antigravity/adventurous-meitner/src/app/AGENTS.md) — Next.js 16 App Router, Server Actions, Optimistic UI, and Design System rules.
- [`supabase/AGENTS.md`](file:///c:/Users/rogie/Documents/antigravity/adventurous-meitner/supabase/AGENTS.md) — PostgreSQL `boardgames` schema, InitPlan RLS policies, and `bg_*_v2` RPC standards.
- [`scripts/AGENTS.md`](file:///c:/Users/rogie/Documents/antigravity/adventurous-meitner/scripts/AGENTS.md) — Windows PowerShell 5.1 command rules, build scripts, and Hostinger deployment rules.

---

## 3. Quality Gate Checklist

Before every commit or deployment, run:
```powershell
npm test
npm run lint
npm run deadcode
npm run build
```
