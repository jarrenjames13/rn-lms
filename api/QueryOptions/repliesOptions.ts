import { queryOptions } from "@tanstack/react-query";
import { fetchReplies } from "./../QueryFunctions/fetchReplies";

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
