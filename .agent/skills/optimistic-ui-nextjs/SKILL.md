---
name: React 19 Optimistic UI Updates
description: Best practices and templates for implementing instant UI updates using React 19's useOptimistic hook, Server Actions, and transaction rollbacks on failure.
---

# Optimistic UI Updates in Next.js + React 19

Use this skill when developing interactive layouts requiring zero latency (e.g., liking posts, tagging leads, toggling switches, adding items to checklists).

## 1. Core Lifecycle of an Optimistic Update
1. **User Action**: Click or toggle trigger.
2. **Immediate Update**: Client UI state changes immediately before server call starts.
3. **Trigger Action**: Initiate async Server Action.
4. **Resolve/Rollback**:
   - **Success**: Server action completes, DB commits, page caches revalidate, UI remains updated.
   - **Failure**: Server action fails, catch block catches error, UI state rolls back to the original database state.

---

## 2. Implementation Template (Post Liking Example)

### A. Define the Client Component (`src/components/like-button.tsx`)
```tsx
'use client'

import { useOptimistic, startTransition } from 'react'
import { toggleLike } from '@/app/actions/likes'
import { toast } from 'sonner'
import { Heart } from 'lucide-react'

interface LikeButtonProps {
    postId: string
    initialLikes: number
    initialIsLiked: boolean
}

export function LikeButton({ postId, initialLikes, initialIsLiked }: LikeButtonProps) {
    // 1. Configure the useOptimistic hook
    const [optimisticState, setOptimisticState] = useOptimistic(
        { count: initialLikes, liked: initialIsLiked },
        (currentState, nextLikedValue: boolean) => {
            // Update counts instantly depending on action type
            const diff = nextLikedValue ? 1 : -1
            return {
                count: currentState.count + diff,
                liked: nextLikedValue
            }
        }
    )

    const handleToggle = async () => {
        const nextValue = !optimisticState.liked

        // 2. Wrap state transitions in React startTransition
        startTransition(() => {
            setOptimisticState(nextValue)
        })

        // 3. Initiate the backend Server Action
        try {
            const result = await toggleLike(postId, nextValue)
            if (!result.success) {
                throw new Error(result.error)
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to update like status')
            // React 19 automatically rolls back optimistic state to original state when layout updates.
        }
    }

    return (
        <button
            onClick={handleToggle}
            className={`flex items-center gap-2 rounded-lg border p-2 transition-colors ${
                optimisticState.liked ? 'bg-red-50 text-red-600 border-red-200' : 'hover:bg-slate-50'
            }`}
        >
            <Heart className={optimisticState.liked ? 'fill-current' : ''} size={18} />
            <span>{optimisticState.count}</span>
        </button>
    )
}
```

### B. Define the Server Action (`src/app/actions/likes.ts`)
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleLike(postId: string, nextLikedState: boolean) {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        let query
        if (nextLikedState) {
            // Add a like entry
            query = supabase.from('tiktok_post_likes').insert({ post_id: postId, user_id: user.id })
        } else {
            // Delete a like entry
            query = supabase.from('tiktok_post_likes').delete().match({ post_id: postId, user_id: user.id })
        }

        const { error } = await query
        if (error) throw error

        // Revalidate the path to update the layout query
        revalidatePath('/dashboard')
        return { success: true }
    } catch (err: any) {
        console.error('[ERROR] toggleLike failed:', err)
        return { success: false, error: err.message || 'Failed to like post' }
    }
}
```
