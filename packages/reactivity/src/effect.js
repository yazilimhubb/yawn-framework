let activeSubscriber = null;
export function getActiveSubscriber() {
    return activeSubscriber;
}
export function setActiveSubscriber(fn) {
    activeSubscriber = fn;
}
export function effect(fn) {
    let cleanup;
    let stopped = false;
    const run = () => {
        if (stopped)
            return;
        if (typeof cleanup === 'function') {
            cleanup();
            cleanup = undefined;
        }
        const prev = activeSubscriber;
        activeSubscriber = run;
        try {
            cleanup = fn();
        }
        finally {
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
//# sourceMappingURL=effect.js.map