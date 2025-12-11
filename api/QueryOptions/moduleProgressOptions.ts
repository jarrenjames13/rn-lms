import { queryOptions } from "@tanstack/react-query";
import { fetchModuleProgress } from "../QueryFunctions/fetchModuleProgress";

export default function createModuleProgressOptions(moduleId: number) {
  return queryOptions({
    queryKey: ["module_progress", moduleId],
    queryFn: () => fetchModuleProgress(moduleId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
