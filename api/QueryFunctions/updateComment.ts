import { putData } from "@/utils/fetcher";

export interface commentPayload {
  comment: string;
}
export interface updateCommentVariables {
  payload: commentPayload;
  comment_id: number;
}

export const updateComment = async ({
  payload,
  comment_id,
}: updateCommentVariables) => {
  try {
    const response = await putData(
      `/comment-section/user/${comment_id}/update`,
      payload,
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error updating comment",
    );
  }
};
