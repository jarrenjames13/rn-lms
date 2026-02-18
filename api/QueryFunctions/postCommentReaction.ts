import { postData } from "@/utils/fetcher";

export interface reactPayload {
  reactionType: string;
}

export interface CommentReactionVariables {
  payload: reactPayload;
  comment_id: number;
}

export const postCommentReaction = async ({
  payload,
  comment_id,
}: CommentReactionVariables) => {
  try {
    const response = await postData(
      `/comment-section/${comment_id}/reaction`,
      payload,
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error submitting comment reaction",
    );
  }
};
