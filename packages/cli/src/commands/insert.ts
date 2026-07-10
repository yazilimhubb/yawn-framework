import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function insertComponent(filePath: string | undefined, compName: string | undefined, propsRaw: string[] = []) {
  if (!filePath || !compName) return { exitCode: 1, output: 'Usage: yh insert <file> <ComponentName> [key=val ...]' };
  const full = filePath;
  let content = '';
  try {
    content = readFileSync(full, 'utf8');
  } catch (e) {
    return { exitCode: 1, output: `Cannot read file: ${full}` };
  }

  const propsPairs = propsRaw.map((p) => {
    const [k, ...rest] = p.split('=');
    const v = rest.join('=') ?? '';
    return { k, v };
  });
  const propsText = propsPairs.map(p => `${p.k}="${p.v}"`).join(' ');
  const tag = `<con:${compName} ${propsText} />`;

  // naive insertion: place before closing </main> if exists
  if (content.includes('</main>')) {
    content = content.replace('</main>', `  ${tag}\n</main>`);
  } else {
    content = content + '\n' + tag + '\n';
  }

  writeFileSync(full, content, 'utf8');
  return { exitCode: 0, output: `Inserted ${tag} into ${full}` };
}
