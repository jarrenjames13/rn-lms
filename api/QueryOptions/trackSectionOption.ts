import { QueryClient } from "@tanstack/react-query";
import { postTrackSection } from "../QueryFunctions/postTrackSection";

export const createTrackSectionOptions = (queryClient: QueryClient) => {
  return {
    mutationFn: postTrackSection,
    onSuccess: async (data: any) => {
      console.log("Section tracked successfully:", data);

      await queryClient.invalidateQueries({
        queryKey: ["moduleProgress"],
      });
    },
    onError: (error: any) => {
      console.error("Failed to track section:", error);
    },
  };
};
