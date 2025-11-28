import { getData } from "@/utils/fetcher";

export const fetchCourseQuickStats = async (courseId: number) => {
  try {
    const res = await getData(`/modules/course-overview-stats/${courseId}`, {});
    return res.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error fetching enrollments"
    );
  }
};
