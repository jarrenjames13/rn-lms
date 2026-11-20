import { getData } from "@/utils/fetcher";
import { ActivityWithGrade } from "./../../types/api";

export const fetchActivities = async (moduleId: number, instanceId: number) => {
  try {
    const response = await getData<ActivityWithGrade>(
      `/activity-submissions/student-activities-with-grades/${moduleId}`,
      { instance_id: instanceId },
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
