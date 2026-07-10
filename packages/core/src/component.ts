export interface ComponentNode {
  tag: string;
  attrs?: Record<string, string | number | boolean | null | undefined>;
  children?: ComponentRenderResult[];
}

export type ComponentRenderResult =
  | string
  | number
  | boolean
  | null
  | undefined
  | ComponentNode
  | (() => ComponentRenderResult);

export interface ComponentDefinition<P extends Record<string, unknown> = Record<string, unknown>> {
  props?: P;
  setup(props: P): ComponentRenderResult;
}

export function defineComponent<P extends Record<string, unknown> = Record<string, unknown>>(
  definition: Omit<ComponentDefinition<P>, 'props'>,
): ComponentDefinition<P> {
  return definition as ComponentDefinition<P>;
}

export function h<P extends Record<string, unknown>>(
  component: ComponentDefinition<P>,
  props: P,
  ...children: ComponentRenderResult[]
): ComponentRenderResult {
  const merged: P = children.length
    ? { ...props, children: [...(((props as Record<string, unknown>).children as ComponentRenderResult[]) ?? []), ...children] }
    : props;
  return component.setup(merged);
}

export function el(
  tag: string,
  attrs: ComponentNode['attrs'] = {},
  ...children: ComponentRenderResult[]
): ComponentNode {
  return { tag, attrs, children };
}

export function isComponentNode(value: unknown): value is ComponentNode {
  return typeof value === 'object' && value !== null && 'tag' in value && typeof (value as ComponentNode).tag === 'string';
}
