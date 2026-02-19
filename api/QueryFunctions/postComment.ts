import { postData } from "@/utils/fetcher";

export interface CommentFormData {
  comment: string;
  module_id?: number;
  parent_id?: number;
  image?: File;
}

export interface commentVariables {
  formData: CommentFormData;
  instance_id: number;
}

export type CommentResponse = {
  success: boolean;
  message: string;
  comment_id: number;
  parent_id: number | null;
  redirected: boolean;
  original_parent_id: number | null;
  mentioned_user_id: number | null;
};

export const postComment = async ({
  formData,
  instance_id,
}: commentVariables) => {
  try {
    const response = await postData(
      `/comment-section/${instance_id}`,
      formData,
    );
    const data: CommentResponse = response.data;

    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error submitting comment",
    );
  }
};
