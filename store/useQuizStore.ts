import { OptionKey } from "@/types/api";
import { create } from "zustand";
type QuizStore = {
  quiz_id: number;
  setQuizId: (quiz_id: number) => void;
  instance_id: number;
  setInstanceId: (instance_id: number) => void;
  session_token: string;
  setSessionToken: (session_token: string) => void;
  selectedAnswers: Record<number, OptionKey>;
  setSelectedAnswers: (answers: Record<number, OptionKey>) => void;
  clearAnswers: () => void;
  clearAttempt: () => void;
};

export const useQuizStore = create<QuizStore>((set) => ({
  quiz_id: 0,
  setQuizId: (newQuizId: number) => set({ quiz_id: newQuizId }),
  instance_id: 0,
  setInstanceId: (newInstanceId: number) => set({ instance_id: newInstanceId }),
  session_token: "",
  setSessionToken: (token: string) => set({ session_token: token }),
  selectedAnswers: {},
  setSelectedAnswers: (answers: Record<number, OptionKey>) =>
    set({ selectedAnswers: answers }),
  clearAnswers: () => set({ selectedAnswers: {} }),
  clearAttempt: () => set({ quiz_id: 0, instance_id: 0, session_token: "", selectedAnswers: {} }),
}));
