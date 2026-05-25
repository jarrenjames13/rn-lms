import { queryOptions } from "@tanstack/react-query";
import { fetchExams } from "../QueryFunctions/fetchExams";

export default function createListExamsOptions(instanceId: number) {
  return queryOptions({
    queryKey: ["list_exams", instanceId],
    queryFn: () => fetchExams(instanceId),
    staleTime: 1 * 60 * 1000, // 1 minutes
  });
}
