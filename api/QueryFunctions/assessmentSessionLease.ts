import { postData, putData } from "@/utils/fetcher";

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
};

export type HeartbeatResponse = {
  lease_generation: number;
  lease_expires_at?: string | null;
  deadline_at: string;
  remaining_seconds: number;
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
    event_type: "fullscreen_exit" | "focus_loss" | "tab_switch";
    idempotency_key: string;
    payload?: Record<string, unknown>;
  },
) => (await postData<SecurityEventResponse>(`/assessment-sessions/${sessionId}/security-events`, payload)).data;
