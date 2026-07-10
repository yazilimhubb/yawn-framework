import { defineComponent } from '../../../../packages/core/src/index.js';

export const AboutPage = defineComponent({
  setup() {
    return () => ({
      tag: 'section',
      children: [
        { tag: 'h2', children: ['Hakkımızda'] },
        { tag: 'p', children: ['Bu demo, framework’ün site yapma akışını göstermek için hazırlanmıştır.'] },
      ],
    });
  },
});
