#!/usr/bin/env node
/**
 * Multi-Session Retrospective Extractor for Antigravity
 *
 * Scans C:\Users\rogie\.gemini\antigravity\brain\* for coding sessions active since the
 * last commit touching any *AGENTS.md file (or a custom --days / --since window),
 * extracts USER_INPUT messages (including truncated_fields from transcript_full.jsonl)
 * and .md artifacts, checks git commits, and audits the 24,000-byte per-file rule cap.
 */

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execSync } from 'node:child_process'

const RULE_BYTE_CAP = 24000
const RULE_FILES = [
    'AGENTS.md',
    'src/app/AGENTS.md',
    'supabase/AGENTS.md',
    'scripts/AGENTS.md',
    'services/AGENTS.md',
]

function parseArgs(argv) {
    const opts = { days: null, since: null, out: null, brainDir: null }
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]
        if (arg === '--days' && argv[i + 1]) {
            opts.days = Number(argv[++i])
        } else if (arg === '--since' && argv[i + 1]) {
            opts.since = argv[++i]
        } else if (arg === '--out' && argv[i + 1]) {
            opts.out = argv[++i]
        } else if (arg === '--brain-dir' && argv[i + 1]) {
            opts.brainDir = argv[++i]
        }
    }
    return opts
}

function resolveCutoffDate(opts) {
    if (opts.since) {
        const d = new Date(opts.since)
        if (!Number.isNaN(d.getTime())) return { date: d, source: `--since ${opts.since}` }
    }
    if (opts.days && Number.isFinite(opts.days)) {
        const d = new Date(Date.now() - opts.days * 24 * 60 * 60 * 1000)
        return { date: d, source: `--days ${opts.days}` }
    }
    try {
        const iso = execSync(
            'git log -1 --format=%cI -- AGENTS.md src/app/AGENTS.md supabase/AGENTS.md scripts/AGENTS.md services/AGENTS.md',
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
        ).trim()
        if (iso) {
            const d = new Date(iso)
            if (!Number.isNaN(d.getTime())) {
                return { date: d, source: `last *AGENTS.md commit (${iso})` }
            }
        }
    } catch {
        // fallback below
    }
    const fallback = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    return { date: fallback, source: 'default 48h fallback' }
}

function getRuleByteBudgets(repoRoot) {
    return RULE_FILES.map((relPath) => {
        const fullPath = path.join(repoRoot, relPath)
        const exists = fs.existsSync(fullPath)
        const bytes = exists ? fs.statSync(fullPath).size : 0
        const pct = ((bytes / RULE_BYTE_CAP) * 100).toFixed(1)
        return { file: relPath, bytes, cap: RULE_BYTE_CAP, pct: `${pct}%`, status: bytes > 18000 ? 'COMPACT_RECOMMENDED' : 'OK' }
    })
}

function getGitCommitsSince(cutoffDate) {
    try {
        const out = execSync(`git log --since="${cutoffDate.toISOString()}" --oneline --no-decorate`, {
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore'],
        }).trim()
        return out ? out.split(/\r?\n/) : []
    } catch {
        return []
    }
}

function extractCleanUserText(rawContent) {
    if (!rawContent) return ''
    const match = rawContent.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/)
    return (match ? match[1] : rawContent).trim()
}

function scanBrainSessions(brainDir, cutoffDate) {
    if (!fs.existsSync(brainDir)) return []
    const entries = fs.readdirSync(brainDir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && d.name !== 'tempmediaStorage')

    const sessions = []
    for (const entry of entries) {
        const convDir = path.join(brainDir, entry.name)
        const transcriptPath = path.join(convDir, '.system_generated', 'logs', 'transcript.jsonl')
        const fullTranscriptPath = path.join(convDir, '.system_generated', 'logs', 'transcript_full.jsonl')

        let lastActive = fs.statSync(convDir).mtime
        if (fs.existsSync(transcriptPath)) {
            const st = fs.statSync(transcriptPath)
            if (st.mtime > lastActive) lastActive = st.mtime
        }
        if (lastActive < cutoffDate) continue

        const mdFiles = fs.readdirSync(convDir)
            .filter((f) => f.endsWith('.md'))
            .map((f) => {
                const p = path.join(convDir, f)
                return { name: f, path: p, bytes: fs.statSync(p).size }
            })

        const userMessages = []
        if (fs.existsSync(transcriptPath)) {
            const lines = fs.readFileSync(transcriptPath, 'utf8').split(/\r?\n/).filter(Boolean)
            let fullLines = null
            for (let i = 0; i < lines.length; i++) {
                try {
                    const step = JSON.parse(lines[i])
                    if (step.type === 'USER_INPUT') {
                        let content = step.content || ''
                        if (step.truncated_fields?.includes('content') && fs.existsSync(fullTranscriptPath)) {
                            if (!fullLines) {
                                fullLines = fs.readFileSync(fullTranscriptPath, 'utf8').split(/\r?\n/).filter(Boolean)
                            }
                            if (fullLines[i]) {
                                const fullStep = JSON.parse(fullLines[i])
                                content = fullStep.content || content
                            }
                        }
                        const text = extractCleanUserText(content)
                        if (text) {
                            userMessages.push({
                                stepIndex: step.step_index,
                                createdAt: step.created_at,
                                text,
                            })
                        }
                    }
                } catch {
                    // ignore malformed jsonl line
                }
            }
        }

        sessions.push({
            id: entry.name,
            lastActive: lastActive.toISOString(),
            mdFiles,
            userMessages,
        })
    }

    sessions.sort((a, b) => b.lastActive.localeCompare(a.lastActive))
    return sessions
}

