import { create } from "zustand";

type QuizStore = {
  quiz_id: number;
  setQuizId: (quiz_id: number) => void;
  instance_id: number;
  setInstanceId: (instance_id: number) => void;
};

export const useQuizStore = create<QuizStore>((set) => ({
  quiz_id: 0,
  setQuizId: (newQuizId: number) => set({ quiz_id: newQuizId }),
  instance_id: 0,
  setInstanceId: (newInstanceId: number) => set({ instance_id: newInstanceId }),
}));
