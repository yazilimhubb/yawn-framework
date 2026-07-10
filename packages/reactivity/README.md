# @yawn/reactivity

Reactive primitives for the Yawn framework — signals, computed values, effects and watchers.

## Install

```bash
npm install @yawn/reactivity
```

## API

### `signal(initialValue)`

Creates a reactive value. Reading inside an `effect` automatically tracks it as a dependency.

```ts
import { signal } from '@yawn/reactivity';

const count = signal(0);
count.get();        // 0
count.set(1);       // notifies subscribers
count.subscribe(v => console.log('changed'));
```

### `computed(fn)`

Creates a derived signal. Re-computes lazily when dependencies change.

```ts
import { signal, computed } from '@yawn/reactivity';

const a = signal(2);
const b = signal(3);
const sum = computed(() => a.get() + b.get());

sum.get(); // 5
a.set(10);
sum.get(); // 13
```

### `effect(fn)`

Runs `fn` immediately and re-runs it whenever any signal it reads changes. Returns a `stop()` handle.

```ts
import { signal, effect } from '@yawn/reactivity';

const name = signal('Alice');
const handle = effect(() => {
  console.log('Hello', name.get());
});

name.set('Bob'); // logs "Hello Bob"
handle.stop();   // stops the effect
```

The function can return a cleanup callback:

```ts
effect(() => {
  const id = setInterval(() => console.log(count.get()), 1000);
  return () => clearInterval(id); // called before next run and on stop()
});
```

### `watch(source, callback, options?)`

Watches a signal and calls `callback(newValue, oldValue)` on change.

```ts
import { signal, watch } from '@yawn/reactivity';

const user = signal('Alice');
const stop = watch(user, (next, prev) => {
  console.log(`${prev} → ${next}`);
});

user.set('Bob'); // logs "Alice → Bob"
stop();
```

Options:
- `immediate: true` — call callback with the initial value immediately.

### `watchAll(sources, callback)`

Watches multiple signals and calls `callback` when any of them change.

```ts
const stop = watchAll([a, b, c], () => console.log('something changed'));
```
