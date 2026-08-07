import Clipboard from "@react-native-clipboard/clipboard";
import React, { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

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
  pre: "my-2", // layout/padding handled directly in renderNode
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

// These tags capture their inner content as raw text — children are never
// re-parsed as HTML. This prevents literal <script>, <code>, <pre> etc.
// that appear *as display content* inside a code block from confusing the parser.
const RAW_CONTENT_TAGS = new Set(["script", "style", "pre"]);

/**
 * Recursive-descent HTML parser.
 *
 * Why not regex? The original regex parser used a non-greedy .*? match for inner
 * content, which breaks the moment any tag is nested (it stops at the first
 * closing tag it sees, not the matching one). This version tracks depth properly.
 *
 * Key design: RAW_CONTENT_TAGS grab everything between their open/close tags as a
 * single text node without recursing, so embedded HTML (like <script> inside <pre>)
 * can never escape and corrupt the surrounding parse tree.
 */
function parseHTML(html: string): ParsedNode[] {
  const nodes: ParsedNode[] = [];
  let i = 0;

  while (i < html.length) {
    // ── Text node ──────────────────────────────────────────────────────────
    if (html[i] !== "<") {
      const end = html.indexOf("<", i);
      const text = end === -1 ? html.slice(i) : html.slice(i, end);
      if (text.trim()) nodes.push({ type: "text", content: text });
      i = end === -1 ? html.length : end;
      continue;
    }

    // ── Closing tag — caller handles advancing past it ─────────────────────
    if (html[i + 1] === "/") break;

    // ── Opening tag ────────────────────────────────────────────────────────
    const tagEnd = html.indexOf(">", i);
    if (tagEnd === -1) {
      i = html.length;
      break;
    }

    const tagContent = html.slice(i + 1, tagEnd);
    const selfClosing = tagContent.trimEnd().endsWith("/");
    const tagBody = selfClosing
      ? tagContent.slice(0, tagContent.lastIndexOf("/")).trim()
      : tagContent.trim();
    const spaceIdx = tagBody.search(/\s/);
    const tagName = (
      spaceIdx === -1 ? tagBody : tagBody.slice(0, spaceIdx)
    ).toLowerCase();
    const attrStr = spaceIdx === -1 ? "" : tagBody.slice(spaceIdx + 1);
    const attribs = parseAttributes(attrStr);
    i = tagEnd + 1;

    if (!tagName) continue;

    const voidTags = new Set(["br", "hr", "img", "input", "link", "meta"]);
    if (selfClosing || voidTags.has(tagName)) {
      nodes.push({ type: "tag", name: tagName, attribs, children: [] });
      continue;
    }

    const closeTag = `</${tagName}>`;

    if (RAW_CONTENT_TAGS.has(tagName)) {
      // ── Raw-text tag: grab everything until the matching close tag ────────
      // We count open/close pairs so a nested <pre> inside <pre> (rare but valid)
      // doesn't cause us to stop too early.
      const openTagStr = `<${tagName}`;
      let depth = 1;
      let j = i;
      const rawStart = i;

      while (depth > 0 && j < html.length) {
        const nextOpen = html.toLowerCase().indexOf(openTagStr, j);
        const nextClose = html.toLowerCase().indexOf(closeTag.toLowerCase(), j);

        if (nextClose === -1) {
          j = html.length;
          break;
        }

        if (nextOpen !== -1 && nextOpen < nextClose) {
          const ca = html[nextOpen + openTagStr.length];
          if (
            ca === ">" ||
            ca === " " ||
            ca === "\n" ||
            ca === "\r" ||
            ca === "/"
          )
            depth++;
          j = nextOpen + openTagStr.length;
        } else {
          depth--;
          if (depth === 0) {
            const rawText = html.slice(rawStart, nextClose);
            nodes.push({
              type: "tag",
              name: tagName,
              attribs,
              children: rawText ? [{ type: "text", content: rawText }] : [],
            });
            i = nextClose + closeTag.length;
            break;
          }
          j = nextClose + closeTag.length;
        }
      }

      if (depth > 0) {
        const rawText = html.slice(rawStart);
        nodes.push({
          type: "tag",
          name: tagName,
          attribs,
          children: rawText ? [{ type: "text", content: rawText }] : [],
        });
        i = html.length;
      }
    } else {
      // ── Normal tag: recurse with depth tracking ───────────────────────────
      const openTag = `<${tagName}`;
      let depth = 1,
        j = i;

      while (depth > 0 && j < html.length) {
        const nextOpen = html.toLowerCase().indexOf(openTag, j);
        const nextClose = html.toLowerCase().indexOf(closeTag.toLowerCase(), j);
        if (nextClose === -1) {
          j = html.length;
          break;
        }
        if (nextOpen !== -1 && nextOpen < nextClose) {
          const ca = html[nextOpen + openTag.length];
          if (ca === ">" || ca === " " || ca === "/") depth++;
          j = nextOpen + openTag.length;
        } else {
          depth--;
          if (depth === 0) {
            const innerHTML = html.slice(i, nextClose);
            nodes.push({
              type: "tag",
              name: tagName,
              attribs,
              children: parseHTML(innerHTML),
            });
            i = nextClose + closeTag.length;
            break;
          }
          j = nextClose + closeTag.length;
        }
      }
      if (depth > 0) {
        nodes.push({
          type: "tag",
          name: tagName,
          attribs,
          children: parseHTML(html.slice(i)),
        });
        i = html.length;
      }
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

// ---------------------- Shared Helpers ----------------------
function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(text: string): string {
  return text.replace(/<\/?[a-z][^>]*>/gi, "");
}

// ---------------------- Code Block Component ----------------------
interface CodeBlockProps {
  rawText: string;
  blockIndex: number;
}

function CodeBlock({
  rawText,
  blockIndex,
}: CodeBlockProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const decoded = decodeEntities(stripTags(rawText)).trim();

  const handleCopy = () => {
    Clipboard.setString(decoded);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return React.createElement(
    View,
    { style: { position: "relative" as const }, className: "my-2" },
    React.createElement(
      ScrollView,
      {
        horizontal: true,
        showsHorizontalScrollIndicator: true,
        className: "bg-gray-100 rounded",
        contentContainerStyle: { padding: 12, paddingRight: 60 },
      },
      React.createElement(
        Text,
        { className: "font-mono text-sm text-red-700" },
        decoded,
      ),
    ),
    React.createElement(
      TouchableOpacity,
      {
        onPress: handleCopy,
        activeOpacity: 0.75,
        style: {
          position: "absolute" as const,
          top: 8,
          right: 8,
          backgroundColor: copied ? "#16a34a" : "#374151",
          borderRadius: 6,
          paddingHorizontal: 10,
          paddingVertical: 4,
          zIndex: 10,
        },
      },
      React.createElement(
        Text,
        { style: { color: "#fff", fontSize: 11, fontWeight: "600" as const } },
        copied ? "Copied!" : "Copy",
      ),
    ),
  );
}

// ---------------------- HTML Rendering ----------------------
export function renderHTMLContent(htmlContent: string): React.ReactNode {
  const nodes = parseHTML(htmlContent);

  const renderNode = (
    node: ParsedNode,
    index: number = 0,
    parentTag?: string,
    isNested: boolean = false,
  ): React.ReactNode => {
    // Handle text nodes
    if (node.type === "text") {
      const content = node.content?.trim();
      if (!content) return null;
      const decoded = decodeEntities(content);
      return React.createElement(
        Text,
        { key: index, className: "text-base mx-1" },
        decoded,
      );
    }

    // Handle element nodes
    if (node.type === "tag" && node.name) {
      // script/style — render as inert literal text, never execute
      if (node.name === "script" || node.name === "style") {
        const raw =
          node.children
            ?.filter((c) => c.type === "text")
            .map((c) => c.content)
            .join("") || "";
        return React.createElement(
          Text,
          { key: index, className: "font-mono text-sm text-red-700" },
          `<${node.name}>${raw}</${node.name}>`,
        );
      }

      // pre — dedicated CodeBlock with horizontal scroll + copy button
      if (node.name === "pre") {
        const raw =
          node.children
            ?.filter((c) => c.type === "text")
            .map((c) => c.content)
            .join("") ?? "";
        return React.createElement(CodeBlock, {
          key: index,
          rawText: raw,
          blockIndex: index,
        });
      }

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
          renderNode(child, idx, node.name, isTextComponent),
        )
        .filter(Boolean);

      if (
        (!children || children.length === 0) &&
        ["p", "span", "strong", "em", "a", "li"].includes(node.name)
      ) {
        return null;
      }

      if (node.name === "li") {
        const bullet = parentTag === "ul" ? "• " : `${index + 1}. `;
        return React.createElement(
          Text,
          { key: index, className },
          bullet,
          children,
        );
      }

      if (node.name === "code" && isTextComponent) {
        return React.createElement(
          Text,
          { key: index },
          " ",
          React.createElement(Text, { className }, children),
          " ",
        );
      }

      if (
        isTextComponent &&
        ["strong", "em", "a", "span"].includes(node.name)
      ) {
        return React.createElement(Text, { key: index, className }, children);
      }

      return React.createElement(Tag, { key: index, className }, children);
    }

    return null;
  };

  const renderedNodes = nodes
    .map((node, idx) => renderNode(node, idx))
    .filter(Boolean);
  return React.createElement(View, { className: "p-4" }, renderedNodes);
}

// Keep parsing out of parent render paths. The component only re-renders when
// the HTML string changes, while still preserving stateful code blocks.
export const HTMLContent = React.memo(function HTMLContent({
  htmlContent,
}: {
  htmlContent: string;
}) {
  return renderHTMLContent(htmlContent);
});

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
  if (node.children) return node.children.map(extractTextContent).join(" ");
  return "";
}

export { parseHTML };
