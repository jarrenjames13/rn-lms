import { postData } from "@/utils/fetcher";

export type TrackSectionOptionPayload = {
  section_id: number;
};

export const postTrackSection = async (payload: TrackSectionOptionPayload) => {
  try {
    const response = await postData(
      "/modules/student-progress/track-section",
      payload
    );
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.detail || error.message || "Error tracking section"
    );
  }
};
