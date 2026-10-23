#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const pkgPath = path.join(cwd, 'package.json');

if (!fs.existsSync(pkgPath)) {
  console.error(`[Version] Error: No package.json found in ${cwd}`);
  process.exit(1);
}

const raw = fs.readFileSync(pkgPath, 'utf8');
const pkg = JSON.parse(raw);
const currentVersion = pkg.version || '0.1.0';

const args = process.argv.slice(2);
const type = (args[0] || 'patch').toLowerCase();

const parts = currentVersion.split('.').map(Number);
if (parts.length !== 3 || parts.some(isNaN)) {
  console.error(`[Version] Error: Invalid semver format in package.json: "${currentVersion}"`);
  process.exit(1);
}

let [major, minor, patch] = parts;

switch (type) {
  case 'major':
    major += 1;
    minor = 0;
    patch = 0;
    break;
  case 'minor':
    minor += 1;
    patch = 0;
    break;
  case 'patch':
  default:
    patch += 1;
    break;
}

const nextVersion = `${major}.${minor}.${patch}`;
pkg.version = nextVersion;

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

const lockPath = path.join(cwd, 'package-lock.json');
if (fs.existsSync(lockPath)) {
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  lock.version = nextVersion;
  if (lock.packages && lock.packages['']) {
    lock.packages[''].version = nextVersion;
  }
  fs.writeFileSync(lockPath, JSON.stringify(lock, null, 2) + '\n', 'utf8');
}

console.log(`[Version] Bumped ${pkg.name || 'project'} from ${currentVersion} -> ${nextVersion} (${type})`);
