import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postCommentReaction } from "../QueryFunctions/postCommentReaction";

export const useCommentReactions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postCommentReaction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["comments"],
      });
    },
    onError: (error: any) => {
      console.error("Failed to post comment reaction:", error);
    },
  });
};
