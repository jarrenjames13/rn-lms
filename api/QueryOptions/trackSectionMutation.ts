import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postTrackSection } from "../QueryFunctions/postTrackSection";

export const useTrackSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postTrackSection,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["module_progress"],
      });
    },
    onError: (error: any) => {
      console.error("Failed to track section:", error);
    },
  });
};
