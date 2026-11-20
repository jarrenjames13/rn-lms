import { queryOptions } from "@tanstack/react-query";
import { fetchCourseDetails } from "../QueryFunctions/fetchCourseDetails";

export default function createCourseDetailsOptions(
  courseId: number,
  instanceId: number,
) {
  return queryOptions({
    queryKey: ["course_details", courseId, instanceId],
    queryFn: () => fetchCourseDetails(courseId, instanceId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
