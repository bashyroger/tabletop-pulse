# CLAUDE.md — TabletopPulse Root Instructions

Read [`AGENTS.md`](file:///c:/Users/rogie/Documents/antigravity/adventurous-meitner/AGENTS.md) first. It is the canonical source of truth for architecture, Next.js 16 conventions, Supabase `boardgames` schema isolation, and Hostinger deployment.

## Quick Reference
- **Shell**: Windows PowerShell 5.1 — never chain commands with `&&` (use `;` or separate commands). Use `curl.exe` instead of `curl`.
- **Database**: Supabase project `fsbpxifvpjtkrltfizmv` (`macnasmanager`), schema `boardgames` + `boardgames_private`, RPCs `public.bg_*_v2`.
- **Hosting**: Hostinger Node.js 24 Web App (`palegreen-walrus-173226.hostingersite.com`).
