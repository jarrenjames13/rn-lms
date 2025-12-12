import { StudentQuizzes } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchQuizzes = async (courseId: number) => {
  try {
    const response = await getData<StudentQuizzes>(
      `/modules/student-quizzes/${courseId}`
    );
    const data: StudentQuizzes = response.data;
    return data;
  } catch (error) {
    console.log("Error fetching quizzes:", error);
    throw new Error("Error fetching quizzes");
  }
};
