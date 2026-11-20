import { postData } from "@/utils/fetcher";
import type { AssessmentResult, SubmissionReason } from "@/types/assessmentAttempt";
import type { ExamResult } from "./fetchAssessmentResult";

export type ExamSubmitPayload = {
  exam_id: number;
  instance_id: number;
  answers: Record<number, string>;
  submission_reason: SubmissionReason;
  session_token: string;
  session_id: number;
  client_id: string;
  lease_generation: number;
};

type ExamSubmitApiResponse = AssessmentResult & {
  review_status: string;
  grade_status: string;
  message: string | null;
  capture_state: string;
};

export const postExamAnswers = async (payload: ExamSubmitPayload): Promise<ExamResult> => {
  const response = await postData<ExamSubmitApiResponse>(
    "/assessments/results/exams/submit",
    payload,
  );
  return response.data;
};
