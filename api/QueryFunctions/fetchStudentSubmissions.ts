import { StudentSubmissions } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchStudentSubmissions = async (instanceId: number) => {
  const response = await getData<StudentSubmissions>(
    `/assessments/catalog/student-submissions/${instanceId}`,
  );
  return response.data;
};
