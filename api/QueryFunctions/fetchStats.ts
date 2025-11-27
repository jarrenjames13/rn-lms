import { StatsData } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchStats = async () => {
  try {
    const response = await getData<StatsData>(
      "/modules/student-overall-learning-progress",
      {}
    );
    const data = response.data;

    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail || error.message || "Error fetching stats"
    );
  }
};
