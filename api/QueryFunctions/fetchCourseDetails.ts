import { CourseAllDetails } from "@/types/api";
import { getData } from "@/utils/fetcher";
export const fetchCourseDetails = async (courseId: number, instanceId: number) => {
  try {
    const res = await getData<CourseAllDetails>(
      "/content/",
      { course_id: courseId, instance_id: instanceId },
    );
    const data = res.data;

    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error fetching course details"
    );
  }
};
