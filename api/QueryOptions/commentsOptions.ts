import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { fetchComments } from "./../QueryFunctions/fetchComments";

// Regular query options (for pagination)
export default function createCommentsOptions(
  instance_id: number,
  parent_id?: number,
  page: number = 1,
  perPage: number = 5,
) {
  return queryOptions({
    queryKey: ["comments", instance_id, parent_id, page],
    queryFn: () => fetchComments(instance_id, parent_id, page, perPage),
    staleTime: 30 * 1000,
  });
}

// Infinite query options (for infinite scroll)
export function createInfiniteCommentsOptions(
  instance_id: number,
  parent_id?: number,
  perPage: number = 10,
) {
  return infiniteQueryOptions({
    queryKey: ["comments", instance_id, parent_id],
    queryFn: ({ pageParam = 1 }) =>
      fetchComments(instance_id, parent_id, pageParam, perPage),
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.per_page);
      const nextPage = allPages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
  });
}
