import { postData, putData } from "@/utils/fetcher";
import type { AssessmentSecurityPolicy, CaptureState } from "@/types/assessmentAttempt";

type LeaseRequest = {
  session_token: string;
  client_id: string;
  lease_generation: number;
};

export type TakeoverResponse = {
  session_id: number;
  session_token: string;
  lease_generation: number;
  lease_expires_at: string;
  deadline_at: string;
  remaining_seconds: number;
  unload_credential: string;
  security_policy: AssessmentSecurityPolicy;
};

export type HeartbeatResponse = {
  lease_generation: number;
  lease_expires_at?: string | null;
  deadline_at: string;
  remaining_seconds: number;
  capture_required: boolean;
  capture_state: CaptureState;
};

export type AutosaveAnswerResponse = {
  answer_id: number;
  session_question_id: number;
  selected_answer: string | null;
  version: number;
  answer_revision: number;
  idempotent?: boolean;
};

export type SecurityEventResponse = {
  security_event_id: number;
  warning_count: number;
  threshold: number;
  must_submit: boolean;
  idempotent?: boolean;
};

export type AssessmentSecurityEventType =
  | "fullscreen_exit"
  | "focus_loss"
  | "tab_switch"
  | "navigation_attempt";

export const takeoverAssessmentSession = async (
  sessionId: number,
  payload: { client_id: string; expected_generation: number },
) => (await postData<TakeoverResponse>(`/assessment-sessions/${sessionId}/takeover`, payload)).data;

export const heartbeatAssessmentSession = async (
  sessionId: number,
  payload: LeaseRequest,
) => (await postData<HeartbeatResponse>(`/assessment-sessions/${sessionId}/heartbeat`, payload)).data;

export const autosaveAssessmentAnswer = async (
  sessionId: number,
  payload: LeaseRequest & {
    session_question_id: number;
    selected_answer: string | null;
    client_operation_id: string;
    version: number;
  },
) => (await putData<AutosaveAnswerResponse>(`/assessment-sessions/${sessionId}/answers`, payload)).data;

export const reportAssessmentSecurityEvent = async (
  sessionId: number,
  payload: LeaseRequest & {
    event_type: AssessmentSecurityEventType;
    idempotency_key: string;
    payload?: Record<string, unknown>;
  },
) => (await postData<SecurityEventResponse>(`/assessment-sessions/${sessionId}/security-events`, payload)).data;

export const uploadAssessmentIdentityCapture = async (
  sessionId: number,
  payload: LeaseRequest & { image: { uri: string; name: string; type: string } },
  signal?: AbortSignal,
) => {
  const form = new FormData();
  form.append("session_token", payload.session_token);
  form.append("client_id", payload.client_id);
  form.append("lease_generation", String(payload.lease_generation));
  form.append("image", payload.image as any);
  return (await postData(`/assessment-sessions/${sessionId}/identity-capture`, form, {
    "Content-Type": "multipart/form-data",
    "X-Assessment-Session": payload.session_token,
  }, signal)).data;
};
