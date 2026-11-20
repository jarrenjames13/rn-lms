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
  | "finalization_pending"
  | "submitted"
  | "recovery_error";

export type CaptureState =
  | "not_required"
  | "scheduled"
  | "due"
  | "uploaded"
  | "missed";

export type AssessmentSecurityPolicy = {
  auto_submit_on_violation: boolean;
  focus_threshold: number;
  fullscreen_threshold: number;
};

export type AssessmentResult = {
  success?: boolean;
  score: number | null;
  correct_answers: number | null;
  total_questions: number;
  submission_reason: SubmissionReason;
  attempts_made?: number;
  remaining_attempts?: number;
  best_score?: number;
  review_status?: string;
  grade_status?: string;
  message?: string | null;
  capture_state?: CaptureState | string;
};

export type AssessmentSessionMetadata = {
  session_id?: string | number;
  lease_generation?: number;
  client_id?: string;
  unload_credential?: string;
  security_policy?: AssessmentSecurityPolicy;
  camera_required?: boolean;
  capture_state?: CaptureState;
  focus_loss_count?: number;
  fullscreen_exit_count?: number;
  answer_revision?: number;
  resumed?: boolean;
};
