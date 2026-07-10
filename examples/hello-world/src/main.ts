import { createApp, defineComponent } from '../../../packages/core/src/index.js';
import { signal } from '../../../packages/reactivity/src/index.js';

const count = signal(0);

const app = createApp(
  defineComponent({
    setup() {
      return () => ({
        tag: 'div',
        attrs: { id: 'app' },
        children: [
          {
            tag: 'h1',
            children: ['Hello from YH Framework'],
          },
          {
            tag: 'p',
            children: [`Count: ${count.get()}`],
          },
          {
            tag: 'button',
            attrs: { type: 'button' },
            children: ['Increment'],
          },
        ],
      });
    },
  }),
);

const container = typeof document !== 'undefined' ? document.body : { innerHTML: '' };
app.mount(container as HTMLElement | { innerHTML: string });

if (typeof document !== 'undefined') {
  const button = document.querySelector('button');
  button?.addEventListener('click', () => {
    count.set(count.get() + 1);
    app.mount(container as HTMLElement | { innerHTML: string });
  });
}
