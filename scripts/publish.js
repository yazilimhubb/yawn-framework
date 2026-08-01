#!/usr/bin/env node
/**
 * Publish all Yawn Framework packages to npm.
 *
 * Usage:
 *   node scripts/publish.js              # publish all
 *   node scripts/publish.js --dry-run    # dry run
 *   node scripts/publish.js --next       # publish as next tag
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT    = join(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const TAG     = process.argv.includes('--next') ? 'next' : 'latest';

// Dependency order — publish dependencies before dependents
const PACKAGES = [
  { dir: join(ROOT, 'packages', 'shared'),     name: 'shared'      },
  { dir: join(ROOT, 'packages', 'reactivity'), name: 'reactivity'  },
  { dir: join(ROOT, 'packages', 'compiler'),   name: 'compiler'    },
  { dir: join(ROOT, 'packages', 'core'),       name: 'core'        },
  { dir: join(ROOT, 'packages', 'router'),     name: 'router'      },
  { dir: join(ROOT, 'packages', 'dev-server'), name: 'dev-server'  },
  { dir: join(ROOT, 'packages', 'server'),     name: 'server'      },
  { dir: join(ROOT, 'packages', 'runtime'),    name: 'runtime'     },
  { dir: join(ROOT, 'packages', 'devtools'),   name: 'devtools'    },
  { dir: join(ROOT, 'packages', 'cli'),        name: 'cli'         },
  { dir: join(ROOT, 'packages', 'create-yawn'),name: 'create-yawn' },
  { dir: ROOT,                                  name: 'root'        },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  dim:    '\x1b[2m',
  bold:   '\x1b[1m',
};

function publish(pkgDir) {
  const pkgPath = join(pkgDir, 'package.json');
  if (!existsSync(pkgPath)) return { skip: true, reason: 'no package.json' };

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

  if (pkg.private === true) return { skip: true, reason: 'private' };

  // Check dist for TS packages
  const hasSrc  = existsSync(join(pkgDir, 'src'));
  const hasDist = existsSync(join(pkgDir, 'dist'));
  if (hasSrc && !hasDist) return { skip: true, reason: 'dist/ missing — run: npm run build:packages' };

  const args = ['publish', '--access', 'public', '--tag', TAG];
  if (DRY_RUN) args.push('--dry-run');

  const r = spawnSync('npm', args, {
    cwd:      pkgDir,
    stdio:    'pipe',
    encoding: 'utf8',
    shell:    true,
  });

  const out    = (r.stdout ?? '') + (r.stderr ?? '');
  const outLow = out.toLowerCase();

  // npm exits 0 on success, but may exit 1 when only printing notices/warnings
  // Treat as success when output only contains npm notices/warnings (no real error)
  const hasRealError = r.status !== 0
    && !outLow.includes('npm notice')
    && !outLow.includes('npm warn');

  const alreadyExists = outLow.includes('you cannot publish over')
    || outLow.includes('cannot publish over')
    || outLow.includes('previously published');

  if (alreadyExists) {
    return { ok: true, skipped: true, name: pkg.name, version: pkg.version };
  }

  if (hasRealError) {
    const firstError = out.split('\n')
      .find(l => l.trim() && !l.includes('npm notice') && !l.includes('npm warn') && !l.includes('Tarball'))
      ?.trim() ?? 'unknown error';
    return { ok: false, name: pkg.name, version: pkg.version, error: firstError };
  }

  return { ok: true, name: pkg.name, version: pkg.version };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`\n  ${C.bold}⚡ Yawn Framework — npm publish${C.reset}`);
if (DRY_RUN) console.log(`  ${C.yellow}DRY RUN — nothing will actually be published${C.reset}`);
console.log();

let failed = 0;
let published = 0;
let skipped = 0;

for (const { dir, name } of PACKAGES) {
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) { skipped++; continue; }
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  const label = pkg.name ?? name;
  const ver   = pkg.version ?? '?';

  process.stdout.write(`  ${C.dim}publishing ${label}@${ver}...${C.reset}`);

  const result = publish(dir);

  if (result.skip) {
    process.stdout.write(`\r  ${C.dim}~ ${label}: ${result.reason}${' '.repeat(30)}${C.reset}\n`);
    skipped++;
  } else if (result.skipped) {
    process.stdout.write(`\r  ${C.yellow}~${C.reset} ${label}@${ver} (already published)${' '.repeat(10)}\n`);
    skipped++;
  } else if (result.ok) {
    process.stdout.write(`\r  ${C.green}✓${C.reset} ${label}@${ver}${' '.repeat(40)}\n`);
    published++;
  } else {
    process.stdout.write(`\r  ${C.red}✗${C.reset} ${label}@${ver}${' '.repeat(40)}\n`);
    console.log(`    ${C.red}${result.error}${C.reset}`);
    failed++;
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log();
if (failed > 0) {
  console.log(`  ${C.red}${C.bold}⚠  ${failed} failed, ${published} published, ${skipped} skipped${C.reset}`);
  console.log(`  ${C.dim}If you see auth errors: npm login${C.reset}\n`);
  process.exit(1);
} else {
  console.log(`  ${C.green}${C.bold}✅  Done — ${published} published, ${skipped} skipped${C.reset}\n`);
}
