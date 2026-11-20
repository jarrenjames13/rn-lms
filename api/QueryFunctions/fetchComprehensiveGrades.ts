import { ComprehensiveGradesResponse } from "@/types/api";
import { getData } from "@/utils/fetcher";
export const fetchComprehensiveGrades = async (
  courseId: number,
  instanceId: number,
) => {
  try {
    const res = await getData<ComprehensiveGradesResponse>(
      `/dashboards/student/courses/${courseId}/comprehensive-grades`,
      { instance_id: instanceId },
    );
    const data: ComprehensiveGradesResponse = res.data;

    return data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail ||
        error.message ||
        "Error fetching comprehensive grades",
    );
  }
};
