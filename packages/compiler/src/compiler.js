import { parse } from './parser.js';
import { transform } from './transform.js';
const VOID_TAGS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
]);
export function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
export function serializeNode(node) {
    if (typeof node === 'string')
        return escapeHtml(node);
    const attrStr = Object.entries(node.attrs ?? {})
        .map(([k, v]) => v === '' ? ` ${k}` : ` ${k}="${escapeHtml(v)}"`)
        .join('');
    if (VOID_TAGS.has(node.tag.toLowerCase()))
        return `<${node.tag}${attrStr} />`;
    return `<${node.tag}${attrStr}>${(node.children ?? []).map(serializeNode).join('')}</${node.tag}>`;
}
export function compile(source, options = {}) {
    const resolveAndTransform = (src, props) => compile(src, { ...options, props });
    return transform(parse(source), { ...options, _resolveAndTransform: resolveAndTransform });
}
export function compileToFragment(source, options = {}) {
    return serializeNode(compile(source, options));
}
export function compileToHtml(source, options = {}) {
    const body = compileToFragment(source, options);
    const title = escapeHtml(options.title ?? 'Yawn App');
    return [
        '<!doctype html>',
        '<html lang="en">',
        '  <head>',
        '    <meta charset="utf-8" />',
        '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
        `    <title>${title}</title>`,
        '  </head>',
        '  <body>',
        `    ${body}`,
        '  </body>',
        '</html>',
    ].join('\n');
}
//# sourceMappingURL=compiler.js.map