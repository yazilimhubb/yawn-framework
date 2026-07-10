/**
 * Single File Component (.yawn) parser and compiler.
 *
 * A .yawn file has three optional blocks:
 *
 *   <template>   — HTML markup with directives
 *   <script>     — JavaScript (variable declarations only, no boilerplate)
 *   <style>      — CSS (scoped to the component)
 *
 * Directives supported in <template>:
 *   {{ expr }}       — reactive text binding
 *   @click="expr"    — event handler (any DOM event: @input, @submit, etc.)
 *   :if="expr"       — conditional render
 *   :else            — else branch (sibling of :if element)
 *   :each="x in xs"  — loop
 *   :bind:attr="expr"— dynamic attribute binding
 *   :class="expr"    — dynamic class binding
 *   :style="expr"    — dynamic style binding
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SFCBlock {
  template: string;
  script: string;
  style: string;
  /** Component file name (without extension), used for scoped style prefix */
  name: string;
}

export interface CompiledSFC {
  /** Full HTML page or fragment ready to serve */
  html: string;
  /** Inline <script> tag with reactive runtime */
  clientScript: string;
  /** Inline <style> tag */
  styleTag: string;
}

// ─── Parser ──────────────────────────────────────────────────────────────────

export function parseSFC(source: string, name = 'component'): SFCBlock {
  const extract = (tag: string): string => {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const m = source.match(re);
    return m ? m[1].trim() : '';
  };

  return {
    template: extract('template'),
    script: extract('script'),
    style: extract('style'),
    name,
  };
}

// ─── Template compiler ───────────────────────────────────────────────────────

const VOID_TAGS = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);

function escHtml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/**
 * Compile the template block into a JS function body that returns a DOM tree
 * description, plus extract all reactive dependencies.
 */
export function compileTemplate(template: string): {
  renderFn: string;
  deps: string[];
} {
  // Collect all {{ expr }} expressions as reactive dependencies
  const deps: string[] = [];
  const exprRe = /\{\{([^}]+)\}\}/g;
  let m: RegExpExecArray | null;
  while ((m = exprRe.exec(template)) !== null) {
    const expr = m[1].trim();
    // extract variable names from expression
    const vars = expr.match(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g) ?? [];
    deps.push(...vars);
  }

  // Build a render function as a string
  // The render function returns an HTML string with data-yawn-* attributes
  // for client-side hydration
  const renderFn = buildRenderFn(template);

  return { renderFn, deps: [...new Set(deps)] };
}

function buildRenderFn(template: string): string {
  // We compile template into a JS template literal
  // Directives are processed server-side for SSR and kept as data attrs for client
  let out = template;

  // 1. Process {{ expr }} → ${__esc(expr)} in JS template literal
  //    Also add data-yawn-bind for client hydration
  out = out.replace(/\{\{([^}]+)\}\}/g, (_m, expr) => {
    return `\${__esc(${expr.trim()})}`;
  });

  return `(function(__esc, __state) { with(__state) { return \`${out}\`; } })`;
}

// ─── Script compiler ─────────────────────────────────────────────────────────

export interface ScriptAnalysis {
  /** All `let`/`var` variable declarations found */
  vars: Array<{ name: string; init: string }>;
  /** Raw script content */
  raw: string;
}

export function analyzeScript(script: string): ScriptAnalysis {
  const vars: Array<{ name: string; init: string }> = [];

  // Match: let/var/const name = value;
  const re = /(?:let|var|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;\n]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(script)) !== null) {
    vars.push({ name: m[1].trim(), init: m[2].trim() });
  }

  return { vars, raw: script };
}

// ─── Style compiler ──────────────────────────────────────────────────────────

