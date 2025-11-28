import { Enrollment } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchEnrollments = async (userId: number) => {
  try {
    const response = await getData<Enrollment[]>(
      `/enrollments/student/${userId}`,
      {}
    );
    const data = response.data;

    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error fetching enrollments"
    );
  }
};
