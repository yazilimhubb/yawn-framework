import { defineComponent } from '../../../../packages/core/src/index.js';

export const Layout = defineComponent({
  setup() {
    return () => ({
      tag: 'div',
      attrs: { class: 'site-shell' },
      children: [
        {
          tag: 'header',
          attrs: { class: 'site-header' },
          children: [
            { tag: 'strong', children: ['YH Framework'] },
            {
              tag: 'nav',
              attrs: { class: 'site-nav' },
              children: [
                { tag: 'a', attrs: { href: '/' }, children: ['Ana Sayfa'] },
                { tag: 'a', attrs: { href: '/about' }, children: ['Hakkında'] },
              ],
            },
          ],
        },
        { tag: 'section', attrs: { class: 'content' }, children: [] },
      ],
    });
  },
});
