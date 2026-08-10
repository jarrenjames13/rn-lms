import { postData } from "@/utils/fetcher";
import type { AssessmentResult, SubmissionReason } from "@/types/assessmentAttempt";

export type QuizSubmitPayload = {
  quiz_id: number;
  instance_id: number;
  answers: Record<number, string>;
  submission_reason: SubmissionReason;
  session_token: string;
};

type QuizSubmitApiResponse = {
  success: boolean;
  latest_score: number;
  latest_correct_answers: number;
  best_score: number;
  total_questions: number;
  attempts_made: number;
  remaining_attempts: number;
  submission_reason: SubmissionReason;
};

export const postQuizAnswers = async (payload: QuizSubmitPayload): Promise<AssessmentResult> => {
  try {
    const response = await postData<QuizSubmitApiResponse>("/modules/student-quiz-submit", payload);
    return {
      success: response.data.success,
      score: response.data.latest_score,
      correct_answers: response.data.latest_correct_answers,
      total_questions: response.data.total_questions,
      submission_reason: response.data.submission_reason,
      attempts_made: response.data.attempts_made,
      remaining_attempts: response.data.remaining_attempts,
      best_score: response.data.best_score,
    };
  } catch (error: any) {
    const submissionError = new Error(
      error?.response?.data?.detail || error.message || "Error submitting quiz answers",
    ) as Error & { status?: number };
    submissionError.status = error?.response?.status;
    throw submissionError;
  }
};
