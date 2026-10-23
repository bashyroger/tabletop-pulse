#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const nextDir = path.join(projectRoot, '.next');
const cacheDir = path.join(nextDir, 'cache');
const devDir = path.join(nextDir, 'dev');

const args = process.argv.slice(2);
const isForce = args.includes('--force');
const thresholdArg = args.find((arg) => arg.startsWith('--threshold='));
const thresholdMB = thresholdArg ? parseFloat(thresholdArg.split('=')[1]) : 1000;

function getDirectorySize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  let totalSize = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          totalSize += getDirectorySize(fullPath);
        } else if (entry.isFile()) {
          const stats = fs.statSync(fullPath);
          totalSize += stats.size;
        }
      } catch {
        // Ignore file lock or permission errors during scan
      }
    }
  } catch {
    // Ignore read errors
  }
  return totalSize;
}

function pruneTarget(targetPath) {
  if (fs.existsSync(targetPath)) {
    try {
      fs.rmSync(targetPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      return true;
    } catch {
      if (process.platform === 'win32') {
        try {
          execSync(`cmd /c rmdir /s /q "${targetPath}"`, { stdio: 'ignore' });
          return true;
        } catch {
          // ignore
        }
      }
      return false;
    }
  }
  return false;
}

if (!fs.existsSync(nextDir)) {
  process.exit(0);
}

const cacheBytes = getDirectorySize(cacheDir);
const devBytes = getDirectorySize(devDir);
const totalBytes = cacheBytes + devBytes;
const totalMB = Math.round((totalBytes / (1024 * 1024)) * 100) / 100;

if (isForce || totalMB > thresholdMB) {
  console.log(
    `[Next.js Cache Guard] Stale cache size (${totalMB} MB) ${isForce ? 'force-cleaned' : `exceeded threshold of ${thresholdMB} MB`}. Pruning...`
  );
  pruneTarget(cacheDir);
  pruneTarget(devDir);
  console.log(`[Next.js Cache Guard] Done! Reclaimed ~${totalMB} MB of disk space.`);
}
