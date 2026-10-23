---
name: Bootstrap Next.js + Supabase Stack
description: Bootstraps a generic Next.js 14+ app with Supabase and Vercel, enforcing best-practice architecture patterns (Server Actions for business logic, 1:1 schema mapping).
---

# Bootstrapping the Full-Stack Application

When asked to execute this skill for a new project, follow these exact steps:

## Step 1: Initialize the Base Framework
Use `run_command` in a background task to initialize the Next.js application in the requested directory:
```bash
npx create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```
*(Only execute this in the empty workspace where the user specifically requested the new project to be built).*

## Step 2: Install State and Data Layers
Install Supabase for integrated database and authentication flow:
```bash
npm install @supabase/supabase-js @supabase/ssr
```

## Step 3: Local Environment Setup
Instruct the user to link their Vercel environment so you can automatically pull environment variables:
```bash
vercel link
vercel env pull .env.local
```
Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` will be securely available in the Vercel project settings and the `.env.local` file.

## Step 4: Local Database & Migration Workflow
To ensure a true structural separation between development and production, scaffold a local-first Supabase environment before pushing any schema changes to the cloud/Vercel:
1. Initialize the local Supabase environment:
```bash
npx supabase init
```
2. Start the local Supabase stack (requires Docker):
```bash
npx supabase start
```
3. Use the **local Studio URL** provided by the CLI output to design schemas visually or write SQL locally.
4. When schema changes are ready for production, generate a migration diff:
```bash
npx supabase db diff -f your_migration_name
```
5. Deploy database migrations to the remote cloud database ONLY after testing locally:
```bash
npx supabase db push
```

## Step 5: Core Architectural Patterns to Enforce
When scaffolding out components, APIs, and databases for the user, you MUST apply these generic engineering patterns:

### 1. External Data Normalization (PostgreSQL / Supabase Schema)
- **Always use `snake_case` in DB schemas** when storing third-party API payloads.
- **Why?** Mapping `camelCase` in JavaScript/TypeScript directly to `snake_case` in the DB frequently leads to silent mapping failures if the property names unexpectedly diverge. Maintain 1:1 parity between upstream JSON shapes and your Supabase column names wherever possible to eliminate serialization bugs.

### 2. Complex Business Logic via Server Actions
- Do not attempt to process highly complex multi-trait filtering or core business logic purely through deeply nested SQL joins or complex Supabase RPCs.
- **Pattern**: For heavy processing or AI integration logic, use a **Next.js Server Action**. Query a broad, normalized base set of JSON data from Supabase, and implement the complex filtering/sorting via an **in-memory TypeScript pipeline** layer directly on the server before transmitting it to the client. This keeps database operations extremely fast and highly testable.

### 3. Responsive Media Assets
- When scaffolding UI components dealing with user-uploaded or external vertical images/videos, ensure CSS properties like `object-contain` are applied to prevent aggressive visual cropping and maintain the original content's aspect ratio without breaking standard web layouts.

## Step 6: Essential UI & Validation Ecosystem
To make the bootstrapping truly production-ready for *any* generic purpose, automatically scaffold these ecosystem standards alongside Next.js and Supabase:
1. **Validation Pipeline (`zod`)**: `npm install zod`
   - **Why?** Zod guarantees absolute type safety via schemas. Strictly validate *all* incoming user parameters or payload data in your Next.js Server Actions *before* it ever touches Supabase APIs.
2. **Form Management (`react-hook-form` + `@hookform/resolvers`)**: `npm install react-hook-form @hookform/resolvers`
   - **Why?** It perfectly handles complex client-side application forms, avoids deeply unnecessary React re-renders, and plugs directly into your Zod server schema for instant client-feedback.
3. **UI Foundations (`shadcn/ui`)**: `npx shadcn@latest init` and `npm install lucide-react clsx tailwind-merge`
   - **Why?** Shadcn relies on generic Radix primitives, enabling you to scaffold fully accessible, highly-customizable components (modals, dropdowns) without fighting a strict UI library override system. It meshes beautifully with Tailwind.

## Step 7: Core Authentication Routing (Supabase Auth)
Supabase Authentication is the strict standard for login/identity in this stack because of its heavy integration with Row Level Security (RLS) in the database. When bootstrapping, immediately scaffold the baseline Authentication routes:
- `/app/login/page.tsx`
- `/app/auth/callback/route.ts` (Mandatory for resolving Supabase OAuth providers like Google or Magic Link redirects).
- A reusable layout component acting as an Auth Guard that efficiently checks `await supabase.auth.getUser()` to protect internal application routes at the Server Component level before rendering sensitive data.

## Step 8: External API Integration Readiness
Applications built on this stack frequently interact with external APIs (like Google Calendar, Stripe, or custom enterprise backends). Scaffold API preparation rules as follows:
1. **Never Expose Keys**: Store external API credentials strictly in `.env.local` without the `NEXT_PUBLIC_` prefix unless explicitly required by a client-side SDK.
2. **Server-Side Fetching**: Isolate external API calls exclusively within Server Components or Server Actions using standard `fetch()` or official SDKs (e.g. `googleapis`). This eliminates CORS issues and entirely protects secret keys.
3. **Response Validation**: Treat external responses with the same skepticism as database payloads. Validate upstream JSON objects with `zod` upon receipt to ensure external changes do not cause runtime crashes in your UI components.
