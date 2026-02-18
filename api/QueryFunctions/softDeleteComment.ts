import { putData } from "@/utils/fetcher";

export const softDeleteComment = async (comment_id: number) => {
  try {
    const response = await putData(`/comment-section/user/${comment_id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error soft deleting comment",
    );
  }
};
