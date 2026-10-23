---
name: Supabase Authentication & RLS Policies
description: Setup and conventions for securing database tables with Row Level Security (RLS) policies and implementing Auth Guards in Next.js Server Components.
---

# Supabase Auth & RLS Guarding

Use this skill when creating new database tables, writing database access policies, or protecting pages and folders using user authentication.

## 1. Row Level Security (RLS) policies

Always enable RLS on every user-facing table. Never leave a table unprotected unless it's a read-only public reference.

### A. SQL Table Protection Template
```sql
-- 1. Enable RLS
alter table public.user_profiles enable row level security;

-- 2. CREATE policy: Allow users to view their own profile
create policy "Users can view own profile" 
on public.user_profiles 
for select 
to authenticated 
using ( (select auth.uid()) = id );

-- 3. UPDATE policy: Allow users to update their own profile
create policy "Users can update own profile" 
on public.user_profiles 
for update 
to authenticated 
using ( (select auth.uid()) = id )
with check ( (select auth.uid()) = id );
```

### B. Helpful policy Rules:
- `auth.uid()` retrieves the authenticated user's UUID.
- `to authenticated` restricts the policy scope exclusively to users containing a valid Supabase JWT.
- Use `using()` to filter rows readable/modifiable.
- Use `with check()` to validate new or updated records before write.

---

## 2. Next.js Layout/Page Auth Guards

Protect route folders at the Server Component layout level before fetching any sensitive user data.

### Secure Auth Guard Component Example (`src/app/dashboard/layout.tsx`):
```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface DashboardLayoutProps {
    children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
    const supabase = await createClient()

    // 1. Secure check: getUser() makes a network call to verify session token is valid
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        // Redirect to login page if unauthorized
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="border-b bg-white p-4">
                <span className="text-sm font-semibold">User: {user.email}</span>
            </header>
            <main className="p-6">{children}</main>
        </div>
    )
}
```

### Note on `getUser()` vs `getSession()`:
- **`supabase.auth.getUser()`**: Safely calls the Supabase auth API to verify the JWT against the server. Always use this in Server Components and Server Actions to protect data.
- **`supabase.auth.getSession()`**: Fast but unsafe, as it only checks the cookie payload locally without validation. Only use this for quick UI layout decisions (e.g. client side menu toggles).
