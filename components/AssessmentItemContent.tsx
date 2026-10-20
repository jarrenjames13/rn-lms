import React from "react";
import { Text } from "react-native";
import { HTMLContent } from "@/utils/RenderHTML";
import { selectExamContent } from "@/utils/examContentPolicy";

interface AssessmentItemContentProps {
  contentFormatVersion: unknown;
  htmlContent?: string | null;
  plainText: string;
  plainTextClassName?: string;
}

export function AssessmentItemContent({
  contentFormatVersion,
  htmlContent,
  plainText,
  plainTextClassName,
}: AssessmentItemContentProps) {
  const content = selectExamContent(contentFormatVersion, htmlContent, plainText);

  if (content.kind === "rich") {
    return <HTMLContent htmlContent={content.value} />;
  }

  return <Text className={plainTextClassName}>{content.value}</Text>;
}
