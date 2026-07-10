import { createApp, defineComponent } from '../../../packages/core/src/index.js';
import { signal, effect } from '../../../packages/reactivity/src/index.js';

// ─── State ────────────────────────────────────────────────────────────────────
const count = signal(0);
const message = signal('Hello from Yawn ⚡');

// ─── Root component ───────────────────────────────────────────────────────────
const App = defineComponent({
  setup() {
    return {
      tag: 'div',
      attrs: { id: 'app', style: 'font-family:system-ui;max-width:480px;margin:3rem auto;padding:2rem' },
      children: [
        { tag: 'h1', children: [message.get()] },
        {
          tag: 'p',
          attrs: { style: 'font-size:1.5rem' },
          children: [`Count: ${count.get()}`],
        },
        {
          tag: 'div',
          attrs: { style: 'display:flex;gap:0.5rem;margin-top:1rem' },
          children: [
            {
              tag: 'button',
              attrs: { id: 'inc', type: 'button', style: 'padding:0.5rem 1rem;cursor:pointer' },
              children: ['+ Increment'],
            },
            {
              tag: 'button',
              attrs: { id: 'dec', type: 'button', style: 'padding:0.5rem 1rem;cursor:pointer' },
              children: ['- Decrement'],
            },
            {
              tag: 'button',
              attrs: { id: 'reset', type: 'button', style: 'padding:0.5rem 1rem;cursor:pointer' },
              children: ['Reset'],
            },
          ],
        },
        {
          tag: 'p',
          attrs: { style: 'color:#64748b;font-size:0.875rem;margin-top:1rem' },
          children: [count.get() > 0 ? `${count.get()} kez arttırıldı` : 'Butona bas!'],
        },
      ],
    };
  },
});

// ─── Mount ────────────────────────────────────────────────────────────────────
const container = typeof document !== 'undefined'
  ? document.body
  : { innerHTML: '' };

const app = createApp(App);
app.mount(container as HTMLElement);

// ─── Wire up events + reactive re-render ─────────────────────────────────────
if (typeof document !== 'undefined') {
  // Re-render whenever count or message changes
  effect(() => {
    // read signals to track them
    count.get();
    message.get();
    app.update();
  });

  document.addEventListener('click', (e) => {
    const id = (e.target as HTMLElement).id;
    if (id === 'inc') count.set(count.get() + 1);
    else if (id === 'dec') count.set(Math.max(0, count.get() - 1));
    else if (id === 'reset') { count.set(0); message.set('Reset!'); }
  });
}
