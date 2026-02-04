import { QueryClient } from "@tanstack/react-query";
import { postQuizAnswers } from "./../QueryFunctions/postQuizAnswers";

export type QuizSubmitResponse = {
  success: boolean;
  score: number;
  correct_answers: number;
  total_questions: number;
};
export default function createQuizAnswersOptions(queryClient: QueryClient) {
  return {
    mutationFn: postQuizAnswers,
    onSuccess: async (data: QuizSubmitResponse) => {
      await queryClient.invalidateQueries({ queryKey: ["list_quizzes"] });

      return data;
    },
  };
}
