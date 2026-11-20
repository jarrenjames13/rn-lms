import { ExamQuestionsResponse } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchExamQuestions = async (
  examId: number,
  instanceId: number,
  sessionToken: string,
  clientId: string,
  leaseGeneration: number,
) => {
  const response = await getData<ExamQuestionsResponse>(
    `/assessments/sessions/exams/${examId}/${instanceId}/questions`,
    {},
    {
      "X-Assessment-Session": sessionToken,
      "X-Assessment-Client-ID": clientId,
      "X-Assessment-Lease-Generation": String(leaseGeneration),
    },
  );
  return response.data;
};
