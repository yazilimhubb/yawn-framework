type EffectFn = () => void | (() => void);

let activeSubscriber: (() => void) | null = null;

/** @internal — shared with signal.ts */
export function getActiveSubscriber(): (() => void) | null {
  return activeSubscriber;
}

export function setActiveSubscriber(fn: (() => void) | null): void {
  activeSubscriber = fn;
}

export interface EffectHandle {
  /** Stop the effect from re-running. */
  stop(): void;
}

/**
 * Runs `fn` immediately and re-runs it whenever any signal it reads changes.
 * Returns a handle to stop the effect.
 *
 * @example
 * const count = signal(0);
 * const stop = effect(() => console.log('count:', count.get()));
 * count.set(1); // logs "count: 1"
 * stop();
 */
export function effect(fn: EffectFn): EffectHandle {
  let cleanup: (() => void) | void;
  let stopped = false;

  const run = () => {
    if (stopped) return;

    // run cleanup from previous execution
    if (typeof cleanup === 'function') {
      cleanup();
      cleanup = undefined;
    }

    const prev = activeSubscriber;
    activeSubscriber = run;
    try {
      cleanup = fn() as (() => void) | void;
    } finally {
      activeSubscriber = prev;
    }
  };

  run();

  return {
    stop() {
      stopped = true;
      if (typeof cleanup === 'function') {
        cleanup();
        cleanup = undefined;
      }
    },
  };
}
