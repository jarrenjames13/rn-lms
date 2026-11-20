import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postSubmissionFile } from "../QueryFunctions/postSubmissionFile";

// export const createSubmissionFileOptions = (queryClient: QueryClient) => {
//   return {
//     mutationFn: postSubmissionFile,
//     onSuccess: async (data: any) => {
//       console.log("Submission file uploaded successfully:", data);

//       await queryClient.invalidateQueries({
//         queryKey: ["list_exams"],
//       });
//     },
//     onError: (error: any) => {
//       console.error("Failed to upload submission file:", error);
//     },
//   };
// };

export const useSubmissionFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postSubmissionFile,
    onSuccess: async (_data: any, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["list_submissions", variables.instanceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["list_exams", variables.instanceId],
        }),
        queryClient.invalidateQueries({ queryKey: ["comprehensive_grades"] }),
      ]);
    },
    onError: (error: any) => {
      console.error("Failed to upload submission file:", error);
    },
  });
};
