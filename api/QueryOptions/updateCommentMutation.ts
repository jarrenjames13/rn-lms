import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateComment } from "../QueryFunctions/updateComment";

export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateComment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["comments"],
      });
    },
    onError: (error: any) => {
      console.error("Failed to update comment:", error);
    },
  });
};
