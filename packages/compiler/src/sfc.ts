/**
 * Yawn Framework — SFC (.yawn) Compiler v0.2.0
 *
 * Supported directives:
 *   {{ expr }}        reactive text binding
 *   @event="expr"     event handler
 *   :if="expr"        conditional render
 *   :else             else branch (next sibling after :if)
 *   :each="x in xs"   loop (supports $index, x,i in xs)
 *   :bind:attr="expr" dynamic attribute
 *   :class="expr"     dynamic class (string | object | array)
 *   :style="expr"     dynamic style (string | object)
 *   :model="var"      two-way input binding shorthand
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SFCBlock {
  template: string;
  script:   string;
  style:    string;
  meta:     Record<string, string>;
  name:     string;
}

export interface CompiledSFC {
  html:         string;
  clientScript: string;
  styleTag:     string;
}

export interface ScriptAnalysis {
  vars: Array<{ name: string; init: string }>;
  raw:  string;
}

export interface SFCCompileOptions {
  tailwind?:         boolean;
  title?:            string;
  fullPage?:         boolean;
  extraCss?:         string;
  resolveComponent?: (name: string) => string | null | undefined;
}

// ─── Parser ───────────────────────────────────────────────────────────────────

export function parseSFC(source: string, name = 'component'): SFCBlock {
  const extract = (tag: string): string => {
    const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const m = source.match(re);
    return m ? m[1].trim() : '';
  };

  const metaRaw = extract('meta');
  const meta: Record<string, string> = {};
  for (const line of metaRaw.split('\n')) {
    const m = line.match(/^\s*([\w:]+)\s*:\s*(.+)$/);
    if (m) meta[m[1].trim()] = m[2].trim();
  }

  return {
    template: extract('template'),
    script:   extract('script'),
    style:    extract('style'),
    meta,
    name,
  };
}

export function analyzeScript(script: string): ScriptAnalysis {
  const vars: Array<{ name: string; init: string }> = [];
  const re = /(?:let|var|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;\n]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(script)) !== null) {
    vars.push({ name: m[1].trim(), init: m[2].trim() });
  }
  return { vars, raw: script };
}

export function scopeStyle(css: string, scopeId: string): string {
  return css.replace(/([^{}]+)\{/g, (_match, selector: string) => {
    const scoped = selector
      .split(',')
      .map((s: string) => `[data-yawn-scope="${scopeId}"] ${s.trim()}`)
      .join(', ');
    return `${scoped} {`;
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function evalExpr(expr: string, state: Record<string, unknown>): unknown {
  try {
    // eslint-disable-next-line no-new-func
    return new Function(...Object.keys(state), `return (${expr})`)(...Object.values(state));
  } catch {
    return undefined;
  }
}

// ─── SSR Render ───────────────────────────────────────────────────────────────

/**
 * Single-pass SSR renderer.
 * Processes all directives sequentially and returns static HTML.
 * Event handlers are kept as data-yawn-on-* for client hydration.
 */
export function ssrRender(template: string, state: Record<string, unknown>): string {
  let html = template;

  // 1. @event → data-yawn-on-event (must happen before other transforms)
  html = html.replace(/ @([\w:]+)="([^"]*)"/g,
    (_m, ev: string, fn: string) =>
      ` data-yawn-on-${ev}="${fn.replace(/"/g, '&quot;')}"`);

  // 2. :model two-way binding
  html = html.replace(/ :model="(\w+)"/g,
    (_m, v: string) =>
      ` data-yawn-on-input="${v} = event.target.value" data-yawn-model="${v}" value="${esc(state[v] ?? '')}"`);

  // 3. :each loops — process before :if so nested :if works
  html = ssrEach(html, state);

  // 4. :if / :else
  html = ssrIfElse(html, state);

  // 5. :bind:attr
  html = html.replace(/ :bind:([\w-]+)="([^"]+)"/g, (_m, attr: string, expr: string) => {
    const v = evalExpr(expr, state);
    if (v === false || v === null || v === undefined) return '';
    return ` ${attr}="${esc(v)}"`;
  });

  // 6. :class
  html = html.replace(/ :class="([^"]+)"/g, (_m, expr: string) => {
    const v = evalExpr(expr, state);
    if (!v) return '';
    let cls: string;
    if (typeof v === 'object' && !Array.isArray(v)) {
      cls = Object.entries(v as Record<string, unknown>).filter(([, ok]) => ok).map(([k]) => k).join(' ');
    } else if (Array.isArray(v)) {
      cls = v.join(' ');
    } else {
      cls = String(v);
    }
    return cls ? ` class="${esc(cls)}"` : '';
  });

  // 7. :style
  html = html.replace(/ :style="([^"]+)"/g, (_m, expr: string) => {
    const v = evalExpr(expr, state);
    if (!v) return '';
    const s = typeof v === 'object'
      ? Object.entries(v as Record<string, unknown>).map(([k, val]) => `${k}:${val}`).join(';')
      : String(v);
    return s ? ` style="${esc(s)}"` : '';
  });

  // 8. {{ expr }} text bindings
  html = html.replace(/\{\{([^}]+)\}\}/g, (_m, expr: string) => esc(evalExpr(expr.trim(), state)));

  // 9. Strip leftover directives
  html = html.replace(/ @[\w:]+="[^"]*"/g, '');
  html = html.replace(/ :(?:if|else|each|bind:[\w-]+|class|style|model)(?:="[^"]*")?/g, '');

  return html;
}

