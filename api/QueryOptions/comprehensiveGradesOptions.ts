import { queryOptions } from "@tanstack/react-query";
import { fetchComprehensiveGrades } from "../QueryFunctions/fetchComprehensiveGrades";

export default function createComprehensiveGradesOptions(
  courseId: number,
  instanceId: number,
) {
  return queryOptions({
    queryKey: ["comprehensive_grades", courseId, instanceId],
    queryFn: () => fetchComprehensiveGrades(courseId, instanceId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
