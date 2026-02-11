import { ComprehensiveGradesResponse } from "@/types/api";
import { getData } from "@/utils/fetcher";
export const fetchComprehensiveGrades = async (courseId: number) => {
  try {
    const res = await getData<ComprehensiveGradesResponse>(
      `/modules/student-comprehensive-grades/${courseId}`,
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
