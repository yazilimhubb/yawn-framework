# @yawn/devtools

Dev-only inspection and debugging utilities for Yawn framework. All functions are no-ops in production (`NODE_ENV=production`).

## Install

```bash
npm install -D @yawn/devtools
```

## API

### `inspectSignal(signal, name?)`

Logs signal value changes to the console.

```ts
import { signal } from '@yawn/reactivity';
import { inspectSignal } from '@yawn/devtools';

const count = signal(0);
inspectSignal(count, 'count');
// [yawn/devtools] count: 0
count.set(5);
// [yawn/devtools] count changed: 5

const stop = inspectSignal(count, 'count'); // returns unsubscribe fn
stop();
```

### `printTree(node)`

Prints a TNode tree to the console.

```ts
import { compile } from '@yawn/compiler';
import { printTree } from '@yawn/devtools';

const tree = compile('<main><h1>Hello</h1></main>');
printTree(tree);
// <main>
//   <h1>
//     "Hello"
```

### `measure(label)`

Measures how long an operation takes.

```ts
import { measure } from '@yawn/devtools';

const end = measure('compile');
compile(bigSource);
end(); // [yawn/devtools] compile took 1.23ms
```
