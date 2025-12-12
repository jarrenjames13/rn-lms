import { getData } from "@/utils/fetcher";

export const fetchQuizzes = async (courseId: number) => {
  try {
    const response = await getData(`/modules/student-quizzes/${courseId}`);
    const data = response.data;
    return data;
  } catch (error) {
    console.log("Error fetching quizzes:", error);
    throw new Error("Error fetching quizzes");
  }
};
