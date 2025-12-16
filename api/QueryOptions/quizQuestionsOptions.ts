import { queryOptions } from "@tanstack/react-query";
import { fetchQuizQuestions } from "../QueryFunctions/fetchQuizQuestions";

export default function createQuizQuestionsOptions(
  quizId: number,
  instanceId: number
) {
  return queryOptions({
    queryKey: ["quiz_questions", quizId, instanceId],
    queryFn: () => fetchQuizQuestions(quizId, instanceId),
    staleTime: 1 * 60 * 1000, // 1 minutes
  });
}
