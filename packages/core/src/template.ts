export interface YawnTemplateNode {
  tag: string;
  attrs?: Record<string, string>;
  children?: Array<YawnTemplateNode | string>;
}

// Very small HTML-like parser for .yawn templates.
export function compileYawnTemplate(source: string): YawnTemplateNode {
  const text = source.replace(/\r\n/g, '\n');
  const tokenizer = /<\/?[^>]+>|[^<]+/g;
  const tokens = Array.from(text.matchAll(tokenizer)).map((m) => m[0].trim()).filter(Boolean as any);

  const root: YawnTemplateNode = { tag: 'div', children: [] };
  const stack: YawnTemplateNode[] = [root];

  function parseAttrs(attrText: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const re = /([a-zA-Z0-9\-:]+)=("[^"]*"|'[^']*')/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(attrText))) {
      const name = m[1];
      let val = m[2];
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      attrs[name] = val;
    }
    return attrs;
  }

  for (const token of tokens) {
    if (token.startsWith('</')) {
      // closing tag
      stack.pop();
      continue;
    }

    if (token.startsWith('<')) {
      // opening or self-closing
      const selfClosing = token.endsWith('/>');
      const inner = token.slice(1, token.length - (selfClosing ? 2 : 1)).trim();
      const parts = inner.split(/\s+/);
      const tag = parts[0];
      const rest = inner.slice(tag.length).trim();
      const node: YawnTemplateNode = { tag, attrs: parseAttrs(rest), children: [] };
      const parent = stack[stack.length - 1];
      parent.children = parent.children ?? [];
      parent.children.push(node);
      if (!selfClosing) stack.push(node);
      continue;
    }

    // text node
    const parent = stack[stack.length - 1];
    parent.children = parent.children ?? [];
    parent.children.push(token);
  }

  return root.children && root.children.length === 1 ? (root.children[0] as YawnTemplateNode) : root;
}
