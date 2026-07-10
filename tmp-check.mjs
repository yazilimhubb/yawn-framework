import { createApp, defineComponent, escapeHtml } from './packages/core/src/index.ts';

const container = { innerHTML: '' };
const app = createApp(defineComponent({
  setup() {
    return { tag: 'div', attrs: { title: '<img src=x onerror=alert(1)>' }, children: ['safe'] };
  },
}));

app.mount(container);
console.log(escapeHtml('<script>alert(1)</script>'));
console.log(container.innerHTML);
