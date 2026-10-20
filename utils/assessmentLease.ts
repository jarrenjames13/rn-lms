export type AssessmentLeaseEvent = {
  code?: string;
  type?: string;
  category?: "quiz" | "exam";
  assessment_id?: number;
  instance_id?: number;
  session_id?: string | number;
  session_token?: string;
  lease_generation?: number;
  lease_token?: string;
  detail?: unknown;
  source?: "api" | "sse";
  request_session_token?: string;
};

type LeaseListener = (event: AssessmentLeaseEvent) => void;

const takeoverCodes = new Set([
  "assessment_lease_taken_over",
  "assessment_session_evicted",
  "assessment_session_taken_over",
  "lease_taken_over",
  "session_taken_over",
]);
const listeners = new Set<LeaseListener>();
const evictedCredentials = new Set<string>();

const normalizeCode = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase().replaceAll("-", "_") : "";

export const getAssessmentLeaseEvent = (value: unknown): AssessmentLeaseEvent | null => {
  if (!value || typeof value !== "object") return null;
  const event = value as AssessmentLeaseEvent;
  if (takeoverCodes.has(normalizeCode(event.code || event.type))) return event;
  return event.detail && event.detail !== value
    ? getAssessmentLeaseEvent(event.detail)
    : null;
};

export const publishAssessmentLeaseTakenOver = (
  value: unknown,
  source: "api" | "sse" = "api",
  requestSessionToken?: string,
): boolean => {
  const event = getAssessmentLeaseEvent(value);
  if (!event) return false;
  listeners.forEach((listener) =>
    listener({ ...event, source, request_session_token: requestSessionToken }),
  );
  return true;
};

export const onAssessmentLeaseTakenOver = (listener: LeaseListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const admitAssessmentLease = (...credentials: (string | undefined)[]) => {
  credentials.forEach((credential) => {
    if (credential) evictedCredentials.delete(credential);
  });
};

export const evictAssessmentLease = (...credentials: (string | undefined)[]) => {
  credentials.forEach((credential) => {
    if (credential) evictedCredentials.add(credential);
  });
};

export const isAssessmentLeaseEvicted = (...credentials: (string | undefined)[]) =>
  credentials.some((credential) => !!credential && evictedCredentials.has(credential));
