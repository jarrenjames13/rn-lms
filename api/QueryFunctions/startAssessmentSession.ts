import { postData } from "@/utils/fetcher";

export type StartSessionPayload = {
  assessment_id: number;
  instance_id: number;
  category: "quiz" | "exam";
};

export type StartSessionResponse = {
  session_token: string;
  started_at: string;
};

export const startAssessmentSession = async (
  payload: StartSessionPayload,
): Promise<StartSessionResponse> => {
  const response = await postData<StartSessionResponse>(
    "/assessment-sessions/start-assessment-session",
    payload,
  );
  return response.data;
};
