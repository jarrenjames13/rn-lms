import { create } from "zustand";

type CourseStore = {
  course_id: number | null;
  setCourseId: (course_id: number | null) => void;
  instance_id: number | null;
  setInstanceId: (instance_id: number | null) => void;
};

export const useCourseStore = create<CourseStore>((set) => ({
  course_id: null,
  setCourseId: (course_id: number | null) => set({ course_id }),
  instance_id: null,
  setInstanceId: (instance_id: number | null) => set({ instance_id }),
}));
