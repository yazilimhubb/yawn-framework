export interface ComponentNode {
    tag: string;
    attrs?: Record<string, string | number | boolean | null | undefined>;
    children?: ComponentRenderResult[];
}
export type ComponentRenderResult = string | number | boolean | null | undefined | ComponentNode | (() => ComponentRenderResult);
export interface ComponentDefinition<P extends Record<string, unknown> = Record<string, unknown>> {
    props?: P;
    setup(props: P): ComponentRenderResult;
}
export declare function defineComponent<P extends Record<string, unknown> = Record<string, unknown>>(definition: Omit<ComponentDefinition<P>, 'props'>): ComponentDefinition<P>;
export declare function h<P extends Record<string, unknown>>(component: ComponentDefinition<P>, props: P, ...children: ComponentRenderResult[]): ComponentRenderResult;
export declare function el(tag: string, attrs?: ComponentNode['attrs'], ...children: ComponentRenderResult[]): ComponentNode;
export declare function isComponentNode(value: unknown): value is ComponentNode;
//# sourceMappingURL=component.d.ts.map