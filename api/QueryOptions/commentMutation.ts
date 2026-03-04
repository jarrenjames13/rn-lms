import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postComment } from "../QueryFunctions/postComment";

export const usePostComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postComment,
    onSuccess: async () => {
      // Invalidate all queries starting with "comments"
      await queryClient.invalidateQueries({
        queryKey: ["comments"],
      });

      // Invalidate all queries starting with "replies"
      await queryClient.invalidateQueries({
        queryKey: ["replies"],
      });
    },
    onError: (error: any) => {
      console.error("Failed to post comment:", error);
    },
  });
};
