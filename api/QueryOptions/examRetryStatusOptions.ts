import { queryOptions } from "@tanstack/react-query";
import { fetchExamRetryStatus } from "../QueryFunctions/fetchExamRetryStatus";

export default function createExamRetryStatusOptions(
  examId: number,
  instanceId: number,
  sessionToken: string,
  clientId: string,
  leaseGeneration: number,
) {
  return queryOptions({
    queryKey: [
      "exam_retry_status",
      examId,
      instanceId,
      sessionToken,
      clientId,
      leaseGeneration,
    ],
    queryFn: () =>
      fetchExamRetryStatus(
        examId,
        instanceId,
        sessionToken,
        clientId,
        leaseGeneration,
      ),
    enabled: Boolean(sessionToken && clientId && leaseGeneration > 0),
    staleTime: 0,
    gcTime: 0,
  });
}
