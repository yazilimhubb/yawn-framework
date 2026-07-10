export interface AppModule {
  name: string;
  // called when module is registered
  setup?: (app: { use: (module: AppModule) => void; context?: any }) => void;
  // optional lifecycle hooks
  onInit?: (appContext: any) => void;
  onBeforeRender?: (html: string) => string | void;
  onMount?: () => void;
}

export function defineModule(module: AppModule): AppModule {
  return module;
}
