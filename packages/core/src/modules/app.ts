import { defineModule, type AppModule } from './index.js';

export interface AppContext {
  modules: AppModule[];
  use(module: AppModule): void;
}

export function createAppContext(): AppContext {
  const modules: AppModule[] = [];

  return {
    modules,
    use(module: AppModule) {
      modules.push(module);
      module.setup({ use: (nextModule) => this.use(nextModule) });
    },
  };
}

export function registerGlobalModule(module: AppModule) {
  return defineModule(module);
}
