type EffectFn = () => void | (() => void);
export declare function getActiveSubscriber(): (() => void) | null;
export declare function setActiveSubscriber(fn: (() => void) | null): void;
export interface EffectHandle {
    stop(): void;
}
export declare function effect(fn: EffectFn): EffectHandle;
export {};
//# sourceMappingURL=effect.d.ts.map