import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve, extname, relative, basename, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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

    // resolve tsc binary: local node_modules first, then global
    const localTsc = join(abs, 'node_modules', '.bin', 'tsc');
    const tscBin = existsSync(localTsc) ? localTsc : 'tsc';

    const tsc = spawnSync(tscBin, ['--project', tsconfig], {
      stdio: 'inherit',
      cwd: abs,
      shell: true,
    });

    if (tsc.status !== 0) {
      return { exitCode: tsc.status ?? 1, output: 'TypeScript compilation failed.' };
    }
    return { exitCode: 0, output: `Built to ${outDir}` };
  }

  // 2. Fallback: compile .yawn files to static HTML
  const yawnFiles = collectYawnFiles(srcDir);
  if (yawnFiles.length === 0) {
    return {
      exitCode: 1,
      output: 'No tsconfig.json and no .yawn files found. Nothing to build.',
    };
  }

  mkdirSync(outDir, { recursive: true });

  // Dynamically import the compiler via tsx-compatible dynamic import
  let compileToHtml: ((src: string, opts: Record<string, unknown>) => string) | null = null;
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const compilerPath = join(__dirname, '..', '..', '..', 'compiler', 'src', 'compiler.js');
    // Use spawnSync to run a tiny Node script that does the compilation
    // This avoids ESM/CJS interop issues at CLI build time
    for (const file of yawnFiles) {
      const source = readFileSync(file, 'utf8');
      const rel = relative(srcDir, file);
      const outFile = join(outDir, rel.replace(/\.yawn$/, '.html'));
      mkdirSync(dirname(outFile), { recursive: true });

      const script = [
        `import { compileToHtml } from '${compilerPath.replace(/\\/g, '/')}';`,
        `import { readFileSync, writeFileSync } from 'node:fs';`,
        `const src = readFileSync(${JSON.stringify(file)}, 'utf8');`,
        `const html = compileToHtml(src, { title: ${JSON.stringify(basename(file, '.yawn'))} });`,
        `writeFileSync(${JSON.stringify(outFile)}, html, 'utf8');`,
        `console.log('[yawn/build] ${rel} → ${relative(abs, outFile)}');`,
      ].join('\n');

      const tmpScript = join(outDir, '__yawn_build_tmp.mjs');
      writeFileSync(tmpScript, script, 'utf8');

      const res = spawnSync(
        process.execPath,
        ['--import', 'tsx', tmpScript],
        { stdio: 'inherit', cwd: abs },
      );

      // clean up temp file
      try { require('node:fs').unlinkSync(tmpScript); } catch { /* ignore */ }

      if (res.status !== 0) {
        return { exitCode: res.status ?? 1, output: `Failed to compile ${rel}` };
      }
    }

    return { exitCode: 0, output: `Built ${yawnFiles.length} file(s) to ${outDir}` };
  } catch (err) {
    return {
      exitCode: 1,
      output: `Build error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
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
