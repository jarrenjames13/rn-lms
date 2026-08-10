import { postData } from "@/utils/fetcher";

export type StartSessionPayload = {
  assessment_id: number;
  instance_id: number;
  category: "quiz" | "exam";
};

export type StartSessionResponse = {
  session_token: string;
  started_at: string;
  deadline_at: string;
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

  return data;
};
