import { queryOptions } from "@tanstack/react-query";
import { fetchQuizzes } from "../QueryFunctions/fetchQuizzes";

export default function createListQuizzesOptions(courseId: number) {
  return queryOptions({
    queryKey: ["list_quizzes", courseId],
    queryFn: () => fetchQuizzes(courseId),
    staleTime: 1 * 60 * 1000, // 1 minutes
  });
}
