import { compile } from '@yawn-framework/compiler';
import type { TNode } from '@yawn-framework/compiler';

export type YawnTemplateNode = TNode;

export function compileYawnTemplate(source: string): TNode {
  return compile(source);
}
