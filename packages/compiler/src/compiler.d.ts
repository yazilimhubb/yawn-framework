import { type TransformOptions, type TNode } from './transform.js';
export type { TNode, TransformOptions };
export interface CompileOptions extends TransformOptions {
    title?: string;
}
export declare function escapeHtml(s: string): string;
export declare function serializeNode(node: TNode | string): string;
export declare function compile(source: string, options?: CompileOptions): TNode;
export declare function compileToFragment(source: string, options?: CompileOptions): string;
export declare function compileToHtml(source: string, options?: CompileOptions): string;
//# sourceMappingURL=compiler.d.ts.map