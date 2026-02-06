import { postData } from "@/utils/fetcher";

export type ExamSubmitPayload = {
  exam_id: number;
  instance_id: number;
  answers: Record<number, string>;
  submission_reason: string;
};

export const postExamAnswers = async (payload: ExamSubmitPayload) => {
  try {
    const response = await postData(
      "/modules/submit-exam-results-unique",
      payload,
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error submitting exam answers",
    );
  }
};
