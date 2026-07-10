import { defineComponent } from '../../../../packages/core/src/index.js';

export const ContactPage = defineComponent({
  setup() {
    return () => ({
      tag: 'section',
      children: [
        { tag: 'h2', children: ['İletişim'] },
        { tag: 'p', children: ['biz@yhframework.dev'] },
      ],
    });
  },
});
