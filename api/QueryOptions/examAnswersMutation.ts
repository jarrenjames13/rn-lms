import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Alert } from "react-native";
import { postExamAnswers } from "../QueryFunctions/postExamAnswers";
import type { ExamResult } from "../QueryFunctions/fetchAssessmentResult";

export type ExamSubmitResponse = ExamResult;
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

    onSuccess: async (data: ExamSubmitResponse, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["list_exams", variables.instance_id],
        }),
        queryClient.invalidateQueries({ queryKey: ["course_progress"] }),
        queryClient.invalidateQueries({ queryKey: ["comprehensive_grades"] }),
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
