import { queryOptions } from "@tanstack/react-query";
import { fetchStudentSubmissions } from "../QueryFunctions/fetchStudentSubmissions";

export default function createListSubmissionsOptions(instanceId: number) {
  return queryOptions({
    queryKey: ["list_submissions", instanceId],
    queryFn: () => fetchStudentSubmissions(instanceId),
    staleTime: 1 * 60 * 1000,
  });
}
