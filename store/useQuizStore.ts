import { OptionKey } from "@/types/api";
import type {
  AssessmentResult,
  AssessmentSessionMetadata,
  AttemptStatus,
  SubmissionReason,
} from "@/types/assessmentAttempt";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { assessmentStorage } from "./assessmentStorage";
import { admitAssessmentLease } from "@/utils/assessmentLease";

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
  session_id?: string | number;
  lease_generation?: number;
  lease_token?: string;
  focus_loss_count?: number;
  fullscreen_exit_count?: number;
  answer_revision?: number;
  resumed?: boolean;
  setSelectedAnswers: (answers: Record<number, OptionKey>) => void;
  beginAttempt: (quiz_id: number, instance_id: number) => void;
  setSession: (session_token: string, deadline_at: number, metadata?: AssessmentSessionMetadata) => void;
  recordFocusLoss: () => number;
  setAnswerRevision: (revision: number) => void;
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
  session_id: undefined,
  lease_generation: undefined,
  lease_token: undefined,
  focus_loss_count: 0,
  fullscreen_exit_count: 0,
  answer_revision: 0,
  resumed: undefined,
};

export const useQuizStore = create<QuizStore>()(
  persist(
    (set) => ({
      ...emptyAttempt,
      hasHydrated: false,
      setSelectedAnswers: (selectedAnswers) =>
        set((state) => ({
          selectedAnswers,
          answer_revision: (state.answer_revision ?? 0) + 1,
        })),
      beginAttempt: (quiz_id, instance_id) =>
        set({ ...emptyAttempt, quiz_id, instance_id, status: "starting" }),
      setSession: (session_token, deadline_at, metadata = {}) => {
        admitAssessmentLease(session_token, metadata.lease_token);
        set({
          session_token,
          deadline_at,
          ...metadata,
          status: "active",
          recovery_error: null,
        });
      },
      recordFocusLoss: () => {
        let count = 0;
        set((state) => {
          count = (state.focus_loss_count ?? 0) + 1;
          return { focus_loss_count: count };
        });
        return count;
      },
      setAnswerRevision: (revision) =>
        set((state) => ({
          answer_revision: Math.max(state.answer_revision ?? 0, revision),
        })),
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
