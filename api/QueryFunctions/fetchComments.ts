import { getData } from "@/utils/fetcher";
export const fetchComments = async (
  instanceId: number,
  moduleId?: number,
  page: number = 1,
  perPage: number = 10
) => {
  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (moduleId !== undefined) {
      queryParams.append("module_id", moduleId.toString());
    }

    const response = await getData(
      `/comment-section/${instanceId}?${queryParams.toString()}`
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error fetching comments"
    );
  }
};
