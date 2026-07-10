import { defineComponent } from '../../../../packages/core/src/index.js';
import type { ComponentRenderResult } from '../../../../packages/core/src/index.js';

export const Layout = defineComponent({
  setup(props: { slot?: ComponentRenderResult }) {
    return {
      tag: 'div',
      attrs: { class: 'site-shell' },
      children: [
        {
          tag: 'header',
          attrs: { class: 'site-header' },
          children: [
            { tag: 'strong', attrs: { class: 'logo' }, children: ['⚡ Yawn'] },
            {
              tag: 'nav',
              attrs: { class: 'site-nav' },
              children: [
                { tag: 'a', attrs: { href: '/' }, children: ['Ana Sayfa'] },
                { tag: 'a', attrs: { href: '/about' }, children: ['Hakkımızda'] },
                { tag: 'a', attrs: { href: '/contact' }, children: ['İletişim'] },
              ],
            },
          ],
        },
        {
          tag: 'main',
          attrs: { class: 'site-main', 'data-yawn-root': '' },
          children: props.slot ? [props.slot] : [],
        },
        {
          tag: 'footer',
          attrs: { class: 'site-footer' },
          children: ['© 2026 Yawn Framework'],
        },
      ],
    };
  },
});
