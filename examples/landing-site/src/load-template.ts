import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compile, compileToFragment } from '../../../packages/compiler/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Resolves a component name to its .yawn source.
 * Looks in the same dir as the calling file, then in components/.
 */
function makeResolver(baseDir: string) {
  return (name: string): string | null => {
    const tryPaths = [
      join(baseDir, `${name}.yawn`),
      join(baseDir, 'components', `${name}.yawn`),
    ];
    for (const p of tryPaths) {
      if (existsSync(p)) return readFileSync(p, 'utf8');
    }
    return null;
  };
}

/**
 * Loads a .yawn template file and renders it to an HTML fragment string.
 * Component references are resolved relative to the template's directory.
 */
export function loadTemplate(fileName: string, props: Record<string, string> = {}): string {
  const fullPath = join(__dirname, fileName);
  const source = readFileSync(fullPath, 'utf8');
  const baseDir = dirname(fullPath);

  return compileToFragment(source, {
    props,
    resolveComponent: makeResolver(baseDir),
  });
}
