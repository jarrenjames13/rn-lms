import { queryOptions } from "@tanstack/react-query";
import { fetchCourseQuickStats } from "../QueryFunctions/fetchCourseQuickStats";

export default function createEnrollmentsOptions(courseId: number) {
  return queryOptions({
    queryKey: ["course_stats", courseId],
    queryFn: () => fetchCourseQuickStats(courseId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
