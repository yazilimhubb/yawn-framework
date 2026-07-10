#!/usr/bin/env node
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve, extname, dirname } from 'node:path';
import { spawn } from 'node:child_process';

// ─── init ─────────────────────────────────────────────────────────────────────
function initProject(targetDir = '.') {
  const name = targetDir === '.' ? 'yawn-app' : targetDir.replace(/[^a-z0-9-]/gi, '-').toLowerCase();

  mkdirSync(join(targetDir, 'src', 'components'), { recursive: true });
  mkdirSync(join(targetDir, 'src', 'pages'), { recursive: true });
  mkdirSync(join(targetDir, 'public'), { recursive: true });

  // ── package.json ──────────────────────────────────────────────────────────
  writeFileSync(join(targetDir, 'package.json'), JSON.stringify({
    name,
    private: true,
    type: 'module',
    scripts: {
      dev: 'yh dev',
      build: 'yh build',
    },
    dependencies: {
      'yawn-framework': 'latest',
      '@yawn-framework/compiler': 'latest',
      '@yawn-framework/dev-server': 'latest',
      '@yawn-framework/router': 'latest',
      '@yawn-framework/reactivity': 'latest',
      '@yawn-framework/server': 'latest',
      '@yawn-framework/runtime': 'latest',
      '@yawn-framework/shared': 'latest',
    },
    devDependencies: {
      tsx: 'latest',
      typescript: 'latest',
      '@yawn-framework/devtools': 'latest',
    },
  }, null, 2));

  // ── tsconfig.json ─────────────────────────────────────────────────────────
  writeFileSync(join(targetDir, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ESNext', module: 'NodeNext', moduleResolution: 'NodeNext',
      strict: true, skipLibCheck: true, esModuleInterop: true,
    },
    include: ['src/**/*.ts'],
  }, null, 2));

  // ── src/pages/index.yawn ─────────────────────────────────────────────────
  writeFileSync(join(targetDir, 'src', 'pages', 'index.yawn'), `<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 text-white">

    <!-- Nav -->
    <nav class="flex items-center justify-between px-8 py-5 border-b border-white/10">
      <a href="/" class="text-xl font-black tracking-tight">⚡ Yawn</a>
      <div class="flex gap-6 text-sm font-medium text-white/70">
        <a href="/" class="hover:text-white transition">Home</a>
        <a href="/about" class="hover:text-white transition">About</a>
        <a href="https://github.com/yazilimhubb/yawn-framework" class="hover:text-white transition">GitHub ↗</a>
      </div>
    </nav>

    <!-- Hero -->
    <section class="max-w-4xl mx-auto text-center px-8 py-24">
      <div class="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-4 py-1.5 rounded-full mb-8 uppercase tracking-widest">
        ⚡ Yawn Framework v0.1.0
      </div>
      <h1 class="text-5xl sm:text-7xl font-black tracking-tighter mb-6 leading-none">
        Build sites fast.<br/>
        <span class="text-indigo-400">Ship faster.</span>
      </h1>
      <p class="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
        HTML-tabanlı, TypeScript destekli web framework. .yawn dosyalarıyla
        bileşen yaz, reactive state kullan, anında deploy et.
      </p>
      <div class="flex gap-4 justify-center flex-wrap">
        <a href="/about" class="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-8 py-3.5 rounded-full transition text-sm">
          Başla →
        </a>
        <a href="https://github.com/yazilimhubb/yawn-framework" class="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-3.5 rounded-full transition text-sm">
          GitHub
        </a>
      </div>
    </section>

    <!-- Counter demo -->
    <section class="max-w-sm mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 text-center mb-16">
      <p class="text-white/50 text-xs font-bold uppercase tracking-widest mb-4">Live Demo — Reactive Counter</p>
      <div class="text-6xl font-black mb-6 tabular-nums">{{ count }}</div>
      <div class="flex gap-3 justify-center">
        <button @click="count--" class="bg-white/10 hover:bg-white/20 w-12 h-12 rounded-full text-xl font-bold transition">−</button>
        <button @click="count = 0" class="bg-white/10 hover:bg-white/20 px-5 h-12 rounded-full text-sm font-bold transition">Reset</button>
        <button @click="count++" class="bg-indigo-500 hover:bg-indigo-400 w-12 h-12 rounded-full text-xl font-bold transition">+</button>
      </div>
      <p :if="count > 9" class="mt-4 text-green-400 text-sm font-semibold">🎉 10'u geçtin!</p>
      <p :if="count < 0" class="mt-4 text-red-400 text-sm font-semibold">⚠️ Negatif!</p>
    </section>

    <!-- Features -->
    <section class="max-w-5xl mx-auto px-8 pb-24">
      <h2 class="text-center text-3xl font-black mb-12">Neden Yawn?</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
          <div class="text-3xl mb-3">📄</div>
          <h3 class="font-bold mb-2">.yawn Templates</h3>
          <p class="text-white/50 text-sm leading-relaxed">HTML-like single file components. Template + Script + Style tek dosyada.</p>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
          <div class="text-3xl mb-3">⚡</div>
          <h3 class="font-bold mb-2">Reactive State</h3>
          <p class="text-white/50 text-sm leading-relaxed">{{ binding }}, @click, :if, :each — JS framework bilmeden reaktif UI.</p>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
          <div class="text-3xl mb-3">🎨</div>
          <h3 class="font-bold mb-2">Tailwind Built-in</h3>
          <p class="text-white/50 text-sm leading-relaxed">Tailwind CSS otomatik dahil. Utility classes direkt kullan.</p>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
          <div class="text-3xl mb-3">🔀</div>
          <h3 class="font-bold mb-2">Router</h3>
          <p class="text-white/50 text-sm leading-relaxed">File-based routing. src/pages/ klasörü = URL yapısı.</p>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
          <div class="text-3xl mb-3">🖥️</div>
          <h3 class="font-bold mb-2">SSR Ready</h3>
          <p class="text-white/50 text-sm leading-relaxed">Server-side rendering + client hydration. SEO friendly.</p>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
          <div class="text-3xl mb-3">🛠️</div>
          <h3 class="font-bold mb-2">CLI</h3>
          <p class="text-white/50 text-sm leading-relaxed">yh init, yh dev, yh build. Tek komutla başla.</p>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-white/10 text-center py-8 text-white/30 text-sm">
      Built with ⚡ <a href="https://github.com/yazilimhubb/yawn-framework" class="text-indigo-400 hover:text-indigo-300">Yawn Framework</a>
    </footer>

  </div>
</template>

<script>
  let count = 0;
</script>
`);

  // ── src/pages/about.yawn ─────────────────────────────────────────────────
  writeFileSync(join(targetDir, 'src', 'pages', 'about.yawn'), `<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-900 text-white">

    <nav class="flex items-center justify-between px-8 py-5 border-b border-white/10">
      <a href="/" class="text-xl font-black tracking-tight">⚡ Yawn</a>
      <div class="flex gap-6 text-sm font-medium text-white/70">
        <a href="/" class="hover:text-white transition">Home</a>
        <a href="/about" class="text-white font-bold">About</a>
        <a href="https://github.com/yazilimhubb/yawn-framework" class="hover:text-white transition">GitHub ↗</a>
      </div>
    </nav>

    <main class="max-w-2xl mx-auto px-8 py-20">
      <h1 class="text-4xl font-black mb-6">About Yawn</h1>
      <p class="text-white/60 text-lg leading-relaxed mb-4">
        Yawn, HTML-tabanlı modern web siteleri oluşturmak için sıfırdan yazılmış TypeScript framework'üdür.
      </p>
      <p class="text-white/60 text-lg leading-relaxed mb-8">
        .yawn single file component formatı ile template, script ve style tek dosyada birleşir.
        Tailwind CSS built-in, reactive state proxy tabanlı, SSR destekli.
      </p>
      <a href="/" class="bg-indigo-500 hover:bg-indigo-400 text-white font-bold px-6 py-3 rounded-full transition text-sm inline-block">
        ← Back to Home
      </a>
    </main>

  </div>
</template>

<script>
</script>
`);

  // ── src/server.ts ─────────────────────────────────────────────────────────
  writeFileSync(join(targetDir, 'src', 'server.ts'), `import { startDevServer } from '@yawn-framework/dev-server';
import { compileSFC } from '@yawn-framework/compiler';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesDir = join(__dirname, 'pages');

/** Map pathname → page .yawn file */
const routes: Record<string, string> = {
  '/':       join(pagesDir, 'index.yawn'),
  '/about':  join(pagesDir, 'about.yawn'),
};

function renderRoute(pathname: string): string | null {
  const pagePath = routes[pathname];
  if (!pagePath || !existsSync(pagePath)) return null;
  const source = readFileSync(pagePath, 'utf8');
  const name = basename(pagePath, '.yawn');
  const { html } = compileSFC(source, name, { tailwind: true, title: 'Yawn App' });
  return html;
}

startDevServer({
  port: 3000,
  rootDir: join(__dirname, '..', 'public'),
  handler(pathname) {
    return renderRoute(pathname);
  },
});
`);

  return {
    exitCode: 0,
    output: [
      ``,
      `  ⚡ Created ${name}`,
      ``,
      `  Next steps:`,
      `    cd ${targetDir}`,
      `    npm install`,
      `    yh dev`,
      ``,
      `  Then open http://localhost:3000`,
      ``,
    ].join('\n'),
  };
}

  // ── package.json ──────────────────────────────────────────────────────────
  writeFileSync(join(targetDir, 'package.json'), JSON.stringify({
    name,
    private: true,
    type: 'module',
    scripts: {
      dev: 'yh dev',
      build: 'yh build',
    },
    dependencies: {
      'yawn-framework': 'latest',
      '@yawn-framework/compiler': 'latest',
      '@yawn-framework/dev-server': 'latest',
      '@yawn-framework/router': 'latest',
      '@yawn-framework/reactivity': 'latest',
      '@yawn-framework/server': 'latest',
      '@yawn-framework/runtime': 'latest',
      '@yawn-framework/shared': 'latest',
    },
    devDependencies: {
      tsx: 'latest',
      typescript: 'latest',
      '@yawn-framework/devtools': 'latest',
    },
  }, null, 2));

  // ── tsconfig.json ─────────────────────────────────────────────────────────
  writeFileSync(join(targetDir, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ESNext',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
    },
    include: ['src/**/*.ts'],
  }, null, 2));

  // ── public/style.css ──────────────────────────────────────────────────────
  writeFileSync(join(targetDir, 'public', 'style.css'), `
/* ── Reset & base ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #f8fafc;
  --surface: #ffffff;
  --border: #e2e8f0;
  --text: #0f172a;
  --muted: #64748b;
  --primary: #4f46e5;
  --primary-hover: #4338ca;
  --radius: 16px;
  --shadow: 0 4px 24px rgba(15,23,42,0.08);
  font-family: Inter, system-ui, -apple-system, sans-serif;
  color-scheme: light;
}

body {
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

/* ── Layout ── */
.site-wrap { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem; }

/* ── Nav ── */
.site-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 3rem;
}

.site-nav .logo {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text);
  text-decoration: none;
  letter-spacing: -0.02em;
}

.site-nav .logo span { color: var(--primary); }

.nav-links { display: flex; gap: 1.5rem; }
.nav-links a {
  color: var(--muted);
  text-decoration: none;
  font-weight: 500;
  transition: color .15s;
}
.nav-links a:hover { color: var(--primary); }

/* ── Hero ── */
.hero {
  text-align: center;
  padding: 4rem 0 3rem;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: #ede9fe;
  color: var(--primary);
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.3rem 0.9rem;
  border-radius: 999px;
  margin-bottom: 1.5rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero h1 {
  font-size: clamp(2.2rem, 5vw, 3.5rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 1.25rem;
  background: linear-gradient(135deg, var(--text) 40%, var(--primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero p {
  font-size: 1.2rem;
  color: var(--muted);
  max-width: 560px;
  margin: 0 auto 2rem;
  line-height: 1.7;
}

.hero-actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  transition: all .15s;
  cursor: pointer;
  border: none;
}

.btn-primary { background: var(--primary); color: #fff; }
.btn-primary:hover { background: var(--primary-hover); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(79,70,229,.35); }

.btn-outline { background: transparent; color: var(--text); border: 1.5px solid var(--border); }
.btn-outline:hover { border-color: var(--primary); color: var(--primary); }

/* ── Feature cards ── */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin: 4rem 0;
}

.feature-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
  box-shadow: var(--shadow);
  transition: transform .15s, box-shadow .15s;
}

.feature-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(15,23,42,0.12); }

.feature-icon { font-size: 1.8rem; margin-bottom: 0.75rem; }
.feature-card h3 { font-size: 1rem; font-weight: 700; margin-bottom: 0.4rem; }
.feature-card p { font-size: 0.875rem; color: var(--muted); line-height: 1.6; }

/* ── Code block ── */
.code-block {
  background: #0f172a;
  color: #e2e8f0;
  border-radius: var(--radius);
  padding: 1.5rem 2rem;
  font-family: 'Fira Code', 'Cascadia Code', monospace;
  font-size: 0.9rem;
  overflow-x: auto;
  margin: 2rem 0;
}

.code-block .comment { color: #64748b; }
.code-block .keyword { color: #a78bfa; }
.code-block .string { color: #34d399; }
.code-block .fn { color: #60a5fa; }

/* ── Footer ── */
.site-footer {
  border-top: 1px solid var(--border);
  padding: 2rem 0;
  margin-top: 4rem;
  text-align: center;
  color: var(--muted);
  font-size: 0.875rem;
}

.site-footer a { color: var(--primary); text-decoration: none; }
`.trim());

  // ── src/components/Nav.yawn ───────────────────────────────────────────────
  writeFileSync(join(targetDir, 'src', 'components', 'Nav.yawn'), `<nav class="site-nav">
  <a href="/" class="logo">⚡ <span>Yawn</span></a>
  <div class="nav-links">
    <a href="/">Home</a>
    <a href="/about">About</a>
    <a href="https://github.com/yazilimhubb/yawn-framework">GitHub</a>
  </div>
</nav>`);

  // ── src/components/Hero.yawn ──────────────────────────────────────────────
  writeFileSync(join(targetDir, 'src', 'components', 'Hero.yawn'), `<section class="hero">
  <div class="hero-badge">⚡ New — v0.1.0</div>
  <h1>{{title}}</h1>
  <p>{{subtitle}}</p>
  <div class="hero-actions">
    <a href="{{href}}" class="btn btn-primary">{{cta}}</a>
    <a href="https://github.com/yazilimhubb/yawn-framework" class="btn btn-outline">GitHub →</a>
  </div>
</section>`);

  // ── src/components/FeatureCard.yawn ───────────────────────────────────────
  writeFileSync(join(targetDir, 'src', 'components', 'FeatureCard.yawn'), `<div class="feature-card">
  <div class="feature-icon">{{icon}}</div>
  <h3>{{title}}</h3>
  <p>{{body}}</p>
</div>`);

  // ── src/components/Footer.yawn ────────────────────────────────────────────
  writeFileSync(join(targetDir, 'src', 'components', 'Footer.yawn'), `<footer class="site-footer">
  <p>Built with <a href="https://github.com/yazilimhubb/yawn-framework">⚡ Yawn Framework</a></p>
</footer>`);

  // ── src/pages/home.yawn ───────────────────────────────────────────────────
  writeFileSync(join(targetDir, 'src', 'pages', 'home.yawn'), `<div>
  <Nav />
  <div class="site-wrap">
    <Hero
      title="Build fast HTML sites with Yawn ⚡"
      subtitle="A TypeScript-first framework with .yawn templates, signals, routing and SSR. Zero dependencies."
      href="/about"
      cta="Get started →"
    />
    <div class="features">
      <FeatureCard icon="📄" title=".yawn Templates" body="HTML-like template format with component composition and prop interpolation." />
      <FeatureCard icon="⚡" title="Signals" body="Reactive primitives — signal, computed, effect, watch. Auto re-render on change." />
      <FeatureCard icon="🔀" title="Router" body="Client-side router with dynamic params, navigation guards and RouterLink." />
      <FeatureCard icon="🖥️" title="SSR Ready" body="Render to HTML string server-side. Full hydration support on the client." />
      <FeatureCard icon="🛠️" title="CLI" body="Scaffold projects, create components and start the dev server in one command." />
      <FeatureCard icon="📦" title="10 Packages" body="Modular architecture. Use only what you need." />
    </div>
  </div>
  <Footer />
</div>`);

  // ── src/pages/about.yawn ─────────────────────────────────────────────────
  writeFileSync(join(targetDir, 'src', 'pages', 'about.yawn'), `<div>
  <Nav />
  <div class="site-wrap">
    <section class="hero">
      <h1>About Yawn Framework</h1>
      <p>Yawn is a small, from-scratch TypeScript web framework built for simplicity and speed.</p>
    </section>
  </div>
  <Footer />
</div>`);

  // ── src/server.ts ─────────────────────────────────────────────────────────
  writeFileSync(join(targetDir, 'src', 'server.ts'), `import { startDevServer } from '@yawn-framework/dev-server';
import { compileToHtml } from '@yawn-framework/compiler';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** Resolve a component name → .yawn source */
function resolver(name: string): string | null {
  const p = join(__dirname, 'components', name + '.yawn');
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

/** Read a page template and compile it to a full HTML document */
function renderPage(pageName: string, title: string): string {
  const pagePath = join(__dirname, 'pages', pageName + '.yawn');
  if (!existsSync(pagePath)) return renderNotFound();
  const src = readFileSync(pagePath, 'utf8');
  const css = readFileSync(join(__dirname, '..', 'public', 'style.css'), 'utf8');
  return compileToHtml(src, {
    title,
    resolveComponent: resolver,
  }).replace('</head>', \`  <style>\${css}</style>\\n</head>\`);
}

function renderNotFound(): string {
  return \`<!doctype html><html><body style="font-family:system-ui;text-align:center;padding:4rem"><h1>404</h1><p>Page not found.</p><a href="/">← Home</a></body></html>\`;
}

const routes: Record<string, { page: string; title: string }> = {
  '/':       { page: 'home',  title: 'Yawn App' },
  '/about':  { page: 'about', title: 'About — Yawn App' },
};

startDevServer({
  port: 3000,
  rootDir: join(__dirname, '..', 'public'),
  handler(pathname) {
    const route = routes[pathname];
    if (!route) return null;
    return renderPage(route.page, route.title);
  },
});
`);

  return {
    exitCode: 0,
    output: [
      ``,
      `  ⚡ Created ${name}`,
      ``,
      `  Next steps:`,
      `    cd ${targetDir}`,
      `    npm install`,
      `    yh dev`,
      ``,
      `  Then open http://localhost:3000`,
      ``,
    ].join('\n'),
  };
}

