import { startDevServer } from '../../../packages/dev-server/src/index.js';
import { compileSFC } from '../../../packages/compiler/src/index.js';
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

function renderPage(pagePath: string, title = 'Yawn Framework'): string {
  const pageSource = readFileSync(pagePath, 'utf8');
  const pageName   = basename(pagePath, '.yawn');

  if (existsSync(layoutFile)) {
    const { html: fragment } = compileSFC(pageSource, pageName, {
      fullPage: false, tailwind: false, resolveComponent,
    });
    const layoutSrc = readFileSync(layoutFile, 'utf8');
    const { html } = compileSFC(layoutSrc, '_layout', {
      tailwind: true, title, resolveComponent,
    });
    return html.replace(/\{\{\s*slot\s*\}\}/g, fragment);
  }

  const { html } = compileSFC(pageSource, pageName, { tailwind: true, title, resolveComponent });
  return html;
}

function buildRoutes(): Record<string, { file: string; title: string }> {
  const routes: Record<string, { file: string; title: string }> = {};
  if (!existsSync(pagesDir)) return routes;
  for (const e of readdirSync(pagesDir, { withFileTypes: true })) {
    if (!e.isFile() || extname(e.name) !== '.yawn' || e.name.startsWith('_')) continue;
    const name  = basename(e.name, '.yawn');
    const route = name === 'index' ? '/' : '/' + name;
    const titles: Record<string, string> = {
      index: 'Yawn Framework — Build sites fast',
      docs:  'Docs — Yawn Framework',
    };
    routes[route] = { file: join(pagesDir, e.name), title: titles[name] ?? name + ' — Yawn Framework' };
  }
  return routes;
}

startDevServer({
  port: 3001,
  rootDir: join(__dirname, '..', 'public'),
  handler(pathname) {
    const routes = buildRoutes();
    const route  = routes[pathname];
    if (!route) return null;
    return renderPage(route.file, route.title);
  },
});
