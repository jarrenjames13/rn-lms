import { queryOptions } from "@tanstack/react-query";
import { fetchEnrollments } from "../QueryFunctions/fetchEnrollments";

export default function createEnrollmentsOptions(userId: number) {
  return queryOptions({
    queryKey: ["enrollments", userId],
    queryFn: () => fetchEnrollments(userId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
