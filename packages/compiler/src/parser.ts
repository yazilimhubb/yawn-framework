export interface ElementNode {
  type: 'element';
  tag: string;
  attrs: Record<string, string>;
  children: ChildNode[];
  selfClosing: boolean;
}

export interface TextNode {
  type: 'text';
  value: string;
}

export type ChildNode = ElementNode | TextNode;

type Token =
  | { kind: 'open'; tag: string; attrs: Record<string, string>; selfClosing: boolean }
  | { kind: 'close'; tag: string }
  | { kind: 'text'; value: string };

function parseAttrs(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z0-9_\-:.@#]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s/>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    attrs[m[1]] = m[2] ?? m[3] ?? m[4] ?? '';
  }
  return attrs;
}

function tokenise(source: string): Token[] {
  const tokens: Token[] = [];
  const re = /<(!--[\s\S]*?--|\/[a-zA-Z][^\s>]*|[a-zA-Z][^>]*)>|([^<]+)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(source)) !== null) {
    const tag = m[1];
    const text = m[2];

    if (text !== undefined) {
      const trimmed = text.replace(/\r\n/g, '\n');
      if (trimmed.trim()) tokens.push({ kind: 'text', value: trimmed });
      continue;
    }

    if (!tag || tag.startsWith('!--')) continue;

    if (tag.startsWith('/')) {
      tokens.push({ kind: 'close', tag: tag.slice(1).trim() });
      continue;
    }

    const selfClosing = tag.trimEnd().endsWith('/');
    const inner = selfClosing ? tag.slice(0, tag.lastIndexOf('/')).trim() : tag.trim();
    const spaceIdx = inner.search(/\s/);
    const tagName = spaceIdx === -1 ? inner : inner.slice(0, spaceIdx);
    const attrRaw = spaceIdx === -1 ? '' : inner.slice(spaceIdx + 1);

    tokens.push({ kind: 'open', tag: tagName, attrs: parseAttrs(attrRaw), selfClosing });
  }

  return tokens;
}

const VOID_ELEMENTS = new Set([
  'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr',
]);

export function parse(source: string): ChildNode[] {
  const tokens = tokenise(source);
  const root: ElementNode = { type: 'element', tag: '__root__', attrs: {}, children: [], selfClosing: false };
  const stack: ElementNode[] = [root];

  for (const token of tokens) {
    const parent = stack[stack.length - 1];

    if (token.kind === 'text') {
      parent.children.push({ type: 'text', value: token.value });
      continue;
    }

    if (token.kind === 'close') {
      if (stack.length > 1) stack.pop();
      continue;
    }

    const node: ElementNode = {
      type: 'element',
      tag: token.tag,
      attrs: token.attrs,
      children: [],
      selfClosing: token.selfClosing || VOID_ELEMENTS.has(token.tag.toLowerCase()),
    };
    parent.children.push(node);
    if (!node.selfClosing) stack.push(node);
  }

  return root.children;
}
