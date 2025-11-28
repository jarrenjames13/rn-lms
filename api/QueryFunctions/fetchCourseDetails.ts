import { CourseDetails } from "@/types/api";
import { getData } from "@/utils/fetcher";
export const fetchCourseDetails = async (courseId: number) => {
  try {
    const res = await getData<CourseDetails>(`/modules/?course_id=${courseId}`);
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
