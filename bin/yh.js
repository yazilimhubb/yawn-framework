#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsEntry = join(__dirname, '..', 'packages', 'cli', 'src', 'index.ts');
const jsEntry = join(__dirname, '..', 'packages', 'cli', 'dist', 'index.js');

const args = process.argv.slice(2);

if (existsSync(jsEntry)) {
  const res = spawnSync(process.execPath, [jsEntry, ...args], { stdio: 'inherit' });
  process.exit(res.status ?? 0);
} else {
  // run via tsx loader for TypeScript entry
  const res = spawnSync(process.execPath, ['--import', 'tsx', tsEntry, ...args], { stdio: 'inherit' });
  process.exit(res.status ?? 0);
}
