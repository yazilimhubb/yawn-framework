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
export declare function parse(source: string): ChildNode[];
//# sourceMappingURL=parser.d.ts.map