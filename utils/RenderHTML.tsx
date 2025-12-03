import React from "react";
import { ScrollView, Text, View } from "react-native";

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
  code: "font-mono text-sm",
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

// Simple HTML parser that works with React Native
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
        nodes.push({
          type: "text",
          content: text,
        });
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
      const content = node.content || null;
      // If nested inside a Text component, return plain string
      // Otherwise wrap in Text component
      if (isNested || !content) {
        return content;
      }
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

      // Apply header styles
      if (HEADER_CLASSES[node.name]) {
        className += HEADER_CLASSES[node.name];
      }
      // Apply other tag styles
      else if (TAG_CLASSES[node.name]) {
        className += TAG_CLASSES[node.name];
      }

      // Add existing class attribute if present
      if (node.attribs?.class) {
        className += " " + node.attribs.class;
      }

      // Handle special cases
      if (node.name === "br") {
        return React.createElement(Text, { key: index }, "\n");
      }

      // Recursively render children
      const isTextComponent = Tag === Text;
      const children = node.children
        ?.map((child, idx) =>
          renderNode(child, idx, node.name, isTextComponent)
        )
        .filter(Boolean);

      // Return null if no children and not a self-closing tag
      if (!children || children.length === 0) {
        return null;
      }

      // Handle list items with bullets/numbers
      if (node.name === "li") {
        const bullet = parentTag === "ul" ? "• " : `${index + 1}. `;
        return React.createElement(
          Text,
          { key: index, className: className },
          bullet,
          children
        );
      }

      // Add spacing for inline code elements
      if (node.name === "code" && isTextComponent) {
        return React.createElement(
          Text,
          { key: index },
          " ",
          React.createElement(Text, { className: className }, children),
          " "
        );
      }

      // Add spacing for other inline elements inside text
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

      // Render the component
      return React.createElement(
        Tag,
        { key: index, className: className },
        children
      );
    }

    return null;
  };

  // Render all root nodes
  const renderedNodes = nodes
    .map((node, idx) => renderNode(node, idx))
    .filter(Boolean);

  return React.createElement(View, { className: "p-4" }, renderedNodes);
}

// Helper function to extract title from parsed HTML
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

// Helper function to extract description (first paragraph)
export function extractDescriptionFromParsed(nodes: ParsedNode[]): string {
  for (const node of nodes) {
    if (node.type === "tag" && node.name === "p") {
      return extractTextContent(node);
    }
    if (node.children) {
      const desc = extractDescriptionFromParsed(node.children);
      if (desc) return desc;
    }
  }
  return "";
}

// Helper to extract plain text from a node
function extractTextContent(node: ParsedNode): string {
  if (node.type === "text") {
    return node.content || "";
  }
  if (node.children) {
    return node.children.map((child) => extractTextContent(child)).join(" ");
  }
  return "";
}

// Export parseHTML so it can be used externally
export { parseHTML };
