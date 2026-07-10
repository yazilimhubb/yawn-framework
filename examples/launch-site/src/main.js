import { createApp, defineComponent } from '../../../packages/core/src/index.js';

const app = createApp(
  defineComponent({
    setup() {
      return () => ({
        tag: 'div',
        attrs: { class: 'launch-shell' },
        children: [
          {
            tag: 'style',
            children: [
              `:root{color-scheme:dark;font-family:Inter,system-ui,sans-serif;} body{margin:0;background:radial-gradient(circle at top,#111827,#030712);color:#f9fafb;} .launch-shell{min-height:100vh;display:grid;place-items:center;padding:2rem;} .card{max-width:980px;padding:2rem 2.5rem;border:1px solid rgba(255,255,255,.12);border-radius:24px;background:rgba(17,24,39,.82);box-shadow:0 25px 60px rgba(0,0,0,.35);} .hero{display:grid;grid-template-columns:1.2fr .8fr;gap:1.5rem;align-items:center;} .badge{display:inline-block;padding:.4rem .75rem;border-radius:999px;background:#2563eb;color:white;font-weight:700;margin-bottom:1rem;} h1{font-size:2.6rem;margin:0 0 .75rem;} p{line-height:1.7;color:#d1d5db;} .cta{display:flex;gap:.75rem;flex-wrap:wrap;margin-top:1.25rem;} button{border:0;border-radius:999px;padding:.9rem 1.2rem;font-weight:700;cursor:pointer;} .primary{background:#2563eb;color:white;} .secondary{background:#111827;color:white;border:1px solid rgba(255,255,255,.15);} .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-top:1rem;} .box{padding:1rem;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);} @media (max-width: 760px){.hero{grid-template-columns:1fr;}.grid{grid-template-columns:1fr;}}`
            ],
          },
          {
            tag: 'section',
            attrs: { class: 'card' },
            children: [
              {
                tag: 'div',
                attrs: { class: 'hero' },
                children: [
                  {
                    tag: 'div',
                    children: [
                      { tag: 'div', attrs: { class: 'badge' }, children: ['YH Framework'] },
                      { tag: 'h1', children: ['Global bir framework olarak yükseliyoruz.'] },
                      { tag: 'p', children: ['Hızlı, güvenli ve modern web siteleri kurmak için tasarlandı.'] },
                      {
                        tag: 'div',
                        attrs: { class: 'cta' },
                        children: [
                          { tag: 'button', attrs: { class: 'primary' }, children: ['Başla'] },
                          { tag: 'button', attrs: { class: 'secondary' }, children: ['Daha Fazla'] },
                        ],
                      },
                    ],
                  },
                  {
                    tag: 'div',
                    attrs: { class: 'grid' },
                    children: [
                      { tag: 'div', attrs: { class: 'box' }, children: ['⚡ Hızlı'] },
                      { tag: 'div', attrs: { class: 'box' }, children: ['🔒 Güvenli'] },
                      { tag: 'div', attrs: { class: 'box' }, children: ['🎨 CSS Desteği'] },
                      { tag: 'div', attrs: { class: 'box' }, children: ['🚀 SPA + SSR'] },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
    },
  }),
);

const container = typeof document !== 'undefined' ? document.body : { innerHTML: '' };
app.mount(container);
