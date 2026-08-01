import { startDevServer } from '@yawn-framework/dev-server';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileToFragment } from '@yawn-framework/compiler';

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolve(name: string): string | null {
  const p = join(__dirname, 'components', name + '.yawn');
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

function existsSync(p: string) {
  try { readFileSync(p); return true; } catch { return false; }
}

startDevServer({
  port: 3000,
  rootDir: __dirname,
  handler(pathname) {
    if (pathname !== '/') return null;
    const src = readFileSync(join(__dirname, 'page.yawn'), 'utf8');
    const body = compileToFragment(src, { resolveComponent: resolve });
    return `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Yawn App</title></head><body>${body}</body></html>`;
  },
});