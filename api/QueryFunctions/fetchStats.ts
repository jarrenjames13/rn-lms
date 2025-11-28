import { StatsData } from "@/types/api";
import { getData } from "@/utils/fetcher";
import * as SecureStore from "expo-secure-store";

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

export const fetchUserFromStore = async () => {
  try {
    const userData = await SecureStore.getItemAsync("user");
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.log("Error fetching user data:", error);
    return null;
  }
};
