import { queryOptions } from "@tanstack/react-query";
import { fetchExamQuestions } from "../QueryFunctions/fetchExamQuestions";

export default function createExamQuestionsOptions(
  examId: number,
  instanceId: number,
  sessionToken: string,
) {
  return queryOptions({
    queryKey: ["exam_questions", examId, instanceId, sessionToken],
    queryFn: () => fetchExamQuestions(examId, instanceId, sessionToken),
    staleTime: 0,
    gcTime: 0,
  });
}
