import { CourseProgress } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchCourseProgress = async (courseId: number, instanceId?: number) => {
  try {
    const res = await getData<CourseProgress>(
      `/student-progress/course/${courseId}/comprehensive`,
      instanceId == null ? {} : { instance_id: instanceId },
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
