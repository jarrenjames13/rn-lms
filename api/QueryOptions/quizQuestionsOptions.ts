import { queryOptions } from "@tanstack/react-query";
import { fetchQuizQuestions } from "../QueryFunctions/fetchQuizQuestions";

export default function createQuizQuestionsOptions(
  quizId: number,
  instanceId: number,
  sessionToken: string,
  clientId: string,
  leaseGeneration: number,
) {
  return queryOptions({
    queryKey: [
      "quiz_questions",
      quizId,
      instanceId,
      sessionToken,
      clientId,
      leaseGeneration,
    ],
    queryFn: () =>
      fetchQuizQuestions(
        quizId,
        instanceId,
        sessionToken,
        clientId,
        leaseGeneration,
      ),
    staleTime: 0,
    gcTime: 0,
  });
}
