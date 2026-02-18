import { useMutation, useQueryClient } from "@tanstack/react-query";
import { softDeleteComment } from "../QueryFunctions/softDeleteComment";

export const useSoftDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: softDeleteComment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["comments"],
      });
    },
    onError: (error: any) => {
      console.error("Failed to soft delete comment:", error);
    },
  });
};
