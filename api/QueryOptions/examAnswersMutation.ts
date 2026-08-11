import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Alert } from "react-native";
import type { AssessmentResult } from "@/types/assessmentAttempt";
import { postExamAnswers } from "../QueryFunctions/postExamAnswers";

export type ExamSubmitResponse = AssessmentResult;
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["list_exams"] }),
        queryClient.invalidateQueries({ queryKey: ["course_progress"] }),
      ]);

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
