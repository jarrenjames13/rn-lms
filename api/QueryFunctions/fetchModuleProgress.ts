import { ModuleProgress } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchModuleProgress = async (moduleId: number) => {
  try {
    const res = await getData<ModuleProgress>(
      `/modules/student-progress/module-progress/${moduleId}`,
      {}
    );
    const data: ModuleProgress = res.data;
    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error fetching module progress"
    );
  }
};
