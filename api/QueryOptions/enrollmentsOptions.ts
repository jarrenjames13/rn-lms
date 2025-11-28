import { queryOptions } from "@tanstack/react-query";
import { fetchEnrollments } from "../QueryFunctions/fetchEnrollments";

export default function createEnrollmentsOptions(userId: number) {
  return queryOptions({
    queryKey: ["enrollments", userId],
    queryFn: async () => {
      if (!userId) return { enrollments: [] };
      return fetchEnrollments(userId);
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}
