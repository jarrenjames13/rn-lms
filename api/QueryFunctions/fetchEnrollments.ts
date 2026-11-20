import type { Enrollment } from "@/types/api";
import { getData } from "@/utils/fetcher";

export type EnrollmentPage = {
  enrollments: Enrollment[];
  pagination: {
    limit: number;
    has_more: boolean;
    next_cursor: string | null;
  };
};

export const fetchEnrollments = async (
  userId: number,
  cursor?: string,
): Promise<EnrollmentPage> => {
  const response = await getData<EnrollmentPage>(
    `/enrollments/student/${userId}`,
    { pagination: "cursor", limit: 48, ...(cursor ? { cursor } : {}) },
  );
  return response.data;
};
