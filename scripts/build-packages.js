#!/usr/bin/env node
/**
 * Build all Yawn Framework packages from TypeScript → JavaScript.
 * Output goes to packages/<name>/dist/
 * Then package.json exports are updated to point at dist/.
 */
import { spawnSync, execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname, basename, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const PACKAGES = [
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
];

function log(msg) { console.log(`  ${msg}`); }
function ok(msg)  { console.log(`  ✓ ${msg}`); }
function err(msg) { console.error(`  ✗ ${msg}`); }

// Write a tsconfig for each package build
function writeTsconfig(pkgDir) {
  const tsconfigPath = join(pkgDir, 'tsconfig.build.json');
  // Get workspace root relative to this package dir
  const pkgName = basename(pkgDir);
  writeFileSync(tsconfigPath, JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      outDir: './dist',
      rootDir: './src',
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      // Map @yawn-framework/* to their dist declaration files
      paths: {
        '@yawn-framework/core': ['../core/dist/index.d.ts'],
        '@yawn-framework/compiler': ['../compiler/dist/index.d.ts'],
        '@yawn-framework/reactivity': ['../reactivity/dist/index.d.ts'],
        '@yawn-framework/shared': ['../shared/dist/index.d.ts'],
        '@yawn-framework/router': ['../router/dist/index.d.ts'],
        'yawn-framework': ['../core/dist/index.d.ts'],
        'yawn-framework/compiler': ['../compiler/dist/index.d.ts'],
        'yawn-framework/reactivity': ['../reactivity/dist/index.d.ts'],
        'yawn-framework/dev-server': ['../dev-server/dist/index.d.ts'],
        'yawn-framework/server': ['../server/dist/index.d.ts'],
        'yawn-framework/router': ['../router/dist/index.d.ts'],
        'yawn-framework/shared': ['../shared/dist/index.d.ts'],
      },
    },
    include: ['src/**/*.ts'],
    exclude: ['node_modules', 'dist'],
  }, null, 2), 'utf8');
  return tsconfigPath;
}

function buildPackage(name) {
  const pkgDir = join(ROOT, 'packages', name);
  const srcDir = join(pkgDir, 'src');
  const distDir = join(pkgDir, 'dist');

  if (!existsSync(srcDir)) {
    log(`Skipping ${name} — no src/`);
    return false;
  }

  log(`Building ${name}...`);

  // Write temp tsconfig
  const tsconfigPath = writeTsconfig(pkgDir);

  // Use tsc from root node_modules via node to avoid path-with-spaces shell issues on Windows
  const tscPath = join(ROOT, 'node_modules', 'typescript', 'bin', 'tsc');
  const result = spawnSync(
    process.execPath,
    [tscPath, '--project', tsconfigPath],
    {
      cwd: pkgDir,
      stdio: 'pipe',
      encoding: 'utf8',
    }
  );

  if (result.status !== 0) {
    err(`Failed to build ${name}:`);
    if (result.stdout) console.error(result.stdout);
    if (result.stderr) console.error(result.stderr);
    return false;
  }

  ok(`Built ${name} → packages/${name}/dist/`);
  return true;
}

function updatePackageJson(name) {
  const pkgJsonPath = join(ROOT, 'packages', name, 'package.json');
  if (!existsSync(pkgJsonPath)) return;

  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
  const distIndex = './dist/index.js';
  const distTypes = './dist/index.d.ts';

  pkg.main = distIndex;
  pkg.types = distTypes;
  pkg.exports = {
    '.': {
      import: distIndex,
      types: distTypes,
    },
  };

  // Keep src for monorepo development
  if (!pkg.files) pkg.files = ['dist', 'src', 'README.md'];

  writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  ok(`Updated ${name}/package.json → dist/`);
}

function updateRootPackageJson() {
  const pkgJsonPath = join(ROOT, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));

  pkg.exports = {
    '.': {
      import: './packages/core/dist/index.js',
      types: './packages/core/dist/index.d.ts',
    },
    './compiler': {
      import: './packages/compiler/dist/index.js',
      types: './packages/compiler/dist/index.d.ts',
    },
    './reactivity': {
      import: './packages/reactivity/dist/index.js',
      types: './packages/reactivity/dist/index.d.ts',
    },
    './router': {
      import: './packages/router/dist/index.js',
      types: './packages/router/dist/index.d.ts',
    },
    './server': {
      import: './packages/server/dist/index.js',
      types: './packages/server/dist/index.d.ts',
    },
    './dev-server': {
      import: './packages/dev-server/dist/index.js',
      types: './packages/dev-server/dist/index.d.ts',
    },
    './runtime': {
      import: './packages/runtime/dist/index.js',
      types: './packages/runtime/dist/index.d.ts',
    },
    './shared': {
      import: './packages/shared/dist/index.js',
      types: './packages/shared/dist/index.d.ts',
    },
  };

  pkg.files = ['packages/*/dist', 'packages/*/src', 'bin', 'README.md', 'LICENSE'];
  pkg.version = '0.2.0';

  writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  ok('Updated root package.json exports → dist/');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('\n  ⚡ Building Yawn Framework packages...\n');

let failed = 0;
for (const name of PACKAGES) {
  const ok = buildPackage(name);
  if (ok) updatePackageJson(name);
  else failed++;
}

updateRootPackageJson();

if (failed > 0) {
  console.log(`\n  ⚠  ${failed} package(s) failed to build. Check errors above.\n`);
  process.exit(1);
} else {
  console.log(`\n  ✅ All packages built. Version bumped to 0.2.0\n`);
}
