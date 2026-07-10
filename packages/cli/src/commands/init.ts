import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function initProject(targetDir = '.') {
  mkdirSync(targetDir, { recursive: true });
  mkdirSync(join(targetDir, 'src'), { recursive: true });

  writeFileSync(
    join(targetDir, 'package.json'),
    JSON.stringify(
      {
        name: 'yawn-app',
        private: true,
        type: 'module',
        scripts: {
          dev: 'yh dev',
        },
      },
      null,
      2,
    ),
  );

  writeFileSync(
    join(targetDir, 'src', 'main.ts'),
    `import { createApp, defineComponent } from 'yawn-framework';\n\nconst app = createApp(\n  defineComponent({\n    setup() {\n      return () => ({\n        tag: 'main',\n        attrs: { class: 'page' },\n        children: [\n          { tag: 'h1', children: ['Hello from Yawn'] },\n          { tag: 'p', children: ['This is your first Yawn app.'] },\n        ],\n      });\n    },\n  }),\n);\n\napp.mount(typeof document !== 'undefined' ? document.body : { innerHTML: '' });\n`,
  );

  return {
    exitCode: 0,
    output: `Initialized Yawn app in ${targetDir}`,
  };
}
