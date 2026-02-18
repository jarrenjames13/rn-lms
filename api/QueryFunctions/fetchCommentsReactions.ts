import { getData } from "@/utils/fetcher";
export interface CommentReactionCount {
  like: number;
  love: number;
  haha: number;
  sad: number;
  wow: number;
  dislike: number;
  all: number;
}
export interface CommentReaction {
  user_id: number;
  full_name: string;
  reaction_type: string;
  created_at: string;
}
export interface CommentReactionsResponse {
  success: boolean;
  message: string;
  total: number;
  counts: CommentReactionCount;
  reactions: CommentReaction[];
  page: number;
  per_page: number;
  total_filtered: number;
  total_pages: number;
}

export const fetchCommentReactions = async (
  comment_id: number,
  reaction_type: string,
  page: number = 1,
  perPage: number = 10,
) => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (reaction_type) {
      queryParams.append("reaction_type", reaction_type);
    }
    const response = await getData<CommentReactionsResponse>(
      `/comment-section/${comment_id}/reactions?${queryParams.toString()}`,
    );
    const data: CommentReactionsResponse = response.data;
    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error fetching comment reactions",
    );
  }
};
