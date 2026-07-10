import { defineComponent } from '../../../../packages/core/src/index.js';

export const ContactPage = defineComponent({
  setup() {
    return {
      tag: 'section',
      attrs: { class: 'page' },
      children: [
        { tag: 'h2', children: ['İletişim'] },
        { tag: 'p', children: ['Yawn Framework hakkında sorularınız için:'] },
        {
          tag: 'address',
          children: [
            { tag: 'a', attrs: { href: 'https://github.com/yazilimhubb/yawn-framework' }, children: ['github.com/yazilimhubb/yawn-framework'] },
          ],
        },
      ],
    };
  },
});
