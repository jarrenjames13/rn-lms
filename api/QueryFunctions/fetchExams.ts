import { StudentExams } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchExams = async (courseId: number) => {
  try {
    const response = await getData<StudentExams>(
      `/modules/student-exams/${courseId}`,
    );
    const data: StudentExams = response.data;
    return data;
  } catch (error) {
    console.log("Error fetching exams:", error);
    throw new Error("Error fetching exams");
  }
};
