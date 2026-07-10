/**
 * Yawn Framework Playground
 * Burada framework özelliklerini deneyebilirsin.
 */
import { createApp, defineComponent, h, el } from '../../../packages/core/src/index.js';
import { signal, computed, effect, watch } from '../../../packages/reactivity/src/index.js';
import { compile, compileToFragment } from '../../../packages/compiler/src/index.js';

// ─── Reactivity demo ──────────────────────────────────────────────────────────
const firstName = signal('Yawn');
const lastName = signal('Framework');
const fullName = computed(() => `${firstName.get()} ${lastName.get()}`);

effect(() => {
  console.log('[effect] fullName:', fullName.get());
});

watch(firstName, (next, prev) => {
  console.log(`[watch] firstName: ${prev} → ${next}`);
});

firstName.set('Yawn ⚡'); // triggers effect + watch

// ─── Compiler demo ────────────────────────────────────────────────────────────
const template = '<section class="demo"><h1>{{title}}</h1><p>{{body}}</p></section>';
const html = compileToFragment(template, {
  props: { title: 'Playground', body: 'Framework çalışıyor!' },
});
console.log('[compiler] output:', html);

// ─── Component demo ───────────────────────────────────────────────────────────
const Badge = defineComponent({
  setup(props: { text: string; color?: string }) {
    return el('span', {
      style: `background:${props.color ?? '#3b82f6'};color:white;padding:0.2rem 0.6rem;border-radius:999px;font-size:0.8rem`,
    }, props.text);
  },
});

const App = defineComponent({
  setup() {
    return el('div', { id: 'playground', style: 'font-family:system-ui;max-width:600px;margin:2rem auto;padding:2rem' },
      el('h1', {}, '⚡ Yawn Playground'),
      el('p', { style: 'color:#64748b' }, `fullName = ${fullName.get()}`),
      h(Badge, { text: 'v0.1.0', color: '#10b981' }),
      ' ',
      h(Badge, { text: 'TypeScript' }),
      el('hr', {}),
      el('pre', { style: 'background:#f1f5f9;padding:1rem;border-radius:8px;overflow:auto' }, html),
    );
  },
});

const container = typeof document !== 'undefined' ? document.body : { innerHTML: '' };
createApp(App).mount(container as HTMLElement);

console.log('\n✅ Playground çalışıyor. Check the console for reactivity output.\n');
