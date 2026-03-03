import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { fetchReplies } from "./../QueryFunctions/fetchReplies";

// Regular query options (for pagination)
export default function createRepliesOptions(
  parent_id: number,
  page: number = 1,
  perPage: number = 5,
) {
  return queryOptions({
    queryKey: ["replies", parent_id, page],
    queryFn: () => fetchReplies(parent_id, page, perPage),
    staleTime: 30 * 1000,
  });
}

// Infinite query options (for infinite scroll)
export function createInfiniteRepliesOptions(
  parent_id: number,
  perPage: number = 5,
) {
  return infiniteQueryOptions({
    queryKey: ["replies", parent_id],
    queryFn: ({ pageParam = 1 }) => fetchReplies(parent_id, pageParam, perPage),
    getNextPageParam: (lastPage, allPages) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.per_page);
      const nextPage = allPages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
    staleTime: 30 * 1000,
  });
}
