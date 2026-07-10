import { startDevServer } from '../../../packages/dev-server/src/index.js';
import { compileSFC } from '../../../packages/compiler/src/index.js';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesDir = join(__dirname, 'pages');

const routes: Record<string, string> = {
  '/':      join(pagesDir, 'index.yawn'),
  '/about': join(pagesDir, 'about.yawn'),
};

function renderRoute(pathname: string): string | null {
  const pagePath = routes[pathname];
  if (!pagePath || !existsSync(pagePath)) return null;
  const source = readFileSync(pagePath, 'utf8');
  const name = basename(pagePath, '.yawn');
  const { html } = compileSFC(source, name, { tailwind: true, title: 'Yawn Framework' });
  return html;
}

startDevServer({
  port: 3001,
  rootDir: __dirname,
  handler(pathname) {
    return renderRoute(pathname);
  },
});
