export function defineComponent(definition) {
    return definition;
}
export function h(component, props, ...children) {
    const merged = children.length
        ? { ...props, children: [...(props.children ?? []), ...children] }
        : props;
    return component.setup(merged);
}
export function el(tag, attrs = {}, ...children) {
    return { tag, attrs, children };
}
export function isComponentNode(value) {
    return typeof value === 'object' && value !== null && 'tag' in value && typeof value.tag === 'string';
}
//# sourceMappingURL=component.js.map