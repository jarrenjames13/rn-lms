export type SubmissionReason =
  | "manual"
  | "time_expired"
  | "tab_switch"
  | "navigation_attempt";

export type AttemptStatus =
  | "idle"
  | "starting"
  | "active"
  | "submitting"
  | "submitted"
  | "recovery_error";

export type AssessmentResult = {
  success: boolean;
  score: number;
  correct_answers: number;
  total_questions: number;
  submission_reason: SubmissionReason;
  attempts_made?: number;
  remaining_attempts?: number;
  best_score?: number;
};
