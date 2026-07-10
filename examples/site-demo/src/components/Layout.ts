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
            { tag: 'h1', children: ['YH Framework'] },
            {
              tag: 'nav',
              attrs: { class: 'site-nav' },
              children: [
                { tag: 'a', attrs: { href: '/' }, children: ['Ana Sayfa'] },
                ' ',
                { tag: 'a', attrs: { href: '/about' }, children: ['Hakkımızda'] },
                ' ',
                { tag: 'a', attrs: { href: '/contact' }, children: ['İletişim'] },
              ],
            },
          ],
        },
        { tag: 'main', attrs: { class: 'site-main' }, children: [] },
      ],
    });
  },
});
