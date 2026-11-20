import { QuestionsResponse } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchQuizQuestions = async (
  quizId: number,
  instanceId: number,
  sessionToken: string,
  clientId: string,
  leaseGeneration: number,
) => {
  const response = await getData<QuestionsResponse>(
    `/assessments/sessions/quizzes/${quizId}/${instanceId}/questions`,
    {},
    {
      "X-Assessment-Session": sessionToken,
      "X-Assessment-Client-ID": clientId,
      "X-Assessment-Lease-Generation": String(leaseGeneration),
    },
  );
  return response.data;
};
