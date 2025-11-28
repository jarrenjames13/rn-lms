import { queryOptions } from "@tanstack/react-query";
import { fetchCourseProgress } from "../QueryFunctions/fetchCourseProgress";

export default function createCourseProgressOptions(courseId: number) {
  return queryOptions({
    queryKey: ["course_progress", courseId],
    queryFn: () => fetchCourseProgress(courseId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
