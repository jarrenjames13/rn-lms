import { deleteData } from "@/utils/fetcher";

export interface CommentReactionResponse {
  success: boolean;
  message: string;
}

export const deleteCommentReaction = async (comment_id: number) => {
  try {
    const response = await deleteData(`/comment-section/${comment_id}/react`);
    const data: CommentReactionResponse = response.data;
    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error deleting comment reaction",
    );
  }
};