// ─── dev ──────────────────────────────────────────────────────────────────────
function runDev(targetDir = '.') {
  const abs = resolve(targetDir);
  const candidates = [
    join(abs, 'src', 'server.ts'),
    join(abs, 'src', 'main.ts'),
    join(abs, 'src', 'server.js'),
    join(abs, 'src', 'main.js'),
  ];
  const entryFile = candidates.find(f => existsSync(f)) ?? null;

  if (!entryFile) {
    return { exitCode: 1, output: `No entry file found in ${abs}/src\nCreate src/server.ts to get started.` };
  }

  console.log(`\n  🟢 Starting → ${entryFile}\n`);

  // try tsx first, fall back to node directly for .js files
  const isTs = entryFile.endsWith('.ts');
  const nodeArgs = isTs ? ['--import', 'tsx', entryFile] : [entryFile];

  const child = spawn(process.execPath, nodeArgs, {
    stdio: 'inherit',
    cwd: abs,
    env: { ...process.env, NODE_ENV: 'development' },
  });

  child.on('error', (err) => {
    if (err.message.includes('tsx')) {
      console.error('\n  tsx not found. Install it: npm install -D tsx\n');
    } else {
      console.error(`\n  Error: ${err.message}\n`);
    }
    process.exit(1);
  });

  child.on('exit', code => process.exit(code ?? 0));
  process.on('SIGINT', () => child.kill('SIGINT'));
  process.on('SIGTERM', () => child.kill('SIGTERM'));

  return { exitCode: 0, output: '' };
}

