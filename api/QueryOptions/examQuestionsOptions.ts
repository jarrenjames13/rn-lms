import { queryOptions } from "@tanstack/react-query";
import { fetchExamQuestions } from "../QueryFunctions/fetchExamQuestions";

export default function createExamQuestionsOptions(
  examId: number,
  instanceId: number,
  sessionToken: string,
  clientId: string,
  leaseGeneration: number,
) {
  return queryOptions({
    queryKey: [
      "exam_questions",
      examId,
      instanceId,
      sessionToken,
      clientId,
      leaseGeneration,
    ],
    queryFn: () =>
      fetchExamQuestions(
        examId,
        instanceId,
        sessionToken,
        clientId,
        leaseGeneration,
      ),
    staleTime: 0,
    gcTime: 0,
  });
}
