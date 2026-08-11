import Clipboard from "@react-native-clipboard/clipboard";
import RenderHTML, {
  defaultHTMLElementModels,
  type CustomBlockRenderer,
  type MixedStyleRecord,
} from "react-native-render-html";
import React, { useState } from "react";
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { type Theme, useAppTheme } from "@/theme";

interface CodeBlockProps {
  rawText: string;
  theme: Theme;
}

interface DomTextNode {
  name?: string;
  type?: string;
  data?: string;
  children?: readonly DomTextNode[];
}

const HTML_MODELS = {
  // The custom renderer owns <pre> children, so prevent their text nodes from
  // entering the transient whitespace-collapse pass.
  pre: defaultHTMLElementModels.pre.extend({ isOpaque: true }),
};

// Read the parsed DOM rather than transient render nodes, which collapse
// whitespace before custom renderers receive them.
function getRawDomText(node: unknown): string {
  const domNode = node as DomTextNode;
  if (domNode.name === "br") return "\n";
  if (typeof domNode.data === "string") return domNode.data;
  return domNode.children?.map(getRawDomText).join("") ?? "";
}

function CodeBlock({ rawText, theme }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const content = rawText
    .replace(/\r\n?/g, "\n")
    .replace(/^\n+|\n+$/g, "");

  const handleCopy = () => {
    Clipboard.setString(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View className="my-2 w-full" style={{ position: "relative" }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        style={{ backgroundColor: theme.surfaceMuted }}
        className="w-full rounded"
        contentContainerStyle={{ padding: 12, paddingRight: 60 }}
      >
        <Text className="font-mono text-sm" style={{ color: theme.danger }}>
          {content}
        </Text>
      </ScrollView>
      <TouchableOpacity
        onPress={handleCopy}
        activeOpacity={0.75}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          backgroundColor: copied ? theme.success : theme.text,
          borderRadius: 6,
          paddingHorizontal: 10,
          paddingVertical: 4,
        }}
      >
        <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "600" }}>
          {copied ? "Copied!" : "Copy"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function createTagStyles(theme: Theme): MixedStyleRecord {
  return {
    body: { color: theme.text, fontSize: 16, lineHeight: 24 },
    p: { marginTop: 8, marginBottom: 8, lineHeight: 24 },
    h1: { fontSize: 30, lineHeight: 36, fontWeight: "700", marginVertical: 8 },
    h2: { fontSize: 24, lineHeight: 30, fontWeight: "700", marginVertical: 8 },
    h3: { fontSize: 20, lineHeight: 26, fontWeight: "700", marginVertical: 8 },
    h4: { fontSize: 18, lineHeight: 24, fontWeight: "700", marginVertical: 8 },
    h5: { fontSize: 16, lineHeight: 22, fontWeight: "700", marginVertical: 8 },
    h6: { fontSize: 14, lineHeight: 20, fontWeight: "700", marginVertical: 8 },
    ul: { marginVertical: 8, paddingLeft: 20 },
    ol: { marginVertical: 8, paddingLeft: 20 },
    li: { marginVertical: 3, lineHeight: 24 },
    strong: { fontWeight: "700" },
    em: { fontStyle: "italic" },
    code: {
      color: theme.danger,
      fontFamily: "monospace",
      fontSize: 14,
    },
    pre: { whiteSpace: "pre" },
    blockquote: {
      borderLeftColor: theme.border,
      borderLeftWidth: 4,
      paddingLeft: 12,
      marginVertical: 8,
      fontStyle: "italic",
    },
    a: { color: theme.primary, textDecorationLine: "underline" },
  };
}

/**
 * HTML is authored externally, so use an HTML5-aware renderer rather than
 * constructing native Text/View trees from tag strings.
 */
export const HTMLContent = React.memo(function HTMLContent({
  htmlContent,
}: {
  htmlContent: string;
}) {
  const { theme } = useAppTheme();
  const [contentWidth, setContentWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    const width = Math.floor(event.nativeEvent.layout.width);
    if (width !== contentWidth) setContentWidth(width);
  };

  const preRenderer: CustomBlockRenderer = ({ tnode }) => (
    <CodeBlock
      rawText={getRawDomText(tnode.domNode)}
      theme={theme}
    />
  );

  return (
    <View className="w-full" onLayout={onLayout}>
      {contentWidth > 0 && (
        <RenderHTML
          contentWidth={contentWidth}
          source={{ html: htmlContent }}
          baseStyle={{ color: theme.text, fontSize: 16, lineHeight: 24 }}
          tagsStyles={createTagStyles(theme)}
          customHTMLElementModels={HTML_MODELS}
          renderers={{ pre: preRenderer }}
          ignoredDomTags={["script", "style", "iframe", "object", "embed"]}
          enableCSSInlineProcessing={false}
        />
      )}
    </View>
  );
});