// ─── :each handler ────────────────────────────────────────────────────────────

function ssrEach(html: string, state: Record<string, unknown>): string {
  // Non-greedy match for self-contained elements with :each
  // We use a simple character-by-character approach to find matching closing tag
  const EACH_OPEN = / :each="(\w+)(?:,\s*(\w+))?\s+in\s+(\w+)"/;
  let result = '';
  let pos = 0;

  while (pos < html.length) {
    // Find next opening tag with :each
    const tagStart = html.indexOf('<', pos);
    if (tagStart === -1) { result += html.slice(pos); break; }

    // Read the tag
    const tagEnd = html.indexOf('>', tagStart);
    if (tagEnd === -1) { result += html.slice(pos); break; }

    const tagHead = html.slice(tagStart, tagEnd + 1);
    const eachMatch = tagHead.match(EACH_OPEN);

    if (!eachMatch) {
      result += html.slice(pos, tagEnd + 1);
      pos = tagEnd + 1;
      continue;
    }

    const [, itemVar, indexVar, listKey] = eachMatch;
    // Extract tag name
    const tagNameMatch = tagHead.match(/^<([a-zA-Z][\w-]*)/);
    if (!tagNameMatch) { result += html.slice(pos, tagEnd + 1); pos = tagEnd + 1; continue; }
    const tagName = tagNameMatch[1];

    // Self-closing?
    if (tagHead.trimEnd().endsWith('/>')) {
      result += html.slice(pos, tagStart);
      pos = tagEnd + 1;
      continue;
    }

    // Find matching closing tag
    const closeTag = `</${tagName}>`;
    let depth = 1;
    let searchPos = tagEnd + 1;
    let innerEnd = -1;

    while (searchPos < html.length && depth > 0) {
      const nextOpen  = html.indexOf(`<${tagName}`, searchPos);
      const nextClose = html.indexOf(closeTag, searchPos);

      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        searchPos = nextOpen + 1;
      } else {
        depth--;
        if (depth === 0) { innerEnd = nextClose; }
        else searchPos = nextClose + 1;
      }
    }

    if (innerEnd === -1) { result += html.slice(pos, tagEnd + 1); pos = tagEnd + 1; continue; }

    result += html.slice(pos, tagStart);

    const inner = html.slice(tagEnd + 1, innerEnd);
    const attrsWithout = tagHead.replace(EACH_OPEN, '').replace(/^<[\w-]+/, '').replace(/>$/, '').replace(/\/$/, '').trim();

    // Get list
    let items: unknown[] = [];
    const raw = state[listKey];
    if (Array.isArray(raw)) {
      items = raw;
    } else if (typeof raw === 'string') {
      try { items = JSON.parse(raw); } catch { items = raw.split(',').map(s => s.trim()).filter(Boolean); }
    }

    result += items.map((val, idx) => {
      const itemState: Record<string, unknown> = {
        ...state,
        [itemVar]: val,
        $index: idx,
        ...(indexVar ? { [indexVar]: idx } : {}),
      };
      const renderedInner = ssrRender(inner, itemState);
      return `<${tagName}${attrsWithout ? ' ' + attrsWithout : ''}>${renderedInner}</${tagName}>`;
    }).join('');

    pos = innerEnd + closeTag.length;
  }

  return result;
}

