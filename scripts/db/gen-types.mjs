#!/usr/bin/env node
// Regenerates src/lib/supabase/database.types.ts from the live Supabase schema.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const OUTPUT = resolve('src/lib/supabase/database.types.ts')
const DEFAULT_SCHEMAS = ['public', 'boardgames']

function readEnvLocal(name) {
    if (process.env[name]) return process.env[name]
    if (!existsSync('.env.local')) return undefined
    const line = readFileSync('.env.local', 'utf8')
        .split(/\r?\n/)
        .find((l) => l.startsWith(`${name}=`))
    return line?.slice(name.length + 1).trim().replace(/^["']|["']$/g, '')
}

const token = readEnvLocal('SUPABASE_ACCESS_TOKEN')
if (!token) {
    console.error('SUPABASE_ACCESS_TOKEN is not set. Create a personal access token at')
    console.error('https://supabase.com/dashboard/account/tokens and run:')
    console.error("  $env:SUPABASE_ACCESS_TOKEN='sbp_...'; npm run gen:types")
    process.exit(1)
}

const supabaseUrl = readEnvLocal('NEXT_PUBLIC_SUPABASE_URL')
const projectRef = readEnvLocal('SUPABASE_PROJECT_REF') || supabaseUrl?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]
if (!projectRef) {
    console.error('Could not determine the project ref. Set SUPABASE_PROJECT_REF.')
    process.exit(1)
}

const schemas = (readEnvLocal('SUPABASE_TYPE_SCHEMAS') || DEFAULT_SCHEMAS.join(','))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

const url = `https://api.supabase.com/v1/projects/${projectRef}/types/typescript?included_schemas=${encodeURIComponent(schemas.join(','))}`
const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
if (!res.ok) {
    console.error(`Type generation failed: HTTP ${res.status} ${await res.text()}`)
    process.exit(1)
}

const { types } = await res.json()
if (typeof types !== 'string' || !types.includes('export type Database')) {
    console.error('Unexpected response: no Database type in the payload.')
    process.exit(1)
}

writeFileSync(OUTPUT, types)
console.log(`Wrote ${OUTPUT} (${schemas.join(', ')}, ${types.length} chars).`)
