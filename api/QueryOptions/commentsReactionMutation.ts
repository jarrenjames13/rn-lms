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
      await queryClient.invalidateQueries({
        queryKey: ["replies"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["commentReactions"],
      });
    },
    onError: (error: any) => {
      console.error("Failed to post comment reaction:", error);
    },
  });
};
