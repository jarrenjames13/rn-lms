import { OptionKey } from "@/types/api";
import { create } from "zustand";
type ExamStore = {
  exam_id: number;
  setExamId: (exam_id: number) => void;
  instance_id: number;
  setInstanceId: (instance_id: number) => void;
  selectedAnswers: Record<number, OptionKey>;
  setSelectedAnswers: (answers: Record<number, OptionKey>) => void;
  clearAnswers: () => void;
};

export const useExamStore = create<ExamStore>((set) => ({
  exam_id: 0,
  setExamId: (newExamId: number) => set({ exam_id: newExamId }),
  instance_id: 0,
  setInstanceId: (newInstanceId: number) => set({ instance_id: newInstanceId }),
  selectedAnswers: {},
  setSelectedAnswers: (answers: Record<number, OptionKey>) =>
    set({ selectedAnswers: answers }),
  clearAnswers: () => set({ selectedAnswers: {} }),
}));
