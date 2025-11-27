import { create } from "zustand";
type CourseStore = {
  course_id: number;
};

export const useCourseStore = create<CourseStore>((set) => ({
  course_id: 0,
  setCourseId: (course_id: number) => set({ course_id }),
}));
