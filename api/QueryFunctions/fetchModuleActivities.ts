import { getData } from "@/utils/fetcher";

export const fetchActivities = async (moduleId: number) => {
  try {
    const response = await getData(
      `/module/student-activities-with-grades/${moduleId}`,
      {}
    );
    const data = response.data;

    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error fetching activities"
    );
  }
};
