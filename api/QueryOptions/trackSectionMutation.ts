import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postTrackSection } from "../QueryFunctions/postTrackSection";
import { useCourseStore } from "@/store/useCourseStore";

export const useTrackSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postTrackSection,
    onSuccess: async (_data, payload) => {
      const courseId = useCourseStore.getState().course_id;
      const matchesInstance = (query: { queryKey: readonly unknown[] }) =>
        query.queryKey[2] === payload.instance_id;
      await Promise.all([
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === "module_progress" &&
            matchesInstance(query),
        }),
        queryClient.invalidateQueries({
          queryKey: ["course_progress", courseId, payload.instance_id],
        }),
      ]);
    },
    onError: (error: any) => {
      console.error("Failed to track section:", error);
    },
  });
};
