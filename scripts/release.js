#!/usr/bin/env node
/**
 * ⚡ Yawn Framework — Release Script
 *
 * Does everything in order:
 *   1. Bumps version across all packages
 *   2. Rebuilds all packages (TS → JS)
 *   3. Publishes to npm
 *
 * Usage:
 *   node scripts/release.js patch          # 0.2.0 → 0.2.1
 *   node scripts/release.js minor          # 0.2.0 → 0.3.0
 *   node scripts/release.js major          # 0.2.0 → 1.0.0
 *   node scripts/release.js 0.2.5          # explicit version
 *   node scripts/release.js patch --dry    # full run, no actual publish
 *   node scripts/release.js patch --build-only  # bump + build, skip publish
 */

import { spawnSync, execSync } from 'node:child_process';
import {
  readFileSync, writeFileSync, existsSync,
  mkdirSync, readdirSync,
} from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Args ─────────────────────────────────────────────────────────────────────

const args       = process.argv.slice(2);
const bumpType   = args.find(a => !a.startsWith('--')) ?? 'patch';
const DRY        = args.includes('--dry');
const BUILD_ONLY = args.includes('--build-only');
const SKIP_BUILD = args.includes('--skip-build');
const TAG        = args.includes('--next') ? 'next' : 'latest';

// ─── Package list (dependency order) ─────────────────────────────────────────

const SUB_PACKAGES = [
  'shared',
  'reactivity',
  'compiler',
  'core',
  'router',
  'dev-server',
  'server',
  'runtime',
  'devtools',
  'cli',
  'create-yawn',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  blue:   '\x1b[34m',
};

