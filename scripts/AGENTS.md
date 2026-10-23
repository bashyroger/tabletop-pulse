# `scripts/` — Build, Cache & Deployment Scripts

1. **PowerShell 5.1 Compatibility**:
   - Do not use `&&` in PowerShell 5.1.
   - Use `curl.exe` instead of `curl`.
2. **Hostinger Standalone Build Pipeline**:
   - `npm run build` runs `prune-next-cache.mjs` -> `next build --webpack` -> `copy-standalone-assets.js`.
