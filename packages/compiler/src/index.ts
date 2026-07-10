export { compile, compileToFragment, compileToHtml } from './compiler.js';
export type { TNode, CompileOptions } from './compiler.js';

export { parse } from './parser.js';
export type { ChildNode, ElementNode, TextNode } from './parser.js';

export { transform } from './transform.js';
export type { TransformOptions } from './transform.js';

export { compileSFC, parseSFC, analyzeScript, scopeStyle } from './sfc.js';
export type { SFCBlock, CompiledSFC, SFCCompileOptions, ScriptAnalysis } from './sfc.js';
