export type ExamContentSource =
  | { kind: "rich"; value: string }
  | { kind: "plain"; value: string };

export function selectExamContent(
  formatVersion: unknown,
  richHtml: unknown,
  plainText: string,
): ExamContentSource;

export function getEmbeddedMediaHeaders(
  uri: string,
  tagName: string,
  apiBaseUrl: string | undefined,
  authCookie: string | null,
): { Cookie: string } | null;
