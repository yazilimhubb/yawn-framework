import { defineModule } from './index.js';
export function createAppContext() {
    const modules = [];
    const ctx = {
        modules,
        use(module) {
            modules.push(module);
            module.setup?.({ use: (nextModule) => ctx.use(nextModule) });
        },
    };
    return ctx;
}
export function registerGlobalModule(module) {
    return defineModule(module);
}
//# sourceMappingURL=app.js.map