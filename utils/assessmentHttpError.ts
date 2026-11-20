export type AssessmentHttpError = {
  status?: number;
  code?: string;
  message: string;
  retryable?: boolean;
  retryAfterSeconds?: number;
};

export const getAssessmentHttpError = (
  error: unknown,
  fallback = "The assessment request could not be completed.",
): AssessmentHttpError => {
  const response = (error as any)?.response;
  const detail = response?.data?.detail;
  const headers = response?.headers;
  const retryAfterValue = headers?.get?.("retry-after") ?? headers?.["retry-after"];
  const retryAfterDelta = Number(retryAfterValue);
  const retryAfterDate = typeof retryAfterValue === "string" ? Date.parse(retryAfterValue) : NaN;
  const retryAfter = Number.isFinite(retryAfterDelta)
    ? Math.max(0, retryAfterDelta)
    : Number.isFinite(retryAfterDate)
      ? Math.max(0, Math.ceil((retryAfterDate - Date.now()) / 1000))
      : undefined;
  const code = typeof detail === "object" && detail ? detail.code : undefined;
  const knownMessages: Record<string, string> = {
    EXAM_IP_NOT_ALLOWED:
      "This exam is not available from the current network. Ask your instructor or administrator for an offsite grant, then refresh the exam list.",
    EXTERNAL_EXAM_ACCESS_REVOKED:
      "Offsite exam access is no longer available. Return to campus or ask your instructor for an offsite grant, then refresh the exam list.",
    EXTERNAL_ASSESSMENT_SECURITY_UNAVAILABLE:
      "Offsite exam security is unavailable right now. Try again later or contact your instructor or administrator.",
  };
  return {
    status: response?.status,
    code,
    message:
      typeof detail === "string"
        ? detail
        : typeof detail?.message === "string"
          ? detail.message
          : typeof detail?.error === "string"
            ? detail.error
            : knownMessages[code] ??
              (typeof (error as any)?.message === "string"
                ? (error as any).message
                : fallback),
    retryable: typeof detail === "object" && detail ? detail.retryable : undefined,
    retryAfterSeconds: retryAfter,
  };
};
