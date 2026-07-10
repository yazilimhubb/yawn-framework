import type { Signal } from './signal.js';
import { effect, type EffectHandle } from './effect.js';

export interface WatchOptions {
  immediate?: boolean;
}

export function watch<T>(
  source: Signal<T>,
  callback: (newValue: T, oldValue: T | undefined) => void,
  options: WatchOptions = {},
): EffectHandle {
  let oldValue: T | undefined = undefined;
  let isFirst = true;

  return effect(() => {
    const newValue = source.get();
    if (isFirst) {
      if (options.immediate) callback(newValue, oldValue);
      oldValue = newValue;
      isFirst = false;
      return;
    }
    callback(newValue, oldValue);
    oldValue = newValue;
  });
}

export function watchAll(sources: Signal<unknown>[], callback: () => void): EffectHandle {
  let isFirst = true;
  return effect(() => {
    for (const s of sources) s.get();
    if (isFirst) { isFirst = false; return; }
    callback();
  });
}
