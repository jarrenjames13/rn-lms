import { CourseProgress } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchCourseProgress = async (courseId: number) => {
  try {
    const res = await getData<CourseProgress>(
      `/modules/student-course-progress-comprehensive/${courseId}`,
      {}
    );
    const data = res.data;
    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error fetching course progress"
    );
  }
};
