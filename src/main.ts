import { createApp, defineComponent } from '@yh/core';

const app = createApp(
  defineComponent({
    setup() {
      return () => ({
        tag: 'main',
        children: ['Hello from YH Framework'],
      });
    },
  }),
);

app.mount(typeof document !== 'undefined' ? document.body : { innerHTML: '' });
