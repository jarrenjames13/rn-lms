import { getData } from "@/utils/fetcher";

export const fetchCourseQuickStats = async (courseId: number) => {
  const response = await getData(`/dashboards/student/courses/${courseId}/overview`);
  return response.data;
};
