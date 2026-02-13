import { queryOptions } from "@tanstack/react-query";
import { fetchComments } from "../QueryFunctions/fetchComments";

export default function createCommentsOptions(
  instanceId: number,
  moduleId?: number,
  page: number = 1,
  perPage: number = 5,
) {
  return queryOptions({
    queryKey: ["comments", instanceId, moduleId, page],
    queryFn: () => fetchComments(instanceId, moduleId, page, perPage),
    staleTime: 30 * 1000,
  });
}
