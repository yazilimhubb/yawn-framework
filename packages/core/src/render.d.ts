import type { ComponentDefinition, ComponentRenderResult } from './component.js';
export declare function escapeHtml(value: string): string;
export declare function renderNode(node: ComponentRenderResult): string;
export declare function renderToHtml(root: ComponentDefinition): string;
export declare function renderToContainer(root: ComponentDefinition, container: Pick<HTMLElement, 'innerHTML'>): void;
//# sourceMappingURL=render.d.ts.map