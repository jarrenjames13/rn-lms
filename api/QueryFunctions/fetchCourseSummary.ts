import type { CourseDetails } from "@/types/api";
import { getData } from "@/utils/fetcher";

export type CourseSummary = { course: CourseDetails };

export const fetchCourseSummary = async (
  courseId: number,
  instanceId: number,
): Promise<CourseSummary> => {
  const response = await getData<CourseSummary>("/content/", {
    course_id: courseId,
    include_content: false,
    instance_id: instanceId,
  });
  return response.data;
};
