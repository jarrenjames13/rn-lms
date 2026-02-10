import { postData } from "@/utils/fetcher";

export interface SubmitExamFilesParams {
  examTypeId: number; // Changed from examId to match backend
  instanceId: number; // Now required (not optional)
  files: {
    uri: string;
    name: string;
    size: number;
    mimeType: string;
  }[];
}

export interface UploadedFile {
  original_name: string;
  saved_name: string;
  file_path: string;
  file_size: number;
  upload_time: string;
}

export interface SubmitExamFilesResponse {
  message: string;
  files: UploadedFile[];
  count: number;
}

export const postSubmissionFile = async (
  params: SubmitExamFilesParams,
): Promise<SubmitExamFilesResponse> => {
  const formData = new FormData();

  // form fields (must match FastAPI names)
  formData.append("exam_type_id", String(params.examTypeId));
  formData.append("instance_id", String(params.instanceId));

  // files
  params.files.forEach((file) => {
    formData.append("files", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as any); // React Native needs this cast
  });

  try {
    const response = await postData<SubmitExamFilesResponse>(
      "/submissions/upload",
      formData,
      {
        "Content-Type": "multipart/form-data",
      },
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error posting submission file",
    );
  }
};
