import { QueryClient } from "@tanstack/react-query";

import { postExamAnswers } from "../QueryFunctions/postExamAnswers";

export type ExamSubmitResponse = {
  success: boolean;
  score: number;
  correct_answers: number;
  total_questions: number;
};
export default function createExamAnswersOptions(queryClient: QueryClient) {
  return {
    mutationFn: postExamAnswers,
    onSuccess: async (data: ExamSubmitResponse) => {
      await queryClient.invalidateQueries({ queryKey: ["list_exams"] });

      return data;
    },
  };
}
