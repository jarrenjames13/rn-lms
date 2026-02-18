import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";
import { postQuizAnswers } from "../QueryFunctions/postQuizAnswers";

export type QuizSubmitResponse = {
  success: boolean;
  score: number;
  correct_answers: number;
  total_questions: number;
};
// export default function createQuizAnswersOptions(queryClient: QueryClient) {
//   return {
//     mutationFn: postQuizAnswers,
//     onSuccess: async (data: QuizSubmitResponse) => {
//       await queryClient.invalidateQueries({ queryKey: ["list_quizzes"] });

//       return data;
//     },
//   };
// }

export const useQuizAnswers = (options?: any) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postQuizAnswers,

    onSuccess: async (data: QuizSubmitResponse) => {
      await queryClient.invalidateQueries({ queryKey: ["list_quizzes"] });

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
