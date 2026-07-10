export interface AppModuleContext {
  modules: AppModule[];
  use(module: AppModule): void;
}

export interface AppModule {
  name: string;
  setup?: (ctx: AppModuleContext) => void;
  onInit?: (ctx: { modules: AppModule[] }) => void;
  onBeforeRender?: (html: string) => string | void;
  onMount?: () => void;
  onUnmount?: () => void;
}

export function defineModule(module: AppModule): AppModule {
  return module;
}
