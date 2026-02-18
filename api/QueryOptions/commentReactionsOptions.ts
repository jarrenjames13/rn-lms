import { queryOptions } from "@tanstack/react-query";
import { fetchCommentReactions } from "../QueryFunctions/fetchCommentsReactions";

export default function createCommentReactionsOptions(
  comment_id: number,
  reaction_type: string,
  page: number = 1,
  perPage: number = 5,
) {
  return queryOptions({
    queryKey: ["commentReactions", comment_id, reaction_type, page],
    queryFn: () =>
      fetchCommentReactions(comment_id, reaction_type, page, perPage),
    staleTime: 30 * 1000,
  });
}
