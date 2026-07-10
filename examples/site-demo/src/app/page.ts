import { defineComponent } from '../../../../packages/core/src/index.js';

export const Page = defineComponent({
  setup() {
    return () => ({
      tag: 'main',
      attrs: { class: 'page' },
      children: [
        { tag: 'span', attrs: { class: 'pill' }, children: ['YH Framework'] },
        { tag: 'h1', children: ['Hello World'] },
        { tag: 'p', children: ['Bu sayfa framework kullanılarak oluşturulmuştur.'] },
      ],
    });
  },
});
