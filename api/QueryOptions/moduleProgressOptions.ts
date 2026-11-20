import { queryOptions } from "@tanstack/react-query";
import { fetchModuleProgress } from "../QueryFunctions/fetchModuleProgress";

export default function createModuleProgressOptions(
  moduleId: number,
  instanceId: number,
) {
  return queryOptions({
    queryKey: ["module_progress", moduleId, instanceId],
    queryFn: () => fetchModuleProgress(moduleId, instanceId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
