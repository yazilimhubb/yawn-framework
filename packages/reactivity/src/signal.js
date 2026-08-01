import { getActiveSubscriber, setActiveSubscriber } from './effect.js';
export function signal(initialValue) {
    let value = initialValue;
    const subscribers = new Set();
    return {
        get() {
            const active = getActiveSubscriber();
            if (active)
                subscribers.add(active);
            return value;
        },
        set(nextValue) {
            if (Object.is(value, nextValue))
                return;
            value = nextValue;
            for (const sub of [...subscribers])
                sub();
        },
        subscribe(listener) {
            subscribers.add(listener);
            return () => subscribers.delete(listener);
        },
    };
}
export function computed(fn) {
    let cachedValue;
    let dirty = true;
    const subscribers = new Set();
    const recompute = () => {
        dirty = true;
        for (const sub of [...subscribers])
            sub();
    };
    return {
        get() {
            const active = getActiveSubscriber();
            if (active)
                subscribers.add(active);
            if (dirty) {
                const prev = getActiveSubscriber();
                setActiveSubscriber(recompute);
                try {
                    cachedValue = fn();
                }
                finally {
                    setActiveSubscriber(prev);
                }
                dirty = false;
            }
            return cachedValue;
        },
        set(value) {
            cachedValue = value;
            dirty = false;
            for (const sub of [...subscribers])
                sub();
        },
        subscribe(listener) {
            subscribers.add(listener);
            return () => subscribers.delete(listener);
        },
    };
}
//# sourceMappingURL=signal.js.map