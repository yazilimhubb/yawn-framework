import type { Signal } from './signal.js';
import { effect, type EffectHandle } from './effect.js';

export interface WatchOptions {
  /** If true, the callback is called immediately with the current value. Default: false. */
  immediate?: boolean;
}

/**
 * Watches a signal and calls `callback` whenever its value changes.
 * Returns a stop handle.
 *
 * @example
 * const name = signal('Alice');
 * const stop = watch(name, (newVal, oldVal) => {
 *   console.log(`${oldVal} → ${newVal}`);
 * });
 * name.set('Bob'); // logs "Alice → Bob"
 * stop();
 */
export function watch<T>(
  source: Signal<T>,
  callback: (newValue: T, oldValue: T | undefined) => void,
  options: WatchOptions = {},
): EffectHandle {
  let oldValue: T | undefined = undefined;
  let isFirst = true;

  const handle = effect(() => {
    const newValue = source.get();

    if (isFirst) {
      if (options.immediate) {
        callback(newValue, oldValue);
      }
      oldValue = newValue;
      isFirst = false;
      return;
    }

    callback(newValue, oldValue);
    oldValue = newValue;
  });

  return handle;
}

/**
 * Watches multiple signals and calls `callback` when any of them change.
 * Returns a stop handle.
 *
 * @example
 * const a = signal(1);
 * const b = signal(2);
 * watchAll([a, b], () => console.log('changed'));
 */
export function watchAll(
  sources: Signal<unknown>[],
  callback: () => void,
): EffectHandle {
  let isFirst = true;

  const handle = effect(() => {
    // read all sources to subscribe
    for (const s of sources) s.get();

    if (isFirst) {
      isFirst = false;
      return;
    }

    callback();
  });

  return handle;
}
