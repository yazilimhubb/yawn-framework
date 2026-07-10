import { defineModule, type AppModule } from './index.js';

export interface AppContext {
  modules: AppModule[];
  use(module: AppModule): void;
}

export function createAppContext(): AppContext {
  const modules: AppModule[] = [];

  const ctx: AppContext = {
    modules,
    use(module: AppModule) {
      modules.push(module);
      module.setup?.({ use: (nextModule) => ctx.use(nextModule) });
    },
  };

  return ctx;
}

export function registerGlobalModule(module: AppModule): AppModule {
  return defineModule(module);
}
