---
name: LLM Structured Data Extraction (JSON Schema)
description: Techniques and code templates for querying Gemini or OpenAI models to extract structured JSON data matching strict Zod schemas.
---

# LLM Structured Data Extraction

Use this skill when processing unstructured text (comments, descriptions, bios) to extract specific metrics, categorization fields, lead scores, or sentiment profiles using Gemini AI or the Vercel AI SDK.

## 1. Structured Output Pattern (Vercel AI SDK)

To ensure the LLM returns valid JSON matching a typescript schema, use Vercel AI SDK's `generateObject` function.

### Code Implementation Template:
```typescript
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google' // or openai
import { z } from 'zod'

// 1. Define the target JSON shape
const leadScoringSchema = z.object({
    isLead: z.boolean().describe('True if the user expresses intent to buy, hire, or try the service'),
    intentScore: z.number().min(0).max(100).describe('Rating of intent, 0 (none) to 100 (ready to buy)'),
    primaryGoal: z.string().nullable().describe('The problem they want to solve or product they want'),
    keyQuestions: z.array(z.string()).describe('List of questions asked by the user in the text'),
    sentiment: z.enum(['positive', 'neutral', 'negative']).describe('General sentiment tone')
})

export type LeadScoreResult = z.infer<typeof leadScoringSchema>

export async function scoreUserComment(commentText: string): Promise<LeadScoreResult> {
    try {
        const { object } = await generateObject({
            model: google('gemini-2.5-flash'), // or gemini-3.5-flash
            schema: leadScoringSchema,
            system: 'You are an expert sales lead analyzer. Extract structured metrics from TikTok comments.',
            prompt: `Analyze this comment: "${commentText}"`
        })

        return object
    } catch (err: any) {
        console.error('[ERROR] LLM Structured Extraction failed:', err)
        // Fallback object matching schema
        return {
            isLead: false,
            intentScore: 0,
            primaryGoal: null,
            keyQuestions: [],
            sentiment: 'neutral'
        }
    }
}
```

---

## 2. Structured Prompts Best Practices

1. **Explicit Schemas**: Always provide Zod schemas or JSON Schema payloads directly in the API parameters. This forces the model to use tool-calling or constrained decoding to output valid JSON.
2. **Field Descriptions**: Use `.describe()` on Zod properties. The compiler forwards these descriptions to the LLM as inline documentation for each property.
3. **Handle Edge Cases**: Ensure schemas allow nullable fields (`z.nullable()`) or optional arrays (`z.array()`) so the model doesn't hallucinate data when it is missing from the source text.
4. **Error Isolation**: Always encapsulate AI calls inside isolated try-catch blocks with low timeouts (e.g., 10-15 seconds) to prevent a slow LLM call from locking up server actions indefinitely.
