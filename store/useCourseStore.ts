import { create } from "zustand";

type CourseStore = {
  course_id: number | null;
  setCourseId: (course_id: number | null) => void;
  instance_id: number | null;
  setInstanceId: (instance_id: number | null) => void;
};

export const useCourseStore = create<CourseStore>((set) => ({
  course_id: null,
  setCourseId: (newCourseId: number | null) => set({ course_id: newCourseId }),
  instance_id: null,
  setInstanceId: (newInstanceId: number | null) =>
    set({ instance_id: newInstanceId }),
}));
