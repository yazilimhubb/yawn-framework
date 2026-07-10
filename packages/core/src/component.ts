export interface ComponentDefinition {
  setup: () => ComponentRenderResult;
}

export type ComponentRenderResult =
  | string
  | number
  | boolean
  | null
  | undefined
  | ComponentNode
  | (() => ComponentRenderResult);

export interface ComponentNode {
  tag: string;
  attrs?: Record<string, string | number | boolean | null | undefined>;
  children?: ComponentRenderResult[];
}

export function defineComponent(definition: ComponentDefinition): ComponentDefinition {
  return definition;
}

export function isComponentNode(value: unknown): value is ComponentNode {
  return typeof value === 'object' && value !== null && 'tag' in value;
}
