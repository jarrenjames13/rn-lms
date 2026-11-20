import { StudentQuizzes } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchQuizzes = async (instanceId: number) => {
  const response = await getData<StudentQuizzes>(
    `/assessments/catalog/student-quizzes/${instanceId}`
  );
  return response.data;
};
