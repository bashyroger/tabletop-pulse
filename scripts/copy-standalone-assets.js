const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, '.next', 'standalone');

if (fs.existsSync(standaloneDir)) {
  const publicSrc = path.join(rootDir, 'public');
  const publicDest = path.join(standaloneDir, 'public');
  const staticSrc = path.join(rootDir, '.next', 'static');
  const staticDest = path.join(standaloneDir, '.next', 'static');

  if (fs.existsSync(publicSrc)) {
    try {
      fs.cpSync(publicSrc, publicDest, { recursive: true, errorOnExist: false });
      console.log('[Postbuild] Copied public/ -> .next/standalone/public/');
    } catch (err) {
      console.warn('[Postbuild] Warning copying public assets to standalone:', err.message);
    }
  }

  if (fs.existsSync(staticSrc)) {
    try {
      fs.cpSync(staticSrc, staticDest, { recursive: true, errorOnExist: false });
      console.log('[Postbuild] Copied .next/static/ -> .next/standalone/.next/static/');
    } catch (err) {
      console.warn('[Postbuild] Warning copying static assets to standalone:', err.message);
    }
  }
} else {
  console.log('[Postbuild] No .next/standalone directory found. Skipping standalone copy.');
}

// Check for Hostinger/LiteSpeed public_html directory in parent hierarchy
try {
  let searchDir = rootDir;
  let publicHtmlDir = null;
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(searchDir, 'public_html');
    if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
      publicHtmlDir = candidate;
      break;
    }
    const parent = path.dirname(searchDir);
    if (parent === searchDir) break;
    searchDir = parent;
  }

  if (publicHtmlDir) {
    console.log('[Postbuild] Found public_html at:', publicHtmlDir);
    const domainDir = path.dirname(publicHtmlDir);
    const targetNext = path.join(domainDir, 'hbuilds', 'current', 'nodejs', '.next');
    const symlinkNext = path.join(publicHtmlDir, '_next');

    let symlinkSuccess = false;
    try {
      if (fs.existsSync(symlinkNext) || fs.lstatSync(symlinkNext).isSymbolicLink()) {
        try { fs.unlinkSync(symlinkNext); } catch (_) {}
      }
      fs.symlinkSync(targetNext, symlinkNext);
      console.log('[Postbuild] Symlinked public_html/_next ->', targetNext);
      symlinkSuccess = true;
    } catch (symErr) {
      console.log('[Postbuild] Symlink creation failed, copying files directly:', symErr.message);
    }

    if (!symlinkSuccess) {
      const staticSrc = path.join(rootDir, '.next', 'static');
      const publicHtmlNextStatic = path.join(publicHtmlDir, '_next', 'static');
      if (fs.existsSync(staticSrc)) {
        fs.mkdirSync(path.join(publicHtmlDir, '_next'), { recursive: true });
        fs.cpSync(staticSrc, publicHtmlNextStatic, { recursive: true, errorOnExist: false });
        console.log('[Postbuild] Copied .next/static/ -> public_html/_next/static/');
      }
    }

    const publicSrc = path.join(rootDir, 'public');
    if (fs.existsSync(publicSrc)) {
      fs.cpSync(publicSrc, publicHtmlDir, { recursive: true, errorOnExist: false });
      console.log('[Postbuild] Copied public/ -> public_html/');
    }
  }
} catch (e) {
  console.log('[Postbuild] Note: Could not sync to public_html (non-fatal):', e.message);
}
