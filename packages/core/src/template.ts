import { compile } from '../../compiler/src/compiler.js';
import type { TNode } from '../../compiler/src/compiler.js';

export type YawnTemplateNode = TNode;

export function compileYawnTemplate(source: string): TNode {
  return compile(source);
}
