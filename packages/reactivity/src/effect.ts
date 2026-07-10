type EffectFn = () => void | (() => void);

let activeSubscriber: (() => void) | null = null;

export function getActiveSubscriber(): (() => void) | null {
  return activeSubscriber;
}

export function setActiveSubscriber(fn: (() => void) | null): void {
  activeSubscriber = fn;
}

export interface EffectHandle {
  stop(): void;
}

export function effect(fn: EffectFn): EffectHandle {
  let cleanup: (() => void) | void;
  let stopped = false;

  const run = () => {
    if (stopped) return;
    if (typeof cleanup === 'function') { cleanup(); cleanup = undefined; }
    const prev = activeSubscriber;
    activeSubscriber = run;
    try { cleanup = fn() as (() => void) | void; }
    finally { activeSubscriber = prev; }
  };

  run();

  return {
    stop() {
      stopped = true;
      if (typeof cleanup === 'function') { cleanup(); cleanup = undefined; }
    },
  };
}
