import { Replies } from "@/types/api";
import { getData } from "@/utils/fetcher";
export const fetchReplies = async (
  parent_id: number,
  page: number = 1,
  perPage: number = 10,
) => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    const response = await getData<Replies>(
      `/comment-section/${parent_id}/replies?${queryParams.toString()}`,
    );
    const data: Replies = response.data;
    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error fetching replies",
    );
  }
};
