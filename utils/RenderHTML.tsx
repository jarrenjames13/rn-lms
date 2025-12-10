import React from "react";
import { ScrollView, Text, View } from "react-native";

// Mapping HTML tags to React Native components
const TAG_MAP: Record<string, any> = {
  div: View,
  p: Text,
  span: Text,
  h1: Text,
  h2: Text,
  h3: Text,
  h4: Text,
  h5: Text,
  h6: Text,
  ul: View,
  ol: View,
  li: Text,
  pre: ScrollView,
  code: Text,
  strong: Text,
  em: Text,
  a: Text,
  blockquote: View,
};

// Mapping HTML tags to NativeWind classes
const HEADER_CLASSES: Record<string, string> = {
  h1: "text-3xl font-bold my-2",
  h2: "text-2xl font-bold my-2",
  h3: "text-xl font-bold my-2",
  h4: "text-lg font-bold my-2",
  h5: "text-base font-bold my-2",
  h6: "text-sm font-bold my-2",
};

const TAG_CLASSES: Record<string, string> = {
  p: "my-2 py-3 text-base leading-relaxed",
  span: "mx-1",
  ul: "pl-5 my-2",
  ol: "pl-5 my-2",
  li: "my-1 text-base leading-relaxed",
  pre: "bg-gray-100 p-3 rounded my-2",
  code: "font-mono text-sm text-red-700",
  strong: "font-bold mx-0.5",
  em: "italic mx-0.5",
  blockquote: "border-l-4 border-gray-300 pl-4 my-2 italic",
  a: "text-blue-600 underline mx-0.5",
};

interface ParsedNode {
  type: "text" | "tag";
  name?: string;
  content?: string;
  children?: ParsedNode[];
  attribs?: Record<string, string>;
}

// ---------------------- HTML Parsing ----------------------
function parseHTML(html: string): ParsedNode[] {
  const nodes: ParsedNode[] = [];
  const tagRegex =
    /<([a-z0-9]+)([^>]*)>(.*?)<\/\1>|<([a-z0-9]+)([^>]*)\/?>|([^<]+)/gis;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    if (match[6]) {
      // Text node
      const text = match[6].trim();
      if (text) {
        nodes.push({ type: "text", content: text });
      }
    } else if (match[1]) {
      // Paired tag with content
      const tagName = match[1].toLowerCase();
      const attributes = parseAttributes(match[2]);
      const innerContent = match[3];

      nodes.push({
        type: "tag",
        name: tagName,
        attribs: attributes,
        children: parseHTML(innerContent),
      });
    } else if (match[4]) {
      // Self-closing or single tag
      const tagName = match[4].toLowerCase();

      // Ignore lone closing tags like </p>
      if (tagName.startsWith("/")) continue;

      const attributes = parseAttributes(match[5]);
      nodes.push({
        type: "tag",
        name: tagName,
        attribs: attributes,
        children: [],
      });
    }
  }

  return nodes;
}

function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /([a-z-]+)=["']([^"']*)["']/gi;
  let match;

  while ((match = attrRegex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }

  return attrs;
}

// ---------------------- HTML Rendering ----------------------
export function renderHTMLContent(htmlContent: string): React.ReactNode {
  const nodes = parseHTML(htmlContent);

  const renderNode = (
    node: ParsedNode,
    index: number = 0,
    parentTag?: string,
    isNested: boolean = false
  ): React.ReactNode => {
    // Handle text nodes
    if (node.type === "text") {
      const content = node.content?.trim();
      if (!content) return null;
      return React.createElement(
        Text,
        { key: index, className: "text-base mx-1" },
        content
      );
    }

    // Handle element nodes
    if (node.type === "tag" && node.name) {
      const Tag = TAG_MAP[node.name] || View;
      let className = "";

      if (HEADER_CLASSES[node.name]) className += HEADER_CLASSES[node.name];
      else if (TAG_CLASSES[node.name]) className += TAG_CLASSES[node.name];

      if (node.attribs?.class) className += " " + node.attribs.class;

      if (node.name === "br")
        return React.createElement(Text, { key: index }, "\n");

      const isTextComponent = Tag === Text;
      const children = node.children
        ?.map((child, idx) =>
          renderNode(child, idx, node.name, isTextComponent)
        )
        .filter(Boolean);

      // Skip rendering empty nodes for inline tags or paragraphs
      if (
        (!children || children.length === 0) &&
        ["p", "span", "strong", "em", "a", "li"].includes(node.name)
      ) {
        return null;
      }

      // List items
      if (node.name === "li") {
        const bullet = parentTag === "ul" ? "• " : `${index + 1}. `;
        return React.createElement(
          Text,
          { key: index, className: className },
          bullet,
          children
        );
      }

      // Inline code spacing
      if (node.name === "code" && isTextComponent) {
        return React.createElement(
          Text,
          { key: index },
          " ",
          React.createElement(Text, { className: className }, children),
          " "
        );
      }

      // Inline tags inside Text
      if (
        isTextComponent &&
        ["strong", "em", "a", "span"].includes(node.name)
      ) {
        return React.createElement(
          Text,
          { key: index, className: className },
          children
        );
      }

      return React.createElement(
        Tag,
        { key: index, className: className },
        children
      );
    }

    return null;
  };

  const renderedNodes = nodes
    .map((node, idx) => renderNode(node, idx))
    .filter(Boolean);
  return React.createElement(View, { className: "p-4" }, renderedNodes);
}

// ---------------------- HTML Helpers ----------------------
export function extractTitleFromParsed(nodes: ParsedNode[]): string {
  for (const node of nodes) {
    if (
      node.type === "tag" &&
      node.name &&
      ["h1", "h2", "h3", "h4", "h5", "h6"].includes(node.name)
    ) {
      return extractTextContent(node);
    }
    if (node.children) {
      const title = extractTitleFromParsed(node.children);
      if (title) return title;
    }
  }
  return "";
}

export function extractDescriptionFromParsed(nodes: ParsedNode[]): string {
  for (const node of nodes) {
    if (node.type === "tag" && node.name === "p")
      return extractTextContent(node);
    if (node.children) {
      const desc = extractDescriptionFromParsed(node.children);
      if (desc) return desc;
    }
  }
  return "";
}

function extractTextContent(node: ParsedNode): string {
  if (node.type === "text") return node.content || "";
  if (node.children)
    return node.children.map((child) => extractTextContent(child)).join(" ");
  return "";
}

// Export parseHTML for external use
export { parseHTML };
