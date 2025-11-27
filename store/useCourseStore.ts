import { create } from "zustand";

type CourseStore = {
  course_id: number | null;
  setCourseId: (course_id: number | null) => void;
};

export const useCourseStore = create<CourseStore>((set) => ({
  course_id: null,
  setCourseId: (course_id: number | null) => set({ course_id }),
}));
