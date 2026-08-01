export type Subscriber = () => void;
export interface Signal<T> {
    get(): T;
    set(value: T): void;
    subscribe(listener: Subscriber): () => void;
}
export declare function signal<T>(initialValue: T): Signal<T>;
export declare function computed<T>(fn: () => T): Signal<T>;
//# sourceMappingURL=signal.d.ts.map