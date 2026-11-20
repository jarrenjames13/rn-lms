import type { AssessmentResult, SubmissionReason } from "@/types/assessmentAttempt";
import { getData } from "@/utils/fetcher";

type ResultApiResponse = {
  score: number;
  correct_answers: number;
  total_questions: number;
  submission_reason: SubmissionReason;
  attempts_made?: number;
  remaining_attempts?: number;
  review_status?: string;
  grade_status?: string;
  message?: string | null;
  capture_state?: string;
};

export type ExamResult = AssessmentResult & {
  review_status?: string;
  grade_status?: string;
  message?: string | null;
  capture_state?: string;
};

const fetchResult = async (url: string, sessionToken: string): Promise<ResultApiResponse> => {
  const response = await getData<ResultApiResponse>(url, {}, {
    "X-Assessment-Session": sessionToken,
  });
  return response.data;
};

export const fetchQuizResult = async (
  quizId: number,
  instanceId: number,
  sessionToken: string,
): Promise<AssessmentResult> => {
  const result = await fetchResult(
    `/assessments/results/quizzes/${quizId}/${instanceId}`,
    sessionToken,
  );
  return { success: true, ...result };
};

export const fetchExamResult = async (
  examId: number,
  instanceId: number,
  sessionToken: string,
): Promise<ExamResult> => {
  const result = await fetchResult(
    `/assessments/results/exams/${examId}/${instanceId}`,
    sessionToken,
  );
  return { success: true, ...result };
};

export const getApiErrorStatus = (error: unknown) =>
  (error as { status?: number; response?: { status?: number } })?.status ??
  (error as { response?: { status?: number } })?.response?.status;
