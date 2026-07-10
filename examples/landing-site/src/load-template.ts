import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compileYawnTemplate } from '../../../packages/core/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderNode(node: any, baseDir: string): string {
  if (typeof node === 'string') return escapeHtml(node);
  const tag = node.tag;
  const attrs = node.attrs ?? {};

  // Component resolution: support `Tag` (PascalCase) and `con:Tag` shorthand
  let compName: string | null = null;
  if (tag.startsWith('con:')) {
    compName = tag.split(':')[1];
  } else if (/^[A-Z]/.test(tag)) {
    compName = tag;
  }

  if (compName) {
    const tryPaths = [join(baseDir, `${compName}.yawn`), join(baseDir, 'components', `${compName}.yawn`)];
    for (const compPath of tryPaths) {
      if (existsSync(compPath)) {
        const src = readFileSync(compPath, 'utf8');
        let compHtml = renderTemplateToHtml(src, baseDir);
        // simple interpolation of {{prop}}
        for (const [k, v] of Object.entries(attrs)) {
          compHtml = compHtml.split(`{{${k}}}`).join(String(v));
        }
        return compHtml;
      }
    }
  }

  const attrText = Object.entries(attrs).map(([k, v]) => ` ${k}="${escapeHtml(v)}"`).join('');
  const childHtml = (node.children ?? []).map((c: any) => renderNode(c, baseDir)).join('');
  return `<${tag}${attrText}>${childHtml}</${tag}>`;
}

function renderTemplateToHtml(source: string, baseDir: string) {
  const compiled = compileYawnTemplate(source);
  return renderNode(compiled, baseDir);
}

export function loadTemplate(fileName: string): string {
  const full = join(__dirname, fileName);
  const source = readFileSync(full, 'utf8');
  return renderTemplateToHtml(source, __dirname);
}
