import { infiniteQueryOptions } from "@tanstack/react-query";
import { fetchEnrollments } from "../QueryFunctions/fetchEnrollments";

export default function createEnrollmentsOptions(userId: number) {
  return infiniteQueryOptions({
    queryKey: ["enrollments", userId],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) => fetchEnrollments(userId, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.has_more ? lastPage.pagination.next_cursor ?? undefined : undefined,
    staleTime: 1 * 60 * 1000,
  });
}
