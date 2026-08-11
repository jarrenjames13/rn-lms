import type { CourseDetails } from "@/types/api";
import { getData } from "@/utils/fetcher";

export type CourseSummary = { course: CourseDetails };

export const fetchCourseSummary = async (courseId: number): Promise<CourseSummary> => {
  const response = await getData<CourseSummary>(`/modules/?course_id=${courseId}&include_content=false`);
  return response.data;
};