// ─── :if/:else handler ────────────────────────────────────────────────────────

function ssrIfElse(html: string, state: Record<string, unknown>): string {
  const IF_ATTR   = / :if="([^"]+)"/;
  const ELSE_ATTR = / :else\b/;

  let result = '';
  let pos = 0;

  while (pos < html.length) {
    const tagStart = html.indexOf('<', pos);
    if (tagStart === -1) { result += html.slice(pos); break; }

    const tagEnd = html.indexOf('>', tagStart);
    if (tagEnd === -1) { result += html.slice(pos); break; }

    const tagHead = html.slice(tagStart, tagEnd + 1);
    const ifMatch = tagHead.match(IF_ATTR);

    if (!ifMatch) {
      result += html.slice(pos, tagEnd + 1);
      pos = tagEnd + 1;
      continue;
    }

    const expr = ifMatch[1];
    const tagNameMatch = tagHead.match(/^<([a-zA-Z][\w-]*)/);
    if (!tagNameMatch) { result += html.slice(pos, tagEnd + 1); pos = tagEnd + 1; continue; }
    const tagName = tagNameMatch[1];

    // Find matching close tag
    const closeTag = `</${tagName}>`;
    const innerContent = findMatchingClose(html, tagEnd + 1, tagName);
    if (innerContent === null) { result += html.slice(pos, tagEnd + 1); pos = tagEnd + 1; continue; }

    const { inner, endPos } = innerContent;
    const attrsWithout = tagHead.replace(IF_ATTR, '').replace(/^<[\w-]+/, '').replace(/>$/, '').trim();
    const show = Boolean(evalExpr(expr, state));

    result += html.slice(pos, tagStart);

    // Look ahead for :else sibling
    const afterBlock = html.slice(endPos);
    const elseMatch = afterBlock.match(/^(\s*)<([a-zA-Z][\w-]*)([^>]*?) :else([^>]*)>([\s\S]*?)<\/\2>/);

    if (elseMatch) {
      const [fullElse,,, elseAttrs,, elseInner] = elseMatch;
      if (show) {
        result += `<${tagName}${attrsWithout ? ' ' + attrsWithout : ''}>${ssrRender(inner, state)}</${tagName}>`;
      } else {
        const elseTagName = elseMatch[2];
        const cleanElseAttrs = elseAttrs.replace(/ :else\b/, '');
        result += `<${elseTagName}${cleanElseAttrs}>${ssrRender(elseInner, state)}</${elseTagName}>`;
      }
      pos = endPos + fullElse.length;
    } else {
      if (show) {
        result += `<${tagName}${attrsWithout ? ' ' + attrsWithout : ''}>${ssrRender(inner, state)}</${tagName}>`;
      }
      pos = endPos;
    }
  }

  return result;
}

function findMatchingClose(html: string, startPos: number, tagName: string): { inner: string; endPos: number } | null {
  const openTag  = `<${tagName}`;
  const closeTag = `</${tagName}>`;
  let depth = 1;
  let pos = startPos;

  while (pos < html.length && depth > 0) {
    const nextOpen  = html.indexOf(openTag, pos);
    const nextClose = html.indexOf(closeTag, pos);

    if (nextClose === -1) return null;

    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + openTag.length;
    } else {
      depth--;
      if (depth === 0) {
        return { inner: html.slice(startPos, nextClose), endPos: nextClose + closeTag.length };
      }
      pos = nextClose + closeTag.length;
    }
  }

  return null;
}


// ─── Client Runtime ───────────────────────────────────────────────────────────

