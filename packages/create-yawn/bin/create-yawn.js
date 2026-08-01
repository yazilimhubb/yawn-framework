#!/usr/bin/env node
/**
 * create-yawn — scaffold a new Yawn Framework project
 * Usage: npx create-yawn@latest [dir]
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));

function write(p, content) {
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf8');
}

function prompt(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => { rl.close(); resolve(answer.trim()); });
  });
}

// ─── Templates (inline so create-yawn has zero dependencies) ─────────────────

const LAYOUT_YAWN = `<template>
  <div class="min-h-screen flex flex-col bg-[#0b0b12] text-white">
    <header class="sticky top-0 z-50 border-b border-white/5 bg-[#0b0b12]/90 backdrop-blur-xl">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" class="flex items-center gap-2 font-black text-lg tracking-tight">
          <span class="text-2xl">⚡</span>
          <span>{{ siteName }}</span>
        </a>
        <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-white/50">
          <a href="/" class="hover:text-white transition-colors">Home</a>
          <a href="/about" class="hover:text-white transition-colors">About</a>
        </nav>
      </div>
    </header>

    <main class="flex-1">
      {{ slot }}
    </main>

    <footer class="border-t border-white/5 py-8">
      <div class="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/30 text-sm">
        <span>© {{ year }} {{ siteName }}</span>
        <span>Built with <a href="https://github.com/yazilimhubb/yawn-framework" class="text-indigo-400 hover:text-indigo-300 transition-colors">⚡ Yawn</a></span>
      </div>
    </footer>
  </div>
</template>

<script>
  let siteName = "My Yawn Site";
  let year = "2026";
  let slot = "";
</script>
`;


const INDEX_YAWN = (siteName) => `<template>
  <div>
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="w-[700px] h-[700px] bg-indigo-600/15 rounded-full blur-3xl"></div>
      </div>
      <div class="relative max-w-5xl mx-auto px-6 pt-28 pb-24 text-center">
        <div class="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold px-4 py-1.5 rounded-full mb-8 uppercase tracking-widest">
          ⚡ Yawn Framework
        </div>
        <h1 class="text-5xl sm:text-7xl font-black tracking-tighter leading-[1.05] mb-6">
          Welcome to<br/>
          <span class="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            ${siteName}
          </span>
        </h1>
        <p class="text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10">
          Built with <strong class="text-white/80">.yawn</strong> — single-file components with reactive state, Tailwind built-in and SSR.
        </p>
        <div class="flex gap-4 justify-center flex-wrap">
          <a href="/about" class="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-8 py-3.5 rounded-full transition text-sm">
            About →
          </a>
          <a href="https://github.com/yazilimhubb/yawn-framework" class="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-8 py-3.5 rounded-full transition text-sm">
            GitHub ↗
          </a>
        </div>
      </div>
    </section>

    <section class="max-w-sm mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 text-center mb-16">
      <p class="text-white/40 text-xs font-bold uppercase tracking-widest mb-4">Live Demo — Reactive Counter</p>
      <div class="text-7xl font-black mb-6 tabular-nums">{{ count }}</div>
      <div class="flex gap-3 justify-center">
        <button @click="count--" class="bg-white/10 hover:bg-red-500/20 hover:text-red-400 w-12 h-12 rounded-full text-xl font-bold transition">−</button>
        <button @click="count = 0" class="bg-white/10 hover:bg-white/20 px-5 h-12 rounded-full text-sm font-bold transition">Reset</button>
        <button @click="count++" class="bg-indigo-500 hover:bg-indigo-400 w-12 h-12 rounded-full text-xl font-bold transition">+</button>
      </div>
      <p :if="count > 9" class="mt-4 text-green-400 text-sm font-semibold">🎉 You passed 10!</p>
      <p :else class="mt-4 text-white/20 text-xs">Click the buttons</p>
    </section>
  </div>
</template>

<script>
  let count = 0;
</script>
`;

const ABOUT_YAWN = (siteName) => `<meta>
title: About — ${siteName}
description: About this site
</meta>

<template>
  <div class="max-w-3xl mx-auto px-6 py-20">
    <div class="mb-10">
      <a href="/" class="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">← Back to home</a>
    </div>
    <h1 class="text-5xl font-black tracking-tighter mb-6">About</h1>
    <p class="text-xl text-white/60 leading-relaxed mb-6">
      This project is built with <strong class="text-white">Yawn Framework</strong> — a TypeScript-first,
      HTML-based web framework for building fast, simple sites and apps.
    </p>
    <p class="text-white/50 leading-relaxed">
      Edit <code class="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300">src/pages/about.yawn</code> to change this page.
      Add new pages by creating files in <code class="bg-white/10 px-1.5 py-0.5 rounded text-indigo-300">src/pages/</code>.
    </p>
  </div>
</template>

<script>
</script>
`;

const SERVER_TS = `import { startDevServer } from 'yawn-framework/dev-server';
import { compileSFC } from 'yawn-framework/compiler';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesDir   = join(__dirname, 'pages');
const layoutFile = join(__dirname, '_layout.yawn');
const compsDir   = join(__dirname, 'components');

function resolveComponent(name: string): string | null {
  const p = join(compsDir, name + '.yawn');
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

function renderPage(pagePath: string, title = 'Yawn App'): string {
  const pageSource = readFileSync(pagePath, 'utf8');
  const pageName   = basename(pagePath, '.yawn');

  if (existsSync(layoutFile)) {
    const { html: pageFragment } = compileSFC(pageSource, pageName, {
      fullPage: false, tailwind: false,
    });
    const layoutSource = readFileSync(layoutFile, 'utf8');
    const { html: layoutHtml } = compileSFC(layoutSource, '_layout', {
      tailwind: true, title,
    });
    return layoutHtml.replace(/\\{\\{\\s*slot\\s*\\}\\}/g, pageFragment);
  }

  const { html } = compileSFC(pageSource, pageName, { tailwind: true, title });
  return html;
}

function buildRoutes(): Record<string, { file: string; title: string }> {
  const routes: Record<string, { file: string; title: string }> = {};
  if (!existsSync(pagesDir)) return routes;
  for (const entry of readdirSync(pagesDir, { withFileTypes: true })) {
    if (!entry.isFile() || extname(entry.name) !== '.yawn' || entry.name.startsWith('_')) continue;
    const name  = basename(entry.name, '.yawn');
    const route = name === 'index' ? '/' : '/' + name;
    routes[route] = {
      file: join(pagesDir, entry.name),
      title: name.charAt(0).toUpperCase() + name.slice(1) + ' — Yawn App',
    };
  }
  return routes;
}

startDevServer({
  port: 3000,
  rootDir: join(__dirname, '..', 'public'),
  handler(pathname) {
    const routes = buildRoutes();
    const route = routes[pathname];
    if (!route) return null;
    return renderPage(route.file, route.title);
  },
});
`;


// ─── Scaffold ─────────────────────────────────────────────────────────────────

async function scaffold(targetDir, siteName) {
  const abs = resolve(targetDir);

  if (existsSync(abs) && readdirSync(abs).length > 0) {
    console.log(`\n  ⚠️  Directory "${targetDir}" already exists and is not empty.`);
    process.exit(1);
  }

  console.log(`\n  ⚡ Creating ${siteName} in ${abs}\n`);

  // Directories
  mkdirSync(join(abs, 'src', 'pages'), { recursive: true });
  mkdirSync(join(abs, 'src', 'components'), { recursive: true });
  mkdirSync(join(abs, 'public'), { recursive: true });

  // package.json
  write(join(abs, 'package.json'), JSON.stringify({
    name: siteName,
    private: true,
    type: 'module',
    scripts: { dev: 'yh dev', build: 'yh build' },
    dependencies: { 'yawn-framework': 'latest' },
    devDependencies: { tsx: 'latest', typescript: 'latest', '@types/node': 'latest' },
  }, null, 2));

  // tsconfig.json
  write(join(abs, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ESNext', module: 'NodeNext', moduleResolution: 'NodeNext',
      strict: true, skipLibCheck: true, esModuleInterop: true, outDir: './dist',
    },
    include: ['src/**/*.ts'],
  }, null, 2));

  // .gitignore
  write(join(abs, '.gitignore'), 'node_modules/\ndist/\n.env\n');

  // Layout
  write(join(abs, 'src', '_layout.yawn'), LAYOUT_YAWN);

  // Pages
  write(join(abs, 'src', 'pages', 'index.yawn'), INDEX_YAWN(siteName));
  write(join(abs, 'src', 'pages', 'about.yawn'), ABOUT_YAWN(siteName));

  // Server
  write(join(abs, 'src', 'server.ts'), SERVER_TS);

  // README
  write(join(abs, 'README.md'), `# ${siteName}

Built with [Yawn Framework](https://github.com/yazilimhubb/yawn-framework).

## Get started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Add pages

\`\`\`bash
yh create page Contact
\`\`\`

## File structure

\`\`\`
src/
  _layout.yawn        # Shared layout (nav + footer)
  pages/
    index.yawn        # Route: /
    about.yawn        # Route: /about
  components/         # Reusable components
  server.ts           # Dev server
\`\`\`
`);

  console.log('  ✓ Files created');

  // Detect package manager
  const pmArg = process.argv.find(a => a.startsWith('--pm='));
  let pm = pmArg ? pmArg.slice(5) : null;

  if (!pm) {
    // Ask whether to install
    const answer = await prompt('\n  Install dependencies now? (Y/n) ');
    if (answer.toLowerCase() === 'n') {
      printDone(targetDir, siteName, false);
      return;
    }
    pm = 'npm';
  }

  console.log(`\n  Installing with ${pm}...\n`);
  const installRes = spawnSync(pm, ['install'], { cwd: abs, stdio: 'inherit', shell: true });

  if (installRes.status !== 0) {
    console.log('\n  ⚠️  Install failed. Run manually:\n');
    printDone(targetDir, siteName, false);
  } else {
    printDone(targetDir, siteName, true);
  }
}

function printDone(targetDir, siteName, installed) {
  const isCurrentDir = targetDir === '.';
  const cdCmd = isCurrentDir ? '' : `    cd ${targetDir}\n`;
  const installCmd = installed ? '' : `    npm install\n`;
  console.log(`
  ✅ Done! Your Yawn project is ready.

${cdCmd}${installCmd}    yh dev

  Open → http://localhost:3000
`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

import { readdirSync } from 'node:fs';

async function main() {
  console.log('\n  ⚡ create-yawn — Yawn Framework project scaffolder');

  let targetDir = process.argv[2];
  let siteName;

  if (!targetDir || targetDir.startsWith('--')) {
    targetDir = await prompt('\n  Project directory (default: yawn-app): ') || 'yawn-app';
  }

  const defaultName = targetDir.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  siteName = await prompt(`  Site name (default: ${defaultName}): `) || defaultName;

  await scaffold(targetDir, siteName);
}

main().catch(err => {
  console.error('\n  Error:', err.message);
  process.exit(1);
});
