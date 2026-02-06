import { QuestionsResponse } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchExamQuestions = async (
  examId: number,
  instanceId: number,
) => {
  try {
    const res = await getData<QuestionsResponse>(
      `/modules/student-exam-questions-unique/${examId}/${instanceId}`,
      {},
    );
    const data: QuestionsResponse = res.data;
    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error fetching exam questions",
    );
  }
};
