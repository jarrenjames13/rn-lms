import { StudentExams } from "@/types/api";
import { getData } from "@/utils/fetcher";

export const fetchExams = async (instanceId: number) => {
  try {
    const response = await getData<StudentExams>(
      `/modules/student-exams/${instanceId}`,
    );
    const data: StudentExams = response.data;
    return data;
  } catch (error) {
    console.log("Error fetching exams:", error);
    throw new Error("Error fetching exams");
  }
};
