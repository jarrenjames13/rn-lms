import { queryOptions } from "@tanstack/react-query";
import { fetchExams } from "../QueryFunctions/fetchExams";

export default function createListExamsOptions(courseId: number) {
  return queryOptions({
    queryKey: ["list_exams", courseId],
    queryFn: () => fetchExams(courseId),
    staleTime: 1 * 60 * 1000, // 1 minutes
  });
}