function main() {
    const opts = parseArgs(process.argv.slice(2))
    const repoRoot = process.cwd()
    const brainDir = opts.brainDir || path.join(os.homedir(), '.gemini', 'antigravity', 'brain')
    const { date: cutoffDate, source: cutoffSource } = resolveCutoffDate(opts)

    const budgets = getRuleByteBudgets(repoRoot)
    const commits = getGitCommitsSince(cutoffDate)
    const sessions = scanBrainSessions(brainDir, cutoffDate)

    console.log(`=== Session Retrospective Scan ===`)
    console.log(`Cutoff: ${cutoffDate.toISOString()} (${cutoffSource})`)
    console.log(`Sessions active since cutoff: ${sessions.length}`)
    console.log(`Git commits since cutoff:     ${commits.length}\n`)

    console.log(`--- AGENTS.md Byte Budget Audit (Cap: ${RULE_BYTE_CAP} B) ---`)
    for (const b of budgets) {
        console.log(`  ${b.file.padEnd(22)} ${String(b.bytes).padStart(6)} / ${b.cap} B (${b.pct.padStart(5)}) [${b.status}]`)
    }

    console.log(`\n--- Sessions Found ---`)
    for (const s of sessions) {
        const artifacts = s.mdFiles.map((m) => m.name).join(', ') || 'none'
        console.log(`  ${s.id} | ${s.lastActive} | ${String(s.userMessages.length).padStart(2)} user msgs | artifacts: ${artifacts}`)
    }

    const outPath = opts.out || path.join(repoRoot, '.next', 'cache', 'retrospective-digest.md')
    fs.mkdirSync(path.dirname(outPath), { recursive: true })

    let md = `# Retrospective Digest (Since ${cutoffDate.toISOString()})\n\n`
    md += `- **Cutoff Source**: ${cutoffSource}\n`
    md += `- **Sessions Scanned**: ${sessions.length}\n`
    md += `- **Commits Since Cutoff**: ${commits.length}\n\n`

    md += `## 1. Rule File Byte Budgets (Cap: 24,000 B)\n\n`
    md += `| File | Bytes | % of 24 KB Cap | Status |\n|---|---|---|---|\n`
    for (const b of budgets) {
        md += `| \`${b.file}\` | ${b.bytes} B | ${b.pct} | ${b.status} |\n`
    }

    md += `\n## 2. Git Commits Since Cutoff\n\n`
    for (const c of commits) {
        md += `- \`${c}\`\n`
    }

    md += `\n## 3. Coding Sessions & User Feedback\n\n`
    for (const s of sessions) {
        md += `### Session \`${s.id}\` (Last Active: ${s.lastActive})\n\n`
        md += `#### User Messages (${s.userMessages.length})\n`
        for (const m of s.userMessages) {
            const oneLine = m.text.replace(/\r?\n/g, ' \\n ')
            md += `- **[step ${m.stepIndex} @ ${m.createdAt}]**: ${oneLine}\n`
        }
        if (s.mdFiles.length > 0) {
            md += `\n#### Artifacts\n`
            for (const a of s.mdFiles) {
                md += `\n##### ${a.name} (\`${a.path}\`)\n\n`
                md += fs.readFileSync(a.path, 'utf8') + '\n'
            }
        }
        md += `\n---\n\n`
    }

    fs.writeFileSync(outPath, md, 'utf8')
    console.log(`\nFull markdown digest written to: ${outPath}`)
}

main()
