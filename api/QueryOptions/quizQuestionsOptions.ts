import { queryOptions } from "@tanstack/react-query";
import { fetchQuizQuestions } from "../QueryFunctions/fetchQuizQuestions";

export default function createQuizQuestionsOptions(
  quizId: number,
  instanceId: number,
  sessionToken: string,
) {
  return queryOptions({
    queryKey: ["quiz_questions", quizId, instanceId, sessionToken],
    queryFn: () => fetchQuizQuestions(quizId, instanceId, sessionToken),
    staleTime: 0,
    gcTime: 0,
  });
}