function log(msg)    { console.log(`  ${msg}`); }
function ok(msg)     { console.log(`  ${c.green}✓${c.reset} ${msg}`); }
function warn(msg)   { console.log(`  ${c.yellow}⚠${c.reset}  ${msg}`); }
function fail(msg)   { console.log(`  ${c.red}✗${c.reset} ${msg}`); }
function step(msg)   { console.log(`\n  ${c.bold}${c.cyan}── ${msg}${c.reset}\n`); }
function dim(msg)    { console.log(`  ${c.dim}${msg}${c.reset}`); }

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, obj) {
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function run(cmd, args, cwd = ROOT) {
  const r = spawnSync(cmd, args, {
    cwd,
    stdio:    'pipe',
    encoding: 'utf8',
    shell:    true,
  });
  return {
    ok:     r.status === 0,
    stdout: (r.stdout ?? '').trim(),
    stderr: (r.stderr ?? '').trim(),
    status: r.status,
  };
}

// Run with shell=false — avoids Windows path-with-spaces issues for Node.js invocations
function runNode(args, cwd = ROOT) {
  const r = spawnSync(process.execPath, args, {
    cwd,
    stdio:    'pipe',
    encoding: 'utf8',
    shell:    false,
  });
  return {
    ok:     r.status === 0,
    stdout: (r.stdout ?? '').trim(),
    stderr: (r.stderr ?? '').trim(),
    status: r.status,
  };
}

// ─── Version bump ─────────────────────────────────────────────────────────────

function bumpVersion(current, type) {
  // If it looks like an explicit version string, use it directly
  if (/^\d+\.\d+\.\d+/.test(type)) return type;

  const [maj, min, pat] = current.split('.').map(Number);
  switch (type) {
    case 'major': return `${maj + 1}.0.0`;
    case 'minor': return `${maj}.${min + 1}.0`;
    case 'patch':
    default:      return `${maj}.${min}.${pat + 1}`;
  }
}

// ─── Step 1: Version bump ─────────────────────────────────────────────────────

function stepBumpVersions() {
  step('Bumping versions');

  const rootPkg    = readJson(join(ROOT, 'package.json'));
  const currentVer = rootPkg.version;
  const nextVer    = bumpVersion(currentVer, bumpType);

  log(`${currentVer}  →  ${c.bold}${nextVer}${c.reset}`);

  // Root
  rootPkg.version = nextVer;
  writeJson(join(ROOT, 'package.json'), rootPkg);
  ok('root  (yawn-framework)');

  // Sub-packages
  for (const name of SUB_PACKAGES) {
    const pkgPath = join(ROOT, 'packages', name, 'package.json');
    if (!existsSync(pkgPath)) { warn(`${name}: no package.json, skipping`); continue; }
    const pkg = readJson(pkgPath);
    pkg.version = nextVer;
    writeJson(pkgPath, pkg);
    ok(pkg.name);
  }

  // Also update CHANGELOG placeholder date
  const clPath = join(ROOT, 'CHANGELOG.md');
  if (existsSync(clPath)) {
    let cl = readFileSync(clPath, 'utf8');
    const today = new Date().toISOString().slice(0, 10);
    if (!cl.includes(`## v${nextVer}`)) {
      cl = `# Changelog\n\n## v${nextVer} — ${today}\n\n_Release notes coming soon._\n\n` + cl.replace(/^# Changelog\n\n/, '');
      writeFileSync(clPath, cl, 'utf8');
      ok('CHANGELOG.md updated');
    }
  }

  return nextVer;
}

// ─── Step 2: Build all packages ───────────────────────────────────────────────

function stepBuild() {
  step('Building packages (TypeScript → JavaScript)');

  const tscBin = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
  if (!existsSync(tscBin)) {
    fail('typescript not found. Run: npm install');
    process.exit(1);
  }

  const BUILD_PACKAGES = SUB_PACKAGES.filter(n => n !== 'create-yawn');

  // tsconfig.build.json path maps (reuse the ones already generated)
  for (const name of BUILD_PACKAGES) {
    const pkgDir  = join(ROOT, 'packages', name);
    const srcDir  = join(pkgDir, 'src');
    if (!existsSync(srcDir)) { dim(`${name}: no src/, skipping build`); continue; }

    // Ensure tsconfig.build.json exists
    const tsconfPath = join(pkgDir, 'tsconfig.build.json');
    if (!existsSync(tsconfPath)) {
      writeFileSync(tsconfPath, JSON.stringify({
        compilerOptions: {
          target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext',
          declaration: true, declarationMap: true, sourceMap: true,
          outDir: './dist', rootDir: './src',
          strict: true, skipLibCheck: true, esModuleInterop: true,
          paths: {
            '@yawn-framework/core':        ['../core/dist/index.d.ts'],
            '@yawn-framework/compiler':    ['../compiler/dist/index.d.ts'],
            '@yawn-framework/reactivity':  ['../reactivity/dist/index.d.ts'],
            '@yawn-framework/shared':      ['../shared/dist/index.d.ts'],
            '@yawn-framework/router':      ['../router/dist/index.d.ts'],
            'yawn-framework':              ['../core/dist/index.d.ts'],
            'yawn-framework/compiler':     ['../compiler/dist/index.d.ts'],
            'yawn-framework/reactivity':   ['../reactivity/dist/index.d.ts'],
            'yawn-framework/dev-server':   ['../dev-server/dist/index.d.ts'],
            'yawn-framework/server':       ['../server/dist/index.d.ts'],
            'yawn-framework/router':       ['../router/dist/index.d.ts'],
            'yawn-framework/shared':       ['../shared/dist/index.d.ts'],
          },
        },
        include: ['src/**/*.ts'],
        exclude: ['node_modules', 'dist'],
      }, null, 2) + '\n', 'utf8');
    }

    // Run tsc with absolute path to binary, cwd = ROOT so relative paths work
    const r = run(process.execPath, [tscBin, '--project', tsconfPath], ROOT);

    if (r.ok) {
      ok(`${name}`);
    } else {
      // Show first few error lines
      const errors = (r.stdout + r.stderr).split('\n').filter(l => l.includes('error TS')).slice(0, 5);
      fail(`${name}:`);
      errors.forEach(e => console.log(`    ${c.red}${e.trim()}${c.reset}`));
      // Don't abort — continue building others
    }
  }
}

// ─── Step 3: Publish ──────────────────────────────────────────────────────────

function stepPublish(version) {
  step(`Publishing v${version} to npm ${DRY ? c.yellow + '(DRY RUN)' + c.reset : ''}`);

  let failed = 0;

  const ALL = [...SUB_PACKAGES, null]; // null = root

  for (const name of ALL) {
    const pkgDir  = name ? join(ROOT, 'packages', name) : ROOT;
    const pkgPath = join(pkgDir, 'package.json');
    if (!existsSync(pkgPath)) continue;

    const pkg = readJson(pkgPath);
    if (pkg.private === true) { dim(`${pkg.name}: private, skipped`); continue; }

    // Check dist for TS packages
    if (name && existsSync(join(pkgDir, 'src')) && !existsSync(join(pkgDir, 'dist'))) {
      fail(`${pkg.name}: dist/ missing`);
      failed++;
      continue;
    }

    process.stdout.write(`  ${c.dim}publishing ${pkg.name}@${pkg.version}...${c.reset}`);

    const publishArgs = ['publish', '--access', 'public', '--tag', TAG];
    if (DRY) publishArgs.push('--dry-run');

    const r = run('npm', publishArgs, pkgDir);

    const out    = (r.stdout + r.stderr).toLowerCase();
    const isRealError = !r.ok
      && !out.includes('npm notice')
      && !out.includes('npm warn')
      && !out.includes('already exists');

    const alreadyPublished = out.includes('you cannot publish over') || out.includes('already exists') || out.includes('previously published');

    if (r.ok || out.includes('npm notice')) {
      process.stdout.write(`\r  ${c.green}✓${c.reset} ${pkg.name}@${pkg.version}${' '.repeat(20)}\n`);
    } else if (alreadyPublished) {
      process.stdout.write(`\r  ${c.yellow}~${c.reset} ${pkg.name}@${pkg.version} (already published)${' '.repeat(10)}\n`);
    } else {
      process.stdout.write(`\r  ${c.red}✗${c.reset} ${pkg.name}@${pkg.version}${' '.repeat(20)}\n`);
      const firstError = (r.stdout + r.stderr).split('\n').find(l => l.includes('E4')) ?? '';
      if (firstError) console.log(`    ${c.red}${firstError.trim()}${c.reset}`);
      failed++;
    }
  }

  return failed;
}

// ─── Git tag ──────────────────────────────────────────────────────────────────

function stepGitTag(version) {
  if (DRY || BUILD_ONLY) return;
  step('Git tag');

  const tag = `v${version}`;
  const hasGit = existsSync(join(ROOT, '.git'));
  if (!hasGit) { warn('Not a git repo, skipping tag'); return; }

  const status = run('git', ['status', '--porcelain']);
  if (status.stdout) {
    warn('Uncommitted changes — commit before tagging, skipping');
    return;
  }

  run('git', ['tag', '-a', tag, '-m', `Release ${tag}`]);
  ok(`git tag ${tag}`);

  const pushTag = run('git', ['push', 'origin', tag]);
  if (pushTag.ok) ok(`pushed ${tag} to origin`);
  else warn(`Could not push tag: ${pushTag.stderr.split('\n')[0]}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`\n  ${c.bold}${c.cyan}⚡ Yawn Framework — Release${c.reset}`);
if (DRY)        console.log(`  ${c.yellow}DRY RUN — nothing will be published${c.reset}`);
if (BUILD_ONLY) console.log(`  ${c.yellow}BUILD ONLY — publish step will be skipped${c.reset}`);
console.log();

// 1. Bump
const version = stepBumpVersions();

// 2. Build
if (!SKIP_BUILD) {
  stepBuild();
} else {
  log('Skipping build (--skip-build)');
}

// 3. Publish
let publishFailed = 0;
if (!BUILD_ONLY) {
  publishFailed = stepPublish(version);
} else {
  log('Skipping publish (--build-only)');
}

// 4. Git tag
stepGitTag(version);

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log();
if (publishFailed > 0) {
  console.log(`  ${c.red}${c.bold}⚠  ${publishFailed} package(s) failed to publish.${c.reset}`);
  console.log(`  ${c.dim}Check output above. You may need to: npm login${c.reset}\n`);
  process.exit(1);
} else {
  const action = BUILD_ONLY ? 'built' : DRY ? 'dry-run complete' : 'published';
  console.log(`  ${c.green}${c.bold}✅  v${version} ${action} successfully${c.reset}`);
  if (!DRY && !BUILD_ONLY) {
    console.log(`  ${c.dim}npm: https://www.npmjs.com/package/yawn-framework${c.reset}`);
    console.log(`  ${c.dim}Users can now: npm install yawn-framework@${version}${c.reset}`);
  }
  console.log();
}
