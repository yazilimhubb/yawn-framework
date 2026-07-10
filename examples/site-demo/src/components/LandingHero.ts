import { defineComponent } from '../../../../packages/core/src/index.js';

export const LandingHero = defineComponent({
  setup() {
    return {
      tag: 'section',
      attrs: { class: 'hero' },
      children: [
        {
          tag: 'div',
          attrs: { class: 'hero-card' },
          children: [
            { tag: 'h2', children: ['Yawn Framework ile web sitesi kur'] },
            { tag: 'p', children: ['Güvenli, hızlı ve modern bir kullanıcı deneyimi sunan framework.'] },
            { tag: 'a', attrs: { href: '/start', class: 'btn' }, children: ['Başla'] },
          ],
        },
        {
          tag: 'div',
          attrs: { class: 'info-grid' },
          children: [
            { tag: 'div', attrs: { class: 'info-card' }, children: ['⚡ SSR-ready'] },
            { tag: 'div', attrs: { class: 'info-card' }, children: ['🔀 SPA Router'] },
            { tag: 'div', attrs: { class: 'info-card' }, children: ['🎨 .yawn Templates'] },
            { tag: 'div', attrs: { class: 'info-card' }, children: ['🔒 XSS-safe Render'] },
          ],
        },
      ],
    };
  },
});
