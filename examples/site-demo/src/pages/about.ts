import { defineComponent } from '../../../../packages/core/src/index.js';

export const AboutPage = defineComponent({
  setup() {
    return {
      tag: 'section',
      attrs: { class: 'page' },
      children: [
        { tag: 'h2', children: ['Hakkımızda'] },
        { tag: 'p', children: ['Yawn Framework, HTML-tabanlı modern web siteleri oluşturmak için tasarlanmış TypeScript framework\'üdür.'] },
        { tag: 'p', children: ['Sıfırdan yazılmış, bağımlılık olmadan çalışır.'] },
        {
          tag: 'ul',
          children: [
            { tag: 'li', children: ['⚡ .yawn template formatı'] },
            { tag: 'li', children: ['🔀 Client-side router'] },
            { tag: 'li', children: ['📦 10 paket, sıfır bağımlılık'] },
          ],
        },
      ],
    };
  },
});
