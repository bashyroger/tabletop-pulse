# `supabase/` — PostgreSQL & RLS Architecture Rules

1. **Schema Isolation**:
   - All TabletopPulse tables live in `boardgames.*`.
   - Never create, alter, or drop tables in `public.*` (which belongs to `macnasmanager`).
2. **Two-Tier RPC Pattern**:
   - Internal `SECURITY DEFINER` implementations live in `boardgames_private.*` with `SET search_path = ''`.
   - Public RPCs in `public.bg_*_v2` are `SECURITY INVOKER` with `SET search_path = ''`.
3. **RLS InitPlan Subqueries**:
   - Always wrap `auth.uid()` and helper calls in `(SELECT ...)` inside `USING` and `WITH CHECK` clauses so PostgreSQL caches the result per statement.
4. **Covering Foreign Key Indexes**:
   - Every `REFERENCES` column in `boardgames.*` must have a covering B-Tree index.