export function generateClientRuntime(block: SFCBlock, analysis: ScriptAnalysis): string {
  const { vars } = analysis;
  const scopeId  = block.name;
  const initState = vars.map(v => `  ${v.name}: ${v.init}`).join(',\n');

  return `<script>
(function() {
  'use strict';
  const __raw = {
${initState}
  };

  function __esc(v) {
    if (v == null) return '';
    return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  let __tick = false;
  const state = new Proxy(__raw, {
    set(t, k, v) {
      t[k] = v;
      if (!__tick) { __tick = true; queueMicrotask(() => { __tick = false; __render(); }); }
      return true;
    }
  });

  ${vars.map(v => `Object.defineProperty(window, '${v.name}', { get: () => state['${v.name}'], set: v => { state['${v.name}'] = v; } });`).join('\n  ')}

  const __tpl = ${JSON.stringify(block.template)};
  const __root = document.querySelector('[data-yawn-scope="${scopeId}"]') || document.body;

  // ── Helpers ────────────────────────────────────────────────────────────────
  function __eval(expr, extraState) {
    var s = Object.assign({}, state, extraState || {});
    try { return Function.apply(null, Object.keys(s).concat(['return (' + expr + ')'])).apply(null, Object.values(s)); }
    catch(e) { return undefined; }
  }

  // ── :each ──────────────────────────────────────────────────────────────────
  function __processEach(html) {
    var EACH = / :each="(\\w+)(?:,\\s*(\\w+))?\\s+in\\s+(\\w+)"/;
    var result = '', pos = 0;
    while (pos < html.length) {
      var tagStart = html.indexOf('<', pos);
      if (tagStart === -1) { result += html.slice(pos); break; }
      var tagEnd = html.indexOf('>', tagStart);
      if (tagEnd === -1) { result += html.slice(pos); break; }
      var tagHead = html.slice(tagStart, tagEnd + 1);
      var em = tagHead.match(EACH);
      if (!em) { result += html.slice(pos, tagEnd + 1); pos = tagEnd + 1; continue; }
      var itemVar = em[1], idxVar = em[2], listKey = em[3];
      var tnm = tagHead.match(/^<([a-zA-Z][\\w-]*)/);
      if (!tnm) { result += html.slice(pos, tagEnd + 1); pos = tagEnd + 1; continue; }
      var tn = tnm[1];
      if (tagHead.trimEnd().endsWith('/>')) { result += html.slice(pos, tagStart); pos = tagEnd + 1; continue; }
      var close = '</' + tn + '>';
      var depth = 1, sp = tagEnd + 1, innerEnd = -1;
      while (sp < html.length && depth > 0) {
        var no = html.indexOf('<' + tn, sp), nc = html.indexOf(close, sp);
        if (nc === -1) break;
        if (no !== -1 && no < nc) { depth++; sp = no + 1; }
        else { depth--; if (depth === 0) innerEnd = nc; else sp = nc + 1; }
      }
      if (innerEnd === -1) { result += html.slice(pos, tagEnd + 1); pos = tagEnd + 1; continue; }
      result += html.slice(pos, tagStart);
      var inner = html.slice(tagEnd + 1, innerEnd);
      var attrs = tagHead.replace(EACH, '').replace(/^<[\\w-]+/, '').replace(/>$/, '').replace(/\\/$/, '').trim();
      var rawList = state[listKey];
      var items = Array.isArray(rawList) ? rawList : (typeof rawList === 'string' ? (function(s){ try { return JSON.parse(s); } catch(e) { return s.split(',').map(function(x){return x.trim();}).filter(Boolean); } })(rawList) : []);
      result += items.map(function(val, idx) {
        var extra = {}; extra[itemVar] = val; extra['$index'] = idx; if (idxVar) extra[idxVar] = idx;
        var row = __render2(inner, extra);
        return '<' + tn + (attrs ? ' ' + attrs : '') + '>' + row + '</' + tn + '>';
      }).join('');
      pos = innerEnd + close.length;
    }
    return result;
  }

  // ── :if/:else ──────────────────────────────────────────────────────────────
  function __processIf(html, extraState) {
    var IF_RE = / :if="([^"]+)"/;
    var result = '', pos = 0;
    while (pos < html.length) {
      var tagStart = html.indexOf('<', pos);
      if (tagStart === -1) { result += html.slice(pos); break; }
      var tagEnd = html.indexOf('>', tagStart);
      if (tagEnd === -1) { result += html.slice(pos); break; }
      var tagHead = html.slice(tagStart, tagEnd + 1);
      var im = tagHead.match(IF_RE);
      if (!im) { result += html.slice(pos, tagEnd + 1); pos = tagEnd + 1; continue; }
      var expr = im[1];
      var tnm = tagHead.match(/^<([a-zA-Z][\\w-]*)/);
      if (!tnm) { result += html.slice(pos, tagEnd + 1); pos = tagEnd + 1; continue; }
      var tn = tnm[1], close = '</' + tn + '>';
      var depth = 1, sp = tagEnd + 1, innerEnd = -1;
      while (sp < html.length && depth > 0) {
        var no = html.indexOf('<' + tn, sp), nc = html.indexOf(close, sp);
        if (nc === -1) break;
        if (no !== -1 && no < nc) { depth++; sp = no + 1; }
        else { depth--; if (depth === 0) innerEnd = nc; else sp = nc + 1; }
      }
      if (innerEnd === -1) { result += html.slice(pos, tagEnd + 1); pos = tagEnd + 1; continue; }
      result += html.slice(pos, tagStart);
      var inner = html.slice(tagEnd + 1, innerEnd);
      var attrBase = tagHead.replace(IF_RE, '').replace(/^<[\\w-]+/, '').replace(/>$/, '').trim();
      var s = Object.assign({}, state, extraState || {});
      var show;
      try { show = !!Function.apply(null, Object.keys(s).concat(['return (' + expr + ')'])).apply(null, Object.values(s)); }
      catch(e) { show = false; }
      var endPos = innerEnd + close.length;
      var after = html.slice(endPos);
      var elseM = after.match(/^(\\s*)<([a-zA-Z][\\w-]*)([^>]*?) :else([^>]*)>([\\s\\S]*?)<\\/\\2>/);
      if (elseM) {
        if (show) { result += '<' + tn + (attrBase ? ' ' + attrBase : '') + '>' + __render2(inner, extraState) + '</' + tn + '>'; }
        else {
          var etn = elseM[2], eatts = (elseM[3] + elseM[4]).replace(/ :else\\b/, '');
          result += '<' + etn + eatts + '>' + __render2(elseM[5], extraState) + '</' + etn + '>';
        }
        pos = endPos + elseM[0].length;
      } else {
        if (show) result += '<' + tn + (attrBase ? ' ' + attrBase : '') + '>' + __render2(inner, extraState) + '</' + tn + '>';
        pos = endPos;
      }
    }
    return result;
  }

  // ── Main template renderer ─────────────────────────────────────────────────
  function __render2(tpl, extraState) {
    var h = tpl;
    var es = extraState || {};
    var s = Object.assign({}, state, es);

    // @event → data-yawn-on-event
    h = h.replace(/ @([\\w:]+)="([^"]*)"/g, function(_, ev, fn) {
      return ' data-yawn-on-' + ev + '="' + fn.replace(/"/g, '&quot;') + '"';
    });
    // :model
    h = h.replace(/ :model="(\\w+)"/g, function(_, v) {
      return ' data-yawn-on-input="' + v + ' = event.target.value" data-yawn-model="' + v + '" value="' + __esc(s[v]) + '"';
    });
    // :each
    h = __processEach(h);
    // :if/:else
    h = __processIf(h, es);
    // :bind:attr
    h = h.replace(/ :bind:([\\w-]+)="([^"]+)"/g, function(_, attr, expr) {
      try { var v = Function.apply(null, Object.keys(s).concat(['return (' + expr + ')'])).apply(null, Object.values(s)); return (v != null && v !== false) ? ' ' + attr + '="' + __esc(v) + '"' : ''; } catch(e) { return ''; }
    });
    // :class
    h = h.replace(/ :class="([^"]+)"/g, function(_, expr) {
      try {
        var v = Function.apply(null, Object.keys(s).concat(['return (' + expr + ')'])).apply(null, Object.values(s));
        if (!v) return '';
        if (typeof v === 'object' && !Array.isArray(v)) v = Object.keys(v).filter(function(k){return v[k];}).join(' ');
        if (Array.isArray(v)) v = v.join(' ');
        return v ? ' class="' + __esc(v) + '"' : '';
      } catch(e) { return ''; }
    });
    // :style
    h = h.replace(/ :style="([^"]+)"/g, function(_, expr) {
      try {
        var v = Function.apply(null, Object.keys(s).concat(['return (' + expr + ')'])).apply(null, Object.values(s));
        if (!v) return '';
        if (typeof v === 'object') v = Object.entries(v).map(function(e){return e[0]+':'+e[1];}).join(';');
        return v ? ' style="' + __esc(v) + '"' : '';
      } catch(e) { return ''; }
    });
    // {{ expr }}
    h = h.replace(/\\{\\{([^}]+)\\}\\}/g, function(_, expr) {
      try { return __esc(Function.apply(null, Object.keys(s).concat(['return (' + expr.trim() + ')'])).apply(null, Object.values(s))); }
      catch(e) { return ''; }
    });
    // strip remaining directives
    h = h.replace(/ @[\\w:]+="[^"]*"/g, '');
    h = h.replace(/ :(?:if|else|each|bind:[\\w-]+|class|style|model)(?:="[^"]*")?/g, '');
    return h;
  }

  function __bindEvents() {
    __root.querySelectorAll('*').forEach(function(el) {
      var attrs = Array.from(el.attributes || []);
      for (var i = 0; i < attrs.length; i++) {
        var a = attrs[i];
        if (!a.name.startsWith('data-yawn-on-')) continue;
        var ev = a.name.slice(13), fn = a.value;
        el.removeAttribute(a.name);
        (function(el, ev, fn) {
          el.addEventListener(ev, function(e) {
            try {
              var body = Object.keys(__raw).map(function(k){ return 'var '+k+'=state[\\''+k+'\\'];'; }).join('') + fn + ';' + Object.keys(__raw).map(function(k){ return 'state[\\''+k+'\\']='+k+';'; }).join('');
              Function('e','event','state', body).call(el, e, e, state);
            } catch(err) { console.error('[yawn] handler error:', err); }
          });
        })(el, ev, fn);
      }
      var mv = el.getAttribute && el.getAttribute('data-yawn-model');
      if (mv && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        if (document.activeElement !== el) el.value = state[mv] != null ? String(state[mv]) : '';
      }
    });
  }

  function __render() {
    __root.innerHTML = __render2(__tpl);
    __bindEvents();
  }

  __render();
})();
</script>`;
}

