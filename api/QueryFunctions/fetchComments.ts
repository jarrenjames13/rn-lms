import { getData } from "@/utils/fetcher";
export const fetchComments = async (
  instanceId: number,
  moduleId?: number,
  page?: number,
  perPage?: number
) => {
  try {
    const res = await getData<any>(
      `/comment-section/${instanceId}?module_id=${moduleId || ""}&page=${page || 1}&per_page=${perPage || 10}`
    );
    const data = res.data;

    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error fetching comments"
    );
  }
};
