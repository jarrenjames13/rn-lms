import { queryOptions } from "@tanstack/react-query";
import { fetchComprehensiveGrades } from "../QueryFunctions/fetchComprehensiveGrades";

export default function createComprehensiveGradesOptions(courseId: number) {
  return queryOptions({
    queryKey: ["comprehensive_grades", courseId],
    queryFn: () => fetchComprehensiveGrades(courseId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
