import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postTrackSection } from "../QueryFunctions/postTrackSection";

export const useTrackSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postTrackSection,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["module_progress"] }),
        queryClient.invalidateQueries({ queryKey: ["course_progress"] }),
      ]);
    },
    onError: (error: any) => {
      console.error("Failed to track section:", error);
    },
  });
};
