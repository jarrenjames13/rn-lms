import { queryOptions } from "@tanstack/react-query";
import { fetchCourseSummary } from "../QueryFunctions/fetchCourseSummary";

export default function createCourseSummaryOptions(courseId: number) {
  return queryOptions({
    queryKey: ["course_summary", courseId],
    queryFn: () => fetchCourseSummary(courseId),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      const status = error?.response?.status;
      return !status || status >= 500 ? failureCount < 1 : false;
    },
  });
}