// ─── build ────────────────────────────────────────────────────────────────────
import { spawnSync } from 'node:child_process';

function buildProject(targetDir = '.') {
  const abs = resolve(targetDir);
  const tsconfig = join(abs, 'tsconfig.json');

  if (existsSync(tsconfig)) {
    console.log('[yawn] Running tsc...');
    const localTsc = join(abs, 'node_modules', '.bin', 'tsc');
    const tscBin = existsSync(localTsc) ? localTsc : 'tsc';
    const res = spawnSync(tscBin, ['--project', tsconfig], { stdio: 'inherit', cwd: abs, shell: true });
    return { exitCode: res.status ?? 0, output: res.status === 0 ? 'Built successfully.' : 'Build failed.' };
  }

  return { exitCode: 1, output: 'No tsconfig.json found. Add one to enable build.' };
}

// ─── create ───────────────────────────────────────────────────────────────────
function createResource(type, name, targetDir = '.') {
  if (!type) return { exitCode: 1, output: 'Usage: yh create <component|site> <name> [dir]' };

  if (type === 'component') {
    if (!name) return { exitCode: 1, output: 'Usage: yh create component <Name> [dir]' };
    const dir = join(targetDir, 'src', 'components');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, `${name}.yawn`);
    writeFileSync(file, [
      `<section class="${name.toLowerCase()}">`,
      `  <h2>{{title}}</h2>`,
      `  <p>{{subtitle}}</p>`,
      `  <a href="{{href}}">{{cta}}</a>`,
      `</section>`,
    ].join('\n'));
    return { exitCode: 0, output: `Created ${file}` };
  }

  if (type === 'site' && (name === 'landing' || !name)) {
    mkdirSync(join(targetDir, 'src', 'components'), { recursive: true });
    writeFileSync(join(targetDir, 'package.json'), JSON.stringify({
      name: 'yawn-landing', private: true, type: 'module',
      scripts: { dev: 'yh dev' },
      dependencies: { 'yawn-framework': 'latest', '@yawn-framework/compiler': 'latest', '@yawn-framework/dev-server': 'latest' },
      devDependencies: { tsx: 'latest' },
    }, null, 2));
    writeFileSync(join(targetDir, 'src', 'page.yawn'),
      '<main>\n  <Hero title="Hello from Yawn" subtitle="A fast, simple site." href="/start" cta="Start" />\n</main>');
    writeFileSync(join(targetDir, 'src', 'components', 'Hero.yawn'),
      '<section class="hero">\n  <h1>{{title}}</h1>\n  <p>{{subtitle}}</p>\n  <a href="{{href}}">{{cta}}</a>\n</section>');
    return { exitCode: 0, output: `Created landing site in ${targetDir}` };
  }

  return { exitCode: 1, output: `Unknown: yh create ${type} ${name ?? ''}` };
}

