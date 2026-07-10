import { createApp, defineComponent } from '../../../packages/core/src/index.js';

const app = createApp(
  defineComponent({
    setup() {
      return () => ({
        tag: 'main',
        attrs: { class: 'page' },
        children: [
          {
            tag: 'section',
            attrs: { class: 'hero' },
            children: [
              { tag: 'h1', children: ['Yawn ile hızlıca site kur'] },
              { tag: 'p', children: ['Yawn framework ile modern, sade ve hızlı web sayfaları oluştur.'] },
              { tag: 'button', children: ['Başla'] },
            ],
          },
        ],
      });
    },
  }),
);

app.mount(typeof document !== 'undefined' ? document.body : { innerHTML: '' });
