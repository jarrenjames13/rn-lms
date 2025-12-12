import { SubmissionResponse } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchModuleProgress = async (moduleId: number) => {
  try {
    const res = await getData<SubmissionResponse>(
      `/modules/student-progress/module-progress/${moduleId}`,
      {}
    );
    const data: SubmissionResponse = res.data;
    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error fetching module progress"
    );
  }
};
