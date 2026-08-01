import { type AppModule } from './index.js';
export interface AppContext {
    modules: AppModule[];
    use(module: AppModule): void;
}
export declare function createAppContext(): AppContext;
export declare function registerGlobalModule(module: AppModule): AppModule;
//# sourceMappingURL=app.d.ts.map