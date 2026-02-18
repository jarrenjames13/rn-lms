import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Alert } from "react-native";
import { postExamAnswers } from "../QueryFunctions/postExamAnswers";

export type ExamSubmitResponse = {
  success: boolean;
  score: number;
  correct_answers: number;
  total_questions: number;
};
// export default function createExamAnswersOptions(queryClient: QueryClient) {
//   return {
//     mutationFn: postExamAnswers,
//     onSuccess: async (data: ExamSubmitResponse) => {
//       await queryClient.invalidateQueries({ queryKey: ["list_exams"] });

//       return data;
//     },
//   };
// }

export const useExamAnswers = (options?: any) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postExamAnswers,

    onSuccess: async (data: ExamSubmitResponse) => {
      await queryClient.invalidateQueries({ queryKey: ["list_exams"] });

      if (options?.onSuccess) {
        options.onSuccess(data);
      }
    },

    onError: (error: any) => {
      if (options?.onError) {
        options.onError(error);
        return;
      }

      Alert.alert(
        "Submission Failed",
        error.message || "An error occurred while submitting your answers.",
      );
    },
  });
};
