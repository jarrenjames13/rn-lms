import type { AssessmentResult, SubmissionReason } from "@/types/assessmentAttempt";
import { getData } from "@/utils/fetcher";

type ResultApiResponse = {
  score: number;
  correct_answers: number;
  total_questions: number;
  submission_reason: SubmissionReason;
  attempts_made?: number;
  remaining_attempts?: number;
};

const fetchResult = async (url: string, sessionToken: string): Promise<AssessmentResult> => {
  const response = await getData<ResultApiResponse>(url, {}, {
    "X-Assessment-Session": sessionToken,
  });
  return {
    success: true,
    score: response.data.score,
    correct_answers: response.data.correct_answers,
    total_questions: response.data.total_questions,
    submission_reason: response.data.submission_reason,
    attempts_made: response.data.attempts_made,
    remaining_attempts: response.data.remaining_attempts,
  };
};

export const fetchQuizResult = (quizId: number, instanceId: number, sessionToken: string) =>
  fetchResult(`/modules/quiz-result/${quizId}/${instanceId}`, sessionToken);

export const fetchExamResult = (examId: number, instanceId: number, sessionToken: string) =>
  fetchResult(`/modules/exam-result/${examId}/${instanceId}`, sessionToken);

export const getApiErrorStatus = (error: unknown) =>
  (error as { status?: number; response?: { status?: number } })?.status ??
  (error as { response?: { status?: number } })?.response?.status;
