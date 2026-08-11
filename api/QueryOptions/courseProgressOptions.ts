import { queryOptions } from "@tanstack/react-query";
import { fetchCourseProgress } from "../QueryFunctions/fetchCourseProgress";

export default function createCourseProgressOptions(courseId: number, instanceId?: number) {
  return queryOptions({
    queryKey: ["course_progress", courseId, instanceId],
    queryFn: () => fetchCourseProgress(courseId, instanceId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
