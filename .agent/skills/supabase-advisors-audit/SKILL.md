---
name: Supabase Health, Security & Performance Advisors Audit
description: Post-migration audit workflow and zero-debt enforcement standard using Supabase Health, Security, and Performance Advisors.
---

# Supabase Health, Security & Performance Advisors Audit

Use this skill whenever you write or apply database migrations, alter database tables, modify Row Level Security (RLS) policies, or inspect database performance on Supabase.

---

## 1. Zero-Debt Standard & Enforcement Gate

Any database migration or schema modification MUST pass this zero-debt gate before an agent or developer may declare the migration complete or commit changes:

| Advisor | Target Standard | Permitted Exceptions |
|---|---|---|
| **Health** | Status: `ACTIVE_HEALTHY`<br/>0 Invalid Indexes (`indisvalid = false`)<br/>0 Blocking Lock Contentions | None |
| **Security** | **0 Errors, 0 Warnings** | None |
| **Performance** | **0 Errors, 0 Warnings**<br/>**0 Unindexed Foreign Keys** (`0001_unindexed_foreign_keys`) | `unused_index` on fresh/small tables |

> [!CAUTION]
> **Strict Gate Rule**: Agents are strictly forbidden from committing migrations or closing database tasks if any Errors, Warnings, or Unindexed Foreign Keys are reported by the advisors.

---

## 2. Post-Migration Audit Checklist

Run these three audits immediately after applying any migration via the Supabase MCP tools (`project_id: "bbtpaaajbylrtfjfqxar"`):

### Step 1: Health & Database Integrity Check

1. **Verify Project Status**:
   Call MCP tool `get_project(id: "bbtpaaajbylrtfjfqxar")`.
   Ensure `status` is `"ACTIVE_HEALTHY"`.

2. **Execute Diagnostic SQL** (via `execute_sql`):
   ```sql
   -- A. Check for invalid or broken indexes (from failed concurrent index builds)
   SELECT schemaname, relname, indexrelname
   FROM pg_stat_user_indexes
   JOIN pg_index USING (indexrelid)
   WHERE indisvalid = false;

   -- B. Check for blocking lock contentions
   SELECT pid, wait_event_type, wait_event, query
   FROM pg_stat_activity
   WHERE wait_event_type = 'Lock' AND state != 'idle';

   -- C. Check connection pool utilization
   SELECT count(*) as active_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_conns
   FROM pg_stat_activity;
   ```
   **Pass Criteria**:
   - 0 rows returned for invalid indexes.
   - 0 rows returned for blocking locks.
   - Active connections well within limits (< 80% of max).

---

### Step 2: Security Advisor Audit

Call MCP tool:
```json
{
  "project_id": "bbtpaaajbylrtfjfqxar",
  "type": "security"
}
```
Tool: `get_advisors`

**Pass Criteria**:
- 0 Errors, 0 Warnings.

---

### Step 3: Performance Advisor Audit

Call MCP tool:
```json
{
  "project_id": "bbtpaaajbylrtfjfqxar",
  "type": "performance"
}
```
Tool: `get_advisors`

**Pass Criteria**:
- 0 Errors, 0 Warnings.
- 0 instances of `0001_unindexed_foreign_keys`.
- Only informational `unused_index` notices on low-row development tables are permitted.

---

## 3. Linter Rules & Canonical Remediations

When an advisor flags an issue, apply the canonical remediation pattern immediately:

### A. Security Remediations

#### Rule `0029_authenticated_security_definer_function_executable`
- **Cause**: An RLS helper function with `SECURITY DEFINER` was created in the `public` schema and is executable by the `authenticated` or `anon` role via PostgREST RPC (`/rpc/function_name`).
- **Remediation**:
  Always place internal RLS helper functions in the private schema `app_private`:
  ```sql
  CREATE SCHEMA IF NOT EXISTS app_private;
  REVOKE ALL ON SCHEMA app_private FROM public, anon, authenticated;
  GRANT USAGE ON SCHEMA app_private TO authenticated, anon;

  CREATE OR REPLACE FUNCTION app_private.has_account_access(target_account_id uuid)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
  AS $$
  BEGIN
      RETURN EXISTS (
          SELECT 1 FROM public.app_account_members
          WHERE app_account_id = target_account_id
            AND user_id = (SELECT auth.uid())
      );
  END;
  $$;
  ```

#### Rule `0008_rls_enabled_no_policy`
- **Cause**: A table has RLS enabled, but no policies exist. Supabase flags this because client queries will return empty sets without explicit intention.
- **Remediation**:
  For internal/service-role-only tables (e.g., OAuth tokens, credentials, API secrets), add an explicit deny policy:
  ```sql
  CREATE POLICY "Deny all public access to secrets"
  ON public.my_secret_table
  FOR ALL
  TO public
  USING (false);
  ```

#### Storage Object Policies
- **Cause**: Broad `SELECT` policies on `storage.objects` allow authenticated users to list files across all buckets.
- **Remediation**:
  Public buckets do not need a `SELECT` policy on `storage.objects`—files in public buckets are directly accessible via their public CDN URL (`/storage/v1/object/public/...`). Only apply storage policies to restrict `INSERT`/`UPDATE`/`DELETE` based on bucket ID and path prefix.

---

### B. Performance Remediations

#### Rule `0001_unindexed_foreign_keys`
- **Cause**: A table contains a foreign key column without a matching covering B-Tree index. This causes cascading deletes/updates to trigger full table scans and slows down joins.
- **Remediation**:
  Every foreign key column MUST have a covering index:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_<table_name>_<fk_column>
  ON <table_name>(<fk_column>);
  ```

#### Rule `0003_auth_rls_initplan`
- **Cause**: Using bare `auth.uid()` in an RLS policy causes Postgres to evaluate the function for every row tested during the query, drastically hurting performance.
- **Remediation**:
  Always wrap `auth.uid()` in a subquery `(SELECT auth.uid())`. This allows PostgreSQL to plan it as an `InitPlan` that is executed once for the entire query:
  ```sql
  -- ❌ BAD: Evaluated per row
  CREATE POLICY "User access" ON my_table FOR SELECT USING (user_id = auth.uid());

  -- ✅ GOOD: Evaluated once as InitPlan
  CREATE POLICY "User access" ON my_table FOR SELECT USING (user_id = (SELECT auth.uid()));
  ```

#### Rule `0009_duplicate_index`
- **Cause**: A standalone index was added on a column that already has a UNIQUE constraint or is the leading column of a composite index.
- **Remediation**:
  Drop redundant standalone indexes:
  ```sql
  DROP INDEX IF EXISTS idx_my_table_unique_col;
  ```

#### Clarification on `unused_index`
- **Why it occurs**: The Postgres query planner skips indexes when tables have very few rows (table scans are faster for < 100 rows).
- **Policy**: **DO NOT DROP** foreign key indexes, tenant isolation (`app_account_id`) indexes, or timestamp indexes just because `unused_index` is flagged in development. These indexes are essential for production scaling once the table grows.
