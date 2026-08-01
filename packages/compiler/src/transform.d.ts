import type { ChildNode } from './parser.js';
export interface TransformOptions {
    resolveComponent?: (name: string) => string | null | undefined;
    props?: Record<string, string>;
    _resolveAndTransform?: (src: string, props: Record<string, string>) => TNode;
}
export interface TNode {
    tag: string;
    attrs?: Record<string, string>;
    children?: Array<TNode | string>;
}
export declare function transform(nodes: ChildNode[], options?: TransformOptions): TNode;
//# sourceMappingURL=transform.d.ts.map