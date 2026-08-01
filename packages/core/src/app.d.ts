import type { ComponentDefinition } from './component.js';
import type { AppModule } from './modules/index.js';
export interface AppInstance {
    mount(container: HTMLElement | {
        innerHTML: string;
    }): void;
    update(): void;
    unmount(): void;
}
export interface AppOptions {
    modules?: AppModule[];
}
export declare function createApp(rootComponent: ComponentDefinition, options?: AppOptions): AppInstance;
export declare function createReactiveApp(rootComponent: ComponentDefinition, effectFn: (fn: () => void) => {
    stop(): void;
}, options?: AppOptions): AppInstance & {
    stop(): void;
};
export declare function renderWithModules(rootComponent: ComponentDefinition, modules?: AppModule[]): string;
//# sourceMappingURL=app.d.ts.map