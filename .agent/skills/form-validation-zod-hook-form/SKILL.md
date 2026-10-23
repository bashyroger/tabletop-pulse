---
name: Next.js + React 19 Form Validation (Zod + React Hook Form)
description: Guidelines and template files for setting up form validation using React Hook Form, Zod schema validation, and server action submittals.
---

# Form Validation with Zod & React Hook Form

Use this skill when designing forms, input validation pipelines, or mapping form submissions to Next.js Server Actions.

## 1. Installation
Ensure the following packages are present in your project:
```bash
npm install react-hook-form @hookform/resolvers zod
```

## 2. Core Implementation Pattern

Always use a single `zod` schema to enforce type safety on both the client (for UX feedback) and the server (for security).

### A. Define the Schema (Shared or Action-specific)
Create a clean Zod schema.
```typescript
import { z } from 'zod'

export const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
})

export type LoginInput = z.infer<typeof loginSchema>
```

### B. Hook Integration in Client Components
Configure `useForm` with the `zodResolver` in client components:
```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from './schema'
import { handleLogin } from './actions'
import { toast } from 'sonner'

export function LoginForm() {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' }
    })

    const onSubmit = async (data: LoginInput) => {
        const result = await handleLogin(data)
        if (result.success) {
            toast.success('Successfully logged in!')
            reset()
        } else {
            toast.error(result.error || 'Login failed')
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                    type="email"
                    {...register('email')}
                    className="mt-1 block w-full rounded border p-2"
                />
                {errors.email && (
                    <span className="text-sm text-red-500">{errors.email.message}</span>
                )}
            </div>

            <div>
                <label className="block text-sm font-medium">Password</label>
                <input
                    type="password"
                    {...register('password')}
                    className="mt-1 block w-full rounded border p-2"
                />
                {errors.password && (
                    <span className="text-sm text-red-500">{errors.password.message}</span>
                )}
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 p-2 text-white disabled:opacity-50"
            >
                {isSubmitting ? 'Submitting...' : 'Sign In'}
            </button>
        </form>
    )
}
```

### C. Server Action Validation (Crucial for Security)
**Never** trust the client-side validation alone. Always re-validate the input parameters inside the Server Action:
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { loginSchema, type LoginInput } from './schema'

export async function handleLogin(payload: LoginInput) {
    // 1. Validate payload with Zod
    const validated = loginSchema.safeParse(payload)
    if (!validated.success) {
        return {
            success: false,
            error: validated.error.errors.map(e => e.message).join(', ')
        }
    }

    const { email, password } = validated.data
    const supabase = await createClient()

    try {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        return { success: true }
    } catch (err: any) {
        return { success: false, error: err.message || 'Authentication failed' }
    }
}
```
