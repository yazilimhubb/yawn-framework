type Subscriber = () => void;

export interface Signal<T> {
  get(): T;
  set(value: T): void;
  subscribe(listener: Subscriber): () => void;
}

let activeSubscriber: Subscriber | null = null;

export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<Subscriber>();

  return {
    get() {
      if (activeSubscriber) {
        subscribers.add(activeSubscriber);
      }
      return value;
    },
    set(nextValue: T) {
      value = nextValue;
      for (const subscriber of subscribers) {
        subscriber();
      }
    },
    subscribe(listener: Subscriber) {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
  };
}

export function computed<T>(fn: () => T): Signal<T> {
  const state = signal<T | undefined>(undefined as T);
  let isComputing = false;

  const recompute = () => {
    if (isComputing) {
      return;
    }

    isComputing = true;
    try {
      const previousSubscriber = activeSubscriber;
      activeSubscriber = recompute;
      const nextValue = fn();
      state.set(nextValue);
      activeSubscriber = previousSubscriber;
    } finally {
      isComputing = false;
    }
  };

  recompute();

  return {
    get() {
      return state.get();
    },
    set(value: T) {
      state.set(value);
    },
    subscribe(listener: Subscriber) {
      return state.subscribe(listener);
    },
  };
}
