import { queryOptions } from "@tanstack/react-query";
import { fetchCourseSummary } from "../QueryFunctions/fetchCourseSummary";

export default function createCourseSummaryOptions(
  courseId: number,
  instanceId: number,
) {
  return queryOptions({
    queryKey: ["course_summary", courseId, instanceId],
    queryFn: () => fetchCourseSummary(courseId, instanceId),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      const status = error?.response?.status;
      return !status || status >= 500 ? failureCount < 1 : false;
    },
  });
}
