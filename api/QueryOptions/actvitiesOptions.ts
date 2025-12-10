import { queryOptions } from "@tanstack/react-query";
import { fetchActivities } from "../QueryFunctions/fetchModuleActivities";

export default function createActivitiesOptions(moduleId: number) {
  return queryOptions({
    queryKey: ["module_activities", moduleId],
    queryFn: () => fetchActivities(moduleId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
