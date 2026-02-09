import { ExamQuestionsResponse } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchExamQuestions = async (
  examId: number,
  instanceId: number,
) => {
  try {
    const res = await getData<ExamQuestionsResponse>(
      `/modules/student-exam-questions-unique/${examId}/${instanceId}`,
      {},
    );
    const data: ExamQuestionsResponse = res.data;
    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error fetching exam questions",
    );
  }
};
