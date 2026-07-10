import { defineComponent } from '../../../../packages/core/src/index.js';

export const LandingHero = defineComponent({
  setup() {
    return () => ({
      tag: 'section',
      attrs: { class: 'hero' },
      children: [
        {
          tag: 'div',
          attrs: { class: 'hero-card' },
          children: [
            { tag: 'h2', children: ['YH Framework ile web sitesi kur'] },
            { tag: 'p', children: ['Güvenli, hızlı ve modern bir kullanıcı deneyimi sunan framework.'] },
            { tag: 'button', attrs: { type: 'button' }, children: ['Başla'] },
          ],
        },
        {
          tag: 'div',
          attrs: { class: 'info-grid' },
          children: [
            { tag: 'div', attrs: { class: 'info-card' }, children: ['SSR-ready altyapı'] },
            { tag: 'div', attrs: { class: 'info-card' }, children: ['SPA navigasyon'] },
            { tag: 'div', attrs: { class: 'info-card' }, children: ['CSS ile stil desteği'] },
            { tag: 'div', attrs: { class: 'info-card' }, children: ['Güvenli render'] },
          ],
        },
      ],
    });
  },
});
