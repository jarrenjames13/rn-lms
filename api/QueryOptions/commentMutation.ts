import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postComment } from "../QueryFunctions/postComment";

export const usePostComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postComment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["comments", "replies"],
      });
    },
    onError: (error: any) => {
      console.error("Failed to post comment:", error);
    },
  });
};
