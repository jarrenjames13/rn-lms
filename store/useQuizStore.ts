import { OptionKey } from "@/types/api";
import type {
  AssessmentResult,
  AttemptStatus,
  SubmissionReason,
} from "@/types/assessmentAttempt";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { assessmentStorage } from "./assessmentStorage";

type QuizStore = {
  quiz_id: number;
  instance_id: number;
  session_token: string;
  deadline_at: number | null;
  status: AttemptStatus;
  submission_reason: SubmissionReason | null;
  result: AssessmentResult | null;
  recovery_error: string | null;
  hasHydrated: boolean;
  selectedAnswers: Record<number, OptionKey>;
  setSelectedAnswers: (answers: Record<number, OptionKey>) => void;
  beginAttempt: (quiz_id: number, instance_id: number) => void;
  setSession: (session_token: string, deadline_at: number) => void;
  markSubmitting: (reason: SubmissionReason) => void;
  markSubmitted: (result: AssessmentResult) => void;
  markActive: () => void;
  markRecoveryError: (message: string) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  clearAttempt: () => void;
};

const emptyAttempt = {
  quiz_id: 0,
  instance_id: 0,
  session_token: "",
  deadline_at: null,
  status: "idle" as AttemptStatus,
  submission_reason: null,
  result: null,
  recovery_error: null,
  selectedAnswers: {},
};

export const useQuizStore = create<QuizStore>()(
  persist(
    (set) => ({
      ...emptyAttempt,
      hasHydrated: false,
      setSelectedAnswers: (selectedAnswers) => set({ selectedAnswers }),
      beginAttempt: (quiz_id, instance_id) =>
        set({ ...emptyAttempt, quiz_id, instance_id, status: "starting" }),
      setSession: (session_token, deadline_at) =>
        set({ session_token, deadline_at, status: "active", recovery_error: null }),
      markSubmitting: (submission_reason) =>
        set({ status: "submitting", submission_reason, recovery_error: null }),
      markSubmitted: (result) =>
        set({ status: "submitted", result, submission_reason: result.submission_reason, recovery_error: null }),
      markActive: () => set({ status: "active", recovery_error: null }),
      markRecoveryError: (recovery_error) => set({ status: "recovery_error", recovery_error }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      clearAttempt: () => set(emptyAttempt),
    }),
    {
      name: "active_quiz_attempt",
      storage: createJSONStorage(() => assessmentStorage),
      partialize: ({ hasHydrated: _hasHydrated, ...state }) => state,
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
