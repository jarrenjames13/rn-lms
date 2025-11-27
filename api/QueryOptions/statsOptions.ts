import { queryOptions } from "@tanstack/react-query";
import { fetchStats } from "../QueryFunctions/fetchStats";

export default function createStatsOptions() {
  return queryOptions({
    queryKey: ["studentOverallLearningProgress"],
    queryFn: fetchStats,
  });
}
