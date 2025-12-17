import { QuestionsResponse } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchQuizQuestions = async (
  quizId: number,
  instanceId: number
) => {
  try {
    const res = await getData<QuestionsResponse>(
      `/modules/student-quiz-questions/${quizId}/${instanceId}`,
      {}
    );
    const data: QuestionsResponse = res.data;
    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error fetching quiz questions"
    );
  }
};
