import { getData } from "@/utils/fetcher";
import { ActivityWithGrade } from "./../../types/api";

export const fetchActivities = async (moduleId: number) => {
  try {
    const response = await getData<ActivityWithGrade>(
      `/modules/student-activities-with-grades/${moduleId}`,
      {}
    );
    const data: ActivityWithGrade = response.data;

    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error fetching activities"
    );
  }
};