// ─── insert ───────────────────────────────────────────────────────────────────
function insertComponent(filePath, compName, propsRaw = []) {
  if (!filePath || !compName) return { exitCode: 1, output: 'Usage: yh insert <file> <Component> [key=val ...]' };
  if (!existsSync(filePath)) return { exitCode: 1, output: `File not found: ${filePath}` };

  let content = readFileSync(filePath, 'utf8');
  const propsText = propsRaw.map(p => {
    const [k, ...v] = p.split('=');
    return `${k}="${v.join('=')}"`;
  }).join(' ');

  const tag = `<con:${compName}${propsText ? ' ' + propsText : ''} />`;
  content = content.includes('</main>')
    ? content.replace('</main>', `  ${tag}\n</main>`)
    : content + '\n' + tag + '\n';

  writeFileSync(filePath, content, 'utf8');
  return { exitCode: 0, output: `Inserted ${tag} into ${filePath}` };
}

// ─── help ─────────────────────────────────────────────────────────────────────
function showHelp() {
  return { exitCode: 0, output: `
  ⚡ Yawn Framework CLI v0.1.0

  Usage: yh <command> [options]

  Commands:
    init [dir]                    Create a new Yawn app
    dev [dir]                     Start the development server
    build [dir]                   Build the project
    create component <Name> [dir] Scaffold a .yawn component
    create site landing [dir]     Scaffold a landing site
    insert <file> <Name> [props]  Insert a component into a .yawn file
    help                          Show this help message

  Examples:
    yh init my-site
    yh dev .
    yh create component Hero .
    yh insert src/page.yawn Hero title="Hello"
` };
}

// ─── router ───────────────────────────────────────────────────────────────────
const [,, command, ...rest] = process.argv;

let result;
switch (command) {
  case 'init':   result = initProject(rest[0] ?? '.'); break;
  case 'dev':    result = runDev(rest[0] ?? '.'); break;
  case 'build':  result = buildProject(rest[0] ?? '.'); break;
  case 'create': result = createResource(rest[0], rest[1], rest[2] ?? '.'); break;
  case 'insert': result = insertComponent(rest[0], rest[1], rest.slice(2)); break;
  case 'help':
  case undefined: result = showHelp(); break;
  default: result = { exitCode: 1, output: `Unknown command: ${command}\nRun "yh help" for usage.` };
}

if (result.output) console.log(result.output);
if (result.exitCode !== 0) process.exit(result.exitCode);
