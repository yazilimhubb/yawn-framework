/**
 * @deprecated Use `@yawn/compiler` directly for full .yawn template support.
 * This module re-exports a compatibility shim so existing code keeps working.
 */
import { compile } from '../../compiler/src/compiler.js';
import type { TNode } from '../../compiler/src/compiler.js';

/** @deprecated Use TNode from @yawn/compiler */
export type YawnTemplateNode = TNode;

/**
 * Parse and transform a .yawn source string into a node tree.
 * @deprecated Use `compile()` from `@yawn/compiler` for full support.
 */
export function compileYawnTemplate(source: string): TNode {
  return compile(source);
}
