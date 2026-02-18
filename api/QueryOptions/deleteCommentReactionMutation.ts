import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCommentReaction } from "../QueryFunctions/deleteCommentReaction";

export const useDeleteCommentReaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCommentReaction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["comments"],
      });
    },
    onError: (error: any) => {
      console.error("Failed to delete comment reaction:", error);
    },
  });
};
