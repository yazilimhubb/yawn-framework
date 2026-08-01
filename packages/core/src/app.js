import { renderToHtml } from './render.js';
export function createApp(rootComponent, options = {}) {
    const modules = options.modules ?? [];
    let mountedContainer = null;
    let isMounted = false;
    function runModuleSetup() {
        for (const module of modules) {
            module.setup?.({ use: (m) => modules.push(m) });
            module.onInit?.({ modules });
        }
    }
    function runRender(container) {
        let html = renderToHtml(rootComponent);
        for (const module of modules) {
            if (module.onBeforeRender) {
                const result = module.onBeforeRender(html);
                if (typeof result === 'string')
                    html = result;
            }
        }
        container.innerHTML = html;
    }
    const instance = {
        mount(container) {
            if (!isMounted)
                runModuleSetup();
            mountedContainer = container;
            runRender(container);
            isMounted = true;
            for (const module of modules)
                module.onMount?.();
        },
        update() {
            if (mountedContainer)
                runRender(mountedContainer);
        },
        unmount() {
            if (mountedContainer)
                mountedContainer.innerHTML = '';
            mountedContainer = null;
            isMounted = false;
            for (const module of modules)
                module.onUnmount?.();
        },
    };
    return instance;
}
export function createReactiveApp(rootComponent, effectFn, options = {}) {
    const app = createApp(rootComponent, options);
    let stopEffect = null;
    const originalMount = app.mount.bind(app);
    return {
        ...app,
        mount(container) {
            originalMount(container);
            const handle = effectFn(() => app.update());
            stopEffect = handle.stop.bind(handle);
        },
        stop() {
            stopEffect?.();
            app.unmount();
        },
    };
}
export function renderWithModules(rootComponent, modules = []) {
    let html = renderToHtml(rootComponent);
    for (const module of modules) {
        if (module.onBeforeRender) {
            const result = module.onBeforeRender(html);
            if (typeof result === 'string')
                html = result;
        }
    }
    return html;
}
//# sourceMappingURL=app.js.map