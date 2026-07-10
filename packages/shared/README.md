# @yawn/shared

Shared types, constants and utility functions used across Yawn framework packages.

## Install

```bash
npm install @yawn/shared
```

## API

### Constants

```ts
import { YAWN_VERSION, HYDRATION_ATTR, COMPONENT_PREFIX, PLACEHOLDER_RE } from '@yawn/shared';
```

### Types

```ts
import type { Attrs, Props, CleanupFn, Version } from '@yawn/shared';
```

### Utilities

```ts
import { escapeHtml, clamp, isPlainObject, deepMerge, nanoid } from '@yawn/shared';

escapeHtml('<script>');        // '&lt;script&gt;'
clamp(15, 0, 10);              // 10
nanoid();                      // 'aBcD1234'
deepMerge({ a: 1 }, { b: 2 }); // { a: 1, b: 2 }
```
