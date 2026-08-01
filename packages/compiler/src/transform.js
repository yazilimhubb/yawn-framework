function interpolate(text, props) {
    return text.replace(/\{\{([^}]+)\}\}/g, (_m, key) => props[key.trim()] ?? '');
}
function interpolateAttrs(attrs, props) {
    const out = {};
    for (const [k, v] of Object.entries(attrs))
        out[k] = interpolate(v, props);
    return out;
}
function isComponent(tag) {
    return tag.startsWith('con:') || /^[A-Z]/.test(tag);
}
function componentName(tag) {
    return tag.startsWith('con:') ? tag.slice(4) : tag;
}
function evalCondition(expr, props) {
    const t = expr.trim();
    if (t.startsWith('!'))
        return !evalCondition(t.slice(1), props);
    const eq = t.match(/^(\w+)\s*===?\s*['"]([^'"]*)['"]/);
    if (eq)
        return props[eq[1]] === eq[2];
    const neq = t.match(/^(\w+)\s*!==?\s*['"]([^'"]*)['"]/);
    if (neq)
        return props[neq[1]] !== neq[2];
    return Boolean(props[t]);
}
function transformNodeSync(node, options, resolveAndTransform, depth = 0) {
    if (depth > 64)
        return null;
    const props = options.props ?? {};
    if (node.type === 'text') {
        const text = interpolate(node.value, props);
        return text.trim() ? text : null;
    }
    const el = node;
    const ifExpr = el.attrs[':if'] ?? el.attrs['v-if'];
    if (ifExpr !== undefined) {
        if (!evalCondition(ifExpr, props))
            return null;
        const { ':if': _a, 'v-if': _b, ...rest } = el.attrs;
        el.attrs = rest;
    }
    const eachExpr = el.attrs[':each'] ?? el.attrs['v-for'];
    if (eachExpr !== undefined) {
        const m = eachExpr.match(/^(\w+)(?:,\s*(\w+))?\s+in\s+(\w+)$/);
        if (m) {
            const [, itemVar, indexVar, listKey] = m;
            const rawList = props[listKey];
            let items = [];
            try {
                items = rawList ? JSON.parse(rawList) : [];
            }
            catch {
                items = rawList ? rawList.split(',').map(s => s.trim()) : [];
            }
            const { ':each': _a, 'v-for': _b, ...restAttrs } = el.attrs;
            const result = [];
            for (let i = 0; i < items.length; i++) {
                const itemProps = {
                    ...props, [itemVar]: String(items[i]),
                    ...(indexVar ? { [indexVar]: String(i) } : {}),
                };
                const cloned = { type: 'element', tag: el.tag, attrs: { ...restAttrs }, children: el.children, selfClosing: el.selfClosing };
                const t = transformNodeSync(cloned, { ...options, props: itemProps }, resolveAndTransform, depth + 1);
                if (t !== null)
                    Array.isArray(t) ? result.push(...t) : result.push(t);
            }
            return result;
        }
    }
    if (isComponent(el.tag)) {
        const name = componentName(el.tag);
        const resolved = options.resolveComponent?.(name);
        if (resolved != null) {
            return resolveAndTransform(resolved, { ...props, ...interpolateAttrs(el.attrs, props) });
        }
    }
    const attrs = {};
    for (const [k, v] of Object.entries(el.attrs)) {
        if (k.startsWith('@') || k.startsWith('v-on:'))
            continue;
        attrs[k] = interpolate(v, props);
    }
    const children = [];
    for (const child of el.children) {
        const t = transformNodeSync(child, options, resolveAndTransform, depth + 1);
        if (t !== null)
            Array.isArray(t) ? children.push(...t) : children.push(t);
    }
    const result = { tag: el.tag };
    if (Object.keys(attrs).length)
        result.attrs = attrs;
    if (children.length)
        result.children = children;
    return result;
}
export function transform(nodes, options = {}) {
    const resolveAndTransform = options._resolveAndTransform ?? (() => ({ tag: 'div' }));
    const children = [];
    for (const node of nodes) {
        const t = transformNodeSync(node, options, resolveAndTransform);
        if (t !== null)
            Array.isArray(t) ? children.push(...t) : children.push(t);
    }
    if (children.length === 1 && typeof children[0] !== 'string')
        return children[0];
    return { tag: 'div', children };
}
//# sourceMappingURL=transform.js.map