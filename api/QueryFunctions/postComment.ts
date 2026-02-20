import { postData } from "@/utils/fetcher"; // you'll need this util

export interface CommentFormData {
  comment?: string;
  module_id?: number;
  parent_id?: number;
  image?: {
    uri: string;
    name: string;
    type: string;
  }; // React Native file format
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
    const body = new FormData();
    body.append("comment", formData.comment || "");

    if (formData.module_id !== undefined)
      body.append("module_id", String(formData.module_id));

    if (formData.parent_id !== undefined)
      body.append("parent_id", String(formData.parent_id));

    if (formData.image) {
      body.append("image", {
        uri: formData.image.uri,
        name: formData.image.name,
        type: formData.image.type,
      } as any); // React Native requires this cast
    }
    console.log("Has image:", !!formData.image);
    console.log("FormData entries:");
    body.forEach((value, key) => {
      console.log(
        ` ${key}:`,
        typeof value === "object" ? JSON.stringify(value) : value,
      );
    });
    console.log("instance_id:", instance_id);
    const response = await postData(`/comment-section/${instance_id}`, body, {
      "Content-Type": "multipart/form-data",
    });
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(response.data));
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
