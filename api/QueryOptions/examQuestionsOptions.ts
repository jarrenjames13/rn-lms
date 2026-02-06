import { queryOptions } from "@tanstack/react-query";
import { fetchExamQuestions } from "../QueryFunctions/fetchExamQuestions";

export default function createExamQuestionsOptions(
  examId: number,
  instanceId: number,
) {
  return queryOptions({
    queryKey: ["exam_questions", examId, instanceId],
    queryFn: () => fetchExamQuestions(examId, instanceId),
    staleTime: 1 * 60 * 1000, // 1 minutes
  });
}
