import { QueryClient } from "@tanstack/react-query";
import { postSubmissionFile } from "../QueryFunctions/postSubmissionFile";

export const createSubmissionFileOptions = (queryClient: QueryClient) => {
  return {
    mutationFn: postSubmissionFile,
    onSuccess: async (data: any) => {
      console.log("Submission file uploaded successfully:", data);

      await queryClient.invalidateQueries({
        queryKey: ["list_exams"],
      });
    },
    onError: (error: any) => {
      console.error("Failed to upload submission file:", error);
    },
  };
};
