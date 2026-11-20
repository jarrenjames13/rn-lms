import { StudentExams } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchExams = async (instanceId: number) => {
  const response = await getData<StudentExams>(
    `/assessments/catalog/student-exams/${instanceId}`,
  );
  return response.data;
};
