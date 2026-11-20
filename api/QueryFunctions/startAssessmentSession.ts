import { postData } from "@/utils/fetcher";

export type StartSessionPayload = {
  assessment_id: number;
  instance_id: number;
  category: "quiz" | "exam";
  client_id: string;
};

export type StartSessionResponse = {
  session_token: string;
  started_at: string;
  deadline_at: string;
  session_id: number;
  remaining_seconds: number | null;
  resumed: boolean;
  lease_generation: number;
  unload_credential: string;
  security_policy: {
    auto_submit_on_violation: boolean;
    focus_threshold: number;
    fullscreen_threshold: number;
  };
  camera_required: boolean;
  capture_state: "not_required" | "scheduled" | "due" | "uploaded" | "missed";
};

export const startAssessmentSession = async (
  payload: StartSessionPayload,
): Promise<StartSessionResponse> => {
  const response = await postData<StartSessionResponse>(
    "/assessment-sessions/start-assessment-session",
    payload,
  );
  const data = response.data;
  const deadline = new Date(data?.deadline_at).getTime();

  if (!data?.session_token?.trim()) {
    throw new Error("The assessment session did not return a valid session token.");
  }
  if (!Number.isFinite(deadline)) {
    throw new Error("The assessment session did not return a valid deadline.");
  }
  if (!Number.isInteger(data.session_id) || data.session_id < 1) {
    throw new Error("The assessment session did not return a valid session ID.");
  }
  if (!Number.isInteger(data.lease_generation) || data.lease_generation < 1) {
    throw new Error("The assessment session did not return valid lease credentials.");
  }

  return data;
};
