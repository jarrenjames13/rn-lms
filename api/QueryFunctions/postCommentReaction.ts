import { postData } from "@/utils/fetcher";

export interface reactPayload {
  reactionType: string;
}

export interface CommentReactionVariables {
  payload: reactPayload;
  comment_id: number;
}

export interface CommentReactionResponse {
  success: boolean;
  message: string;
}
export const postCommentReaction = async ({
  payload,
  comment_id,
}: CommentReactionVariables) => {
  try {
    console.log("Posting reaction", payload, "to comment", comment_id);
    const response = await postData(
      `/comment-section/${comment_id}/react`,
      payload,
    );
    console.log("Reaction response:", response);
    const data: CommentReactionResponse = response.data;
    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error submitting comment reaction",
    );
  }
};
