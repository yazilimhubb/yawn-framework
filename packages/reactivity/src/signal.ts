import { getActiveSubscriber, setActiveSubscriber } from './effect.js';

export type Subscriber = () => void;

export interface Signal<T> {
  get(): T;
  set(value: T): void;
  subscribe(listener: Subscriber): () => void;
}

export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<Subscriber>();

  return {
    get() {
      const active = getActiveSubscriber();
      if (active) subscribers.add(active);
      return value;
    },
    set(nextValue: T) {
      if (Object.is(value, nextValue)) return;
      value = nextValue;
      for (const sub of [...subscribers]) sub();
    },
    subscribe(listener: Subscriber) {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
  };
}

export function computed<T>(fn: () => T): Signal<T> {
  let cachedValue: T;
  let dirty = true;
  const subscribers = new Set<Subscriber>();

  const recompute: Subscriber = () => {
    dirty = true;
    for (const sub of [...subscribers]) sub();
  };

  return {
    get() {
      const active = getActiveSubscriber();
      if (active) subscribers.add(active);
      if (dirty) {
        const prev = getActiveSubscriber();
        setActiveSubscriber(recompute);
        try { cachedValue = fn(); }
        finally { setActiveSubscriber(prev); }
        dirty = false;
      }
      return cachedValue;
    },
    set(value: T) {
      cachedValue = value;
      dirty = false;
      for (const sub of [...subscribers]) sub();
    },
    subscribe(listener: Subscriber) {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
  };
}
