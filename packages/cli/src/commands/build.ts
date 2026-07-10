import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve, extname, relative, basename } from 'node:path';
import { spawnSync } from 'node:child_process';

export function buildProject(targetDir = '.') {
  const abs = resolve(targetDir);
  const srcDir = join(abs, 'src');
  const outDir = join(abs, 'dist');

  if (!existsSync(srcDir)) {
    return { exitCode: 1, output: `No src/ directory found in ${abs}` };
  }

  // 1. Try tsc if tsconfig.json exists
  const tsconfig = join(abs, 'tsconfig.json');
  if (existsSync(tsconfig)) {
    console.log('[yawn/build] Running tsc...');
    const tsc = spawnSync(
      process.execPath,
      [join(abs, 'node_modules', '.bin', 'tsc'), '--project', tsconfig],
      { stdio: 'inherit', cwd: abs },
    );
    if (tsc.status !== 0) {
      return { exitCode: tsc.status ?? 1, output: 'TypeScript compilation failed.' };
    }
    return { exitCode: 0, output: `Built to ${outDir}` };
  }

  // 2. Fallback: compile .yawn files to static HTML using the compiler
  const yawnFiles = collectYawnFiles(srcDir);
  if (yawnFiles.length === 0) {
    return { exitCode: 1, output: 'No tsconfig.json and no .yawn files found. Nothing to build.' };
  }

  mkdirSync(outDir, { recursive: true });

  // dynamic import of compiler (avoids circular dep at startup)
  let compile: ((src: string, opts: Record<string, unknown>) => { toString(): string }) | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('../../compiler/src/compiler.js') as { compileToHtml: typeof compile };
    compile = mod.compileToHtml;
  } catch {
    return {
      exitCode: 1,
      output: 'Compiler not available. Run `npm install` in the workspace first.',
    };
  }

  for (const file of yawnFiles) {
    const source = readFileSync(file, 'utf8');
    const rel = relative(srcDir, file);
    const outFile = join(outDir, rel.replace(/\.yawn$/, '.html'));
    mkdirSync(join(outDir, relative(srcDir, join(file, '..'))), { recursive: true });
    const html = compile!(source, { title: basename(file, '.yawn') });
    writeFileSync(outFile, String(html), 'utf8');
    console.log(`[yawn/build] ${rel} → ${relative(abs, outFile)}`);
  }

  return { exitCode: 0, output: `Built ${yawnFiles.length} file(s) to ${outDir}` };
}

function collectYawnFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectYawnFiles(full));
    } else if (extname(entry.name) === '.yawn') {
      results.push(full);
    }
  }
  return results;
}
