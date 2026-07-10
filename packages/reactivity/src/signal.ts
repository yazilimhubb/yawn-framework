import { getActiveSubscriber, setActiveSubscriber } from './effect.js';

export type Subscriber = () => void;

export interface Signal<T> {
  /** Read the current value. Automatically tracked inside an effect. */
  get(): T;
  /** Set a new value and notify all subscribers. */
  set(value: T): void;
  /** Manually subscribe to changes. Returns an unsubscribe function. */
  subscribe(listener: Subscriber): () => void;
}

export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<Subscriber>();

  return {
    get() {
      const active = getActiveSubscriber();
      if (active) {
        subscribers.add(active);
      }
      return value;
    },
    set(nextValue: T) {
      if (Object.is(value, nextValue)) return; // skip if same reference
      value = nextValue;
      for (const subscriber of [...subscribers]) {
        subscriber();
      }
    },
    subscribe(listener: Subscriber) {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
  };
}

/**
 * Creates a derived signal that re-computes when any of its dependencies change.
 *
 * @example
 * const a = signal(2);
 * const b = signal(3);
 * const sum = computed(() => a.get() + b.get());
 * console.log(sum.get()); // 5
 */
export function computed<T>(fn: () => T): Signal<T> {
  let cachedValue: T;
  let dirty = true;
  const subscribers = new Set<Subscriber>();

  const recompute: Subscriber = () => {
    dirty = true;
    for (const sub of [...subscribers]) {
      sub();
    }
  };

  return {
    get() {
      // track the computed as a dependency of the outer effect
      const active = getActiveSubscriber();
      if (active) {
        subscribers.add(active);
      }

      if (dirty) {
        const prev = getActiveSubscriber();
        setActiveSubscriber(recompute);
        try {
          cachedValue = fn();
        } finally {
          setActiveSubscriber(prev);
        }
        dirty = false;
      }

      return cachedValue;
    },
    set(value: T) {
      // computed is normally read-only; allow override for testing
      cachedValue = value;
      dirty = false;
      for (const sub of [...subscribers]) {
        sub();
      }
    },
    subscribe(listener: Subscriber) {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
  };
}
