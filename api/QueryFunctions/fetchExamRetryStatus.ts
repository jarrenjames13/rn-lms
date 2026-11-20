import { ExamRetryStatus } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchExamRetryStatus = async (
  examId: number,
  instanceId: number,
  sessionToken: string,
  clientId: string,
  leaseGeneration: number,
): Promise<ExamRetryStatus> => {
  const response = await getData<ExamRetryStatus>(
    `/assessments/sessions/exams/${examId}/${instanceId}/retry-status`,
    {
      client_id: clientId,
      lease_generation: leaseGeneration,
    },
    {
      "X-Assessment-Session": sessionToken,
    },
  );
  return response.data;
};