export function scopeStyle(css: string, scopeId: string): string {
  // Prefix every selector with [data-yawn-scope="scopeId"]
  return css.replace(/([^{}]+)\{/g, (match, selector) => {
    const scoped = selector
      .split(',')
      .map((s: string) => `[data-yawn-scope="${scopeId}"] ${s.trim()}`)
      .join(', ');
    return `${scoped} {`;
  });
}

// ─── Client runtime generator ────────────────────────────────────────────────

/**
 * Generate the client-side reactive runtime script for a component.
 * This script is inlined in the HTML and handles:
 *  - Reactive state (Proxy-based)
 *  - DOM updates on state change
 *  - Event binding (@click etc.)
 *  - :if / :each directives
 */
export function generateClientRuntime(block: SFCBlock, analysis: ScriptAnalysis): string {
  const { vars } = analysis;
  const scopeId = block.name;

  const initState = vars.map(v => `  ${v.name}: ${v.init}`).join(',\n');

  return `
<script>
(function() {
  // ── State ──
  const __rawState = {
${initState}
  };

  // ── Escape helper ──
  function __esc(v) {
    if (v == null) return '';
    return String(v)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }

  // ── Reactive proxy ──
  let __scheduled = false;
  const state = new Proxy(__rawState, {
    set(target, key, value) {
      target[key] = value;
      if (!__scheduled) {
        __scheduled = true;
        queueMicrotask(() => { __scheduled = false; __render(); });
      }
      return true;
    }
  });

  // Make state vars available as globals in handlers
  ${vars.map(v => `Object.defineProperty(window, '${v.name}', { get: () => state['${v.name}'], set: v => { state['${v.name}'] = v; } });`).join('\n  ')}

  // ── Template ──
  const __template = ${JSON.stringify(block.template)};

  // ── Compile template to render fn ──
  function __renderTemplate() {
    let html = __template;

    // :each directive
    html = html.replace(/<([a-zA-Z][\\w-]*)([^>]*?):each="(\\w+)\\s+in\\s+(\\w+)"([^>]*)>([\\s\\S]*?)<\\/\\1>/g,
      (_, tag, pre, item, list, post, inner) => {
        const items = state[list] ?? [];
        return items.map((val, idx) => {
          let row = inner;
          row = row.replace(new RegExp('\\\\{\\\\{\\\\s*' + item + '\\\\s*\\\\}\\\\}', 'g'), __esc(val));
          row = row.replace(/\\{\\{\\s*\\$index\\s*\\}\\}/g, idx);
          return \`<\${tag}\${pre}\${post}>\${row}</\${tag}>\`;
        }).join('');
      }
    );

    // :if directive
    html = html.replace(/<([a-zA-Z][\\w-]*)([^>]*?):if="([^"]+)"([^>]*)>([\\s\\S]*?)<\\/\\1>/g,
      (_, tag, pre, expr, post, inner) => {
        try {
          const result = Function(...Object.keys(__rawState), \`return (\${expr})\`)(...Object.values(state));
          return result ? \`<\${tag}\${pre}\${post}>\${inner}</\${tag}>\` : '';
        } catch { return ''; }
      }
    );

    // {{ expr }} bindings
    html = html.replace(/\\{\\{([^}]+)\\}\\}/g, (_, expr) => {
      try {
        const val = Function(...Object.keys(__rawState), \`return (\${expr.trim()})\`)(...Object.values(state));
        return __esc(val);
      } catch { return ''; }
    });

    // Strip remaining directives from HTML output
    html = html.replace(/\\s*@[\\w:]+="[^"]*"/g, '');
    html = html.replace(/\\s*:(?:if|each|class|style|bind:[\\w-]+)="[^"]*"/g, '');
    html = html.replace(/\\s*:else\\b/g, '');

    return html;
  }

  // ── Mount ──
  const __root = document.querySelector('[data-yawn-scope="${scopeId}"]') || document.body;

  function __render() {
    __root.innerHTML = __renderTemplate();
    __bindEvents();
  }

  // ── Event binding ──
  function __bindEvents() {
    __root.querySelectorAll('*').forEach(el => {
      // Read event attrs from template (we keep them as data-yawn-on-* during parse)
      const attrs = Array.from(el.attributes ?? []);
      for (const attr of attrs) {
        if (attr.name.startsWith('data-yawn-on-')) {
          const event = attr.name.slice('data-yawn-on-'.length);
          const handler = attr.value;
          el.removeAttribute(attr.name);
          el.addEventListener(event, (e) => {
            try {
              Function('e', 'event', ...Object.keys(__rawState),
                \`\${Object.keys(__rawState).map(k => \`let \${k} = state['\${k}']; \`).join('')}\${handler};\${Object.keys(__rawState).map(k => \`state['\${k}'] = \${k};\`).join('')}\`
              ).call(el, e, e, ...Object.values(state));
            } catch(err) { console.error('[yawn] handler error:', err); }
          });
        }
      }
    });
  }

  // ── Initial render ──
  __render();
})();
</script>`.trim();
}

// ─── Full SFC compiler ───────────────────────────────────────────────────────

export interface SFCCompileOptions {
  /** Use Tailwind CSS CDN. Default: true */
  tailwind?: boolean;
  /** Page title */
  title?: string;
  /** Whether to output a full HTML page or just a fragment */
  fullPage?: boolean;
}

export function compileSFC(source: string, name = 'app', options: SFCCompileOptions = {}): CompiledSFC {
  const { tailwind = true, title = 'Yawn App', fullPage = true } = options;
  const block = parseSFC(source, name);
  const analysis = analyzeScript(block.script);

  // Pre-process template: convert @event="..." to data-yawn-on-event="..."
  // so they survive HTML serialisation
  let processedTemplate = block.template;
  processedTemplate = processedTemplate.replace(
    /\s@([\w:]+)="([^"]*)"/g,
    (_m, event, handler) => ` data-yawn-on-${event}="${handler.replace(/"/g, '&quot;')}"`
  );

  // Build scoped style
  const styleTag = block.style
    ? `<style>\n${scopeStyle(block.style, name)}\n</style>`
    : '';

  // Build initial HTML (SSR-like: render with initial state)
  const initState: Record<string, unknown> = {};
  for (const v of analysis.vars) {
    try { initState[v.name] = Function(`return (${v.init})`)(); } catch { initState[v.name] = undefined; }
  }

  function escHtmlVal(v: unknown): string {
    return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // SSR render pass
  let ssrHtml = processedTemplate;

  // :each
  ssrHtml = ssrHtml.replace(
    /<([a-zA-Z][\w-]*)([^>]*?):each="(\w+)\s+in\s+(\w+)"([^>]*)>([\s\S]*?)<\/\1>/g,
    (_, tag, pre, item, list, post, inner) => {
      const items = (initState[list] as unknown[]) ?? [];
      return (items as unknown[]).map((val, idx) => {
        let row = inner;
        row = row.replace(new RegExp(`\\{\\{\\s*${item}\\s*\\}\\}`, 'g'), escHtmlVal(val));
        row = row.replace(/\{\{\s*\$index\s*\}\}/g, String(idx));
        return `<${tag}${pre}${post}>${row}</${tag}>`;
      }).join('');
    }
  );

  // :if
  ssrHtml = ssrHtml.replace(
    /<([a-zA-Z][\w-]*)([^>]*?):if="([^"]+)"([^>]*)>([\s\S]*?)<\/\1>/g,
    (_, tag, pre, expr, post, inner) => {
      try {
        const result = Function(...Object.keys(initState), `return (${expr})`)(...Object.values(initState));
        return result ? `<${tag}${pre}${post}>${inner}</${tag}>` : '';
      } catch { return ''; }
    }
  );

  // {{ expr }}
  ssrHtml = ssrHtml.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    try {
      const val = Function(...Object.keys(initState), `return (${expr.trim()})`)(...Object.values(initState));
      return escHtmlVal(val);
    } catch { return ''; }
  });

  // Strip @event directives that weren't converted (bare attrs)
  ssrHtml = ssrHtml.replace(/\s@[\w:]+="[^"]*"/g, '');

  const clientScript = generateClientRuntime({ ...block, template: processedTemplate }, analysis);

  const bodyContent = `<div data-yawn-scope="${name}">${ssrHtml}</div>\n${styleTag}\n${clientScript}`;

  if (!fullPage) {
    return { html: bodyContent, clientScript, styleTag };
  }

  const html = [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `  <title>${escHtml(title)}</title>`,
    tailwind ? '  <script src="https://cdn.tailwindcss.com"></script>' : '',
    styleTag ? `  ${styleTag}` : '',
    '</head>',
    '<body>',
    `  <div data-yawn-scope="${name}">`,
    `    ${ssrHtml}`,
    '  </div>',
    `  ${clientScript}`,
    '</body>',
    '</html>',
  ].filter(Boolean).join('\n');

  return { html, clientScript, styleTag };
}
