import { queryOptions } from "@tanstack/react-query";
import { fetchCourseDetails } from "../QueryFunctions/fetchCourseDetails";

export default function createCourseDetailsOptions(courseId: number) {
  return queryOptions({
    queryKey: ["course_details", courseId],
    queryFn: () => fetchCourseDetails(courseId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
