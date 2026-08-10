import { postData } from "@/utils/fetcher";
import type { AssessmentResult, SubmissionReason } from "@/types/assessmentAttempt";

export type ExamSubmitPayload = {
  exam_id: number;
  instance_id: number;
  answers: Record<number, string>;
  submission_reason: SubmissionReason;
  session_token: string;
};

type ExamSubmitApiResponse = AssessmentResult;

export const postExamAnswers = async (payload: ExamSubmitPayload): Promise<AssessmentResult> => {
  try {
    const response = await postData<ExamSubmitApiResponse>(
      "/modules/submit-exam-results-unique",
      payload,
    );
    return response.data;
  } catch (error: any) {
    const submissionError = new Error(
      error?.response?.data?.detail || error.message || "Error submitting exam answers",
    ) as Error & { status?: number };
    submissionError.status = error?.response?.status;
    throw submissionError;
  }
};
