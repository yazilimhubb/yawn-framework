import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function createResource(type: string | undefined, name: string | undefined, targetDir = '.') {
  if (!type) {
    return { exitCode: 1, output: 'Usage: yh create <type> <name> [dir]\nTypes: component, site' };
  }

  if (type === 'component') {
    if (!name) return { exitCode: 1, output: 'Usage: yh create component <Name> [dir]' };
    const compDir = join(targetDir, 'src', 'components');
    mkdirSync(compDir, { recursive: true });
    const file = join(compDir, `${name}.yawn`);
    writeFileSync(
      file,
      `<section class=\"${name.toLowerCase()}\">\n  <h2>{{title}}</h2>\n  <p>{{subtitle}}</p>\n  <a href=\"{{href}}\">{{cta}}</a>\n</section>\n`,
    );
    return { exitCode: 0, output: `Created component ${file}` };
  }

  if (type === 'site') {
    // support 'landing' site
    const template = name ?? 'landing';
    if (template === 'landing') {
      const base = targetDir;
      mkdirSync(join(base, 'src', 'components'), { recursive: true });
      writeFileSync(join(base, 'package.json'), JSON.stringify({ name: 'yawn-landing', private: true, type: 'module', scripts: { dev: 'yh dev' } }, null, 2));
      writeFileSync(join(base, 'src', 'page.yawn'), `<main>\n  <Hero title=\"Hello from Yawn\" subtitle=\"Simple landing\" href=\"/start\" cta=\"Start\" />\n</main>\n`);
      writeFileSync(join(base, 'src', 'components', 'Hero.yawn'), `<section class=\"hero\">\n  <h1>{{title}}</h1>\n  <p>{{subtitle}}</p>\n  <a href=\"{{href}}\">{{cta}}</a>\n</section>\n`);
      writeFileSync(join(base, 'src', 'server.ts'), `import { createServer } from 'node:http';\nimport { loadTemplate } from './load-template.ts';\nconst html = loadTemplate('page.yawn');\nconst server = createServer((_, res) => { res.writeHead(200, {'Content-Type':'text/html'}); res.end(html); });\nserver.listen(3000, ()=>console.log('running'));\n`);
      return { exitCode: 0, output: `Created landing site at ${targetDir}` };
    }

    return { exitCode: 1, output: `Unknown site template: ${template}` };
  }

  return { exitCode: 1, output: `Unknown resource type: ${type}` };
}
