# ⚡ Yawn Framework

HTML-tabanlı, TypeScript destekli modern web framework. `.yawn` single-file componentleri ile template, script ve style tek dosyada. Tailwind dahil. Reactive state hazır. Sıfır config.

[![npm](https://img.shields.io/npm/v/yawn-framework)](https://www.npmjs.com/package/yawn-framework)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## Hızlı Başlangıç

```bash
npx create-yawn@latest my-site
cd my-site
npm install
yh dev
```

→ `http://localhost:3000`

---

## .yawn Dosya Formatı

Her şey tek dosyada — template, script, style:

```html
<!-- src/pages/index.yawn -->
<template>
  <div class="min-h-screen bg-slate-900 text-white flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-5xl font-black mb-4">Merhaba {{ name }}!</h1>
      <p class="text-white/60 mb-8">Sayaç: {{ count }}</p>

      <div class="flex gap-3 justify-center">
        <button @click="count--" class="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full font-bold transition">−</button>
        <button @click="count++" class="bg-indigo-500 hover:bg-indigo-400 px-6 py-3 rounded-full font-bold transition">+</button>
      </div>

      <p :if="count > 9" class="mt-6 text-green-400 font-semibold">🎉 10'u geçtin!</p>
    </div>
  </div>
</template>

<script>
  let name = "Yawn";
  let count = 0;
</script>
```

### Direktifler

| Direktif | Açıklama | Örnek |
|---|---|---|
| `{{ expr }}` | Reactive binding | `{{ count }}` |
| `@click="expr"` | Event handler | `@click="count++"` |
| `:if="expr"` | Conditional render | `:if="count > 0"` |
| `:each="x in xs"` | Loop | `:each="item in items"` |

---

## Paketler

| Paket | Açıklama |
|---|---|
| `yawn-framework` | Core — component model, renderer, app lifecycle |
| `@yawn-framework/compiler` | `.yawn` template compiler + SFC parser |
| `@yawn-framework/reactivity` | signal, computed, effect, watch |
| `@yawn-framework/router` | Client-side router, dynamic params, navigation guards |
| `@yawn-framework/server` | Production Node.js HTTP server |
| `@yawn-framework/dev-server` | Dev server with hot reload (SSE) |
| `@yawn-framework/runtime` | Browser mount & hydration |
| `@yawn-framework/shared` | Shared types & utilities |
| `@yawn-framework/devtools` | Dev-only debug tools |
| `@yawn-framework/cli` | CLI (`yh` command) |

---

## CLI Komutları

```bash
yh init my-site              # Yeni proje oluştur
yh dev                       # Dev server başlat (hot reload)
yh build                     # Production build
yh create component Hero     # .yawn component oluştur
yh create site landing       # Landing site scaffoldu
yh insert src/page.yawn Hero title="Hello"  # Component ekle
```

---

## TypeScript API

Daha fazla kontrol isteyenler için:

```ts
import { createApp, defineComponent, h, el } from 'yawn-framework';
import { signal, computed, effect } from '@yawn-framework/reactivity';
import { createRouter, createRoute } from '@yawn-framework/router';

const count = signal(0);
const doubled = computed(() => count.get() * 2);

const App = defineComponent({
  setup() {
    return el('div', {},
      el('p', {}, `Count: ${count.get()}, Doubled: ${doubled.get()}`),
      el('button', { id: 'inc' }, '+'),
    );
  },
});

const app = createApp(App);
app.mount(document.body);

effect(() => { count.get(); app.update(); });
document.addEventListener('click', e => {
  if ((e.target as HTMLElement).id === 'inc') count.set(count.get() + 1);
});
```

---

## Proje Yapısı

```
my-site/
├── src/
│   ├── pages/
│   │   ├── index.yawn      # → /
│   │   └── about.yawn      # → /about
│   ├── components/
│   │   └── Hero.yawn
│   └── server.ts
├── public/
│   └── style.css
└── package.json
```

---

## Bağlantılar

- **npm:** [yawn-framework](https://www.npmjs.com/package/yawn-framework)
- **GitHub:** [yazilimhubb/yawn-framework](https://github.com/yazilimhubb/yawn-framework)
- **Organizasyon:** [@yawn-framework](https://www.npmjs.com/settings/yawn-framework/packages)

---

## Lisans

MIT © [anythingQW](https://github.com/anythingQW)
