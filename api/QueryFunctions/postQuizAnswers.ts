import { postData } from "@/utils/fetcher";

export type QuizSubmitPayload = {
  quiz_id: number;
  instance_id: number;
  answers: Record<number, string>;
};

export const postQuizAnswers = async (payload: QuizSubmitPayload) => {
  try {
    const response = await postData("/modules/student-quiz-submit", payload);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error submitting quiz answers",
    );
  }
};