// ─── Full SFC Compiler ────────────────────────────────────────────────────────

export function compileSFC(source: string, name = 'app', options: SFCCompileOptions = {}): CompiledSFC {
  const { tailwind = true, fullPage = true, extraCss, resolveComponent } = options;

  const block    = parseSFC(source, name);
  const analysis = analyzeScript(block.script);

  const title       = options.title ?? block.meta['title'] ?? 'Yawn App';
  const description = block.meta['description'] ?? '';

  // Build initial state from <script> vars
  const initState: Record<string, unknown> = {};
  for (const v of analysis.vars) {
    try { initState[v.name] = new Function(`return (${v.init})`)(); } catch { initState[v.name] = undefined; }
  }

  // Expand component tags before SSR render
  let tpl = block.template;
  if (resolveComponent) {
    tpl = tpl.replace(/<([A-Z][a-zA-Z0-9]*)([^/]*?)\s*\/>/g, (full, compName: string, attrsRaw: string) => {
      const src = resolveComponent(compName);
      if (!src) return full;
      const props: Record<string, string> = {};
      const re = /([\w-]+)="([^"]*)"/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(attrsRaw)) !== null) props[m[1]] = m[2];
      const cb = parseSFC(src, compName);
      const cs: Record<string, unknown> = {};
      for (const v of analyzeScript(cb.script).vars) {
        try { cs[v.name] = new Function(`return (${v.init})`)(); } catch { cs[v.name] = undefined; }
      }
      return ssrRender(cb.template, { ...cs, ...props });
    });
  }

  const ssrHtml    = ssrRender(tpl, initState);
  const styleTag   = block.style ? `<style>\n${scopeStyle(block.style, name)}\n</style>` : '';

  // Client runtime gets the raw template (before component expansion) so reactivity works
  const clientBlock: SFCBlock = { ...block, template: block.template };
  const clientScript = generateClientRuntime(clientBlock, analysis);

  if (!fullPage) {
    const html = `<div data-yawn-scope="${name}">${ssrHtml}</div>${styleTag ? '\n' + styleTag : ''}\n${clientScript}`;
    return { html, clientScript, styleTag };
  }

  const metaTags = [
    description    ? `  <meta name="description" content="${description.replace(/"/g, '&quot;')}" />` : '',
    block.meta['og:title']       ? `  <meta property="og:title" content="${block.meta['og:title']}" />` : '',
    block.meta['og:description'] ? `  <meta property="og:description" content="${block.meta['og:description']}" />` : '',
    block.meta['og:image']       ? `  <meta property="og:image" content="${block.meta['og:image']}" />` : '',
  ].filter(Boolean).join('\n');

  const html = [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `  <title>${title.replace(/</g, '&lt;')}</title>`,
    metaTags,
    tailwind ? '  <script src="https://cdn.tailwindcss.com"></script>' : '',
    extraCss  ? `  <style>${extraCss}</style>` : '',
    styleTag  ? `  ${styleTag}` : '',
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
