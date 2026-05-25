import { queryOptions } from "@tanstack/react-query";
import { fetchQuizzes } from "../QueryFunctions/fetchQuizzes";

export default function createListQuizzesOptions(instanceId: number) {
  return queryOptions({
    queryKey: ["list_quizzes", instanceId],
    queryFn: () => fetchQuizzes(instanceId),
    staleTime: 1 * 60 * 1000, // 1 minutes
  });
}
