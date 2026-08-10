import { useExamAnswers } from "@/api/QueryOptions/examAnswersMutation";
import {
  fetchExamResult,
  getApiErrorStatus,
} from "@/api/QueryFunctions/fetchAssessmentResult";
import { startAssessmentSession } from "@/api/QueryFunctions/startAssessmentSession";
import createExamQuestionsOptions from "@/api/QueryOptions/examQuestionsOptions";
import ExamSubmissionModal from "@/components/ExamSubmissionModal";
import ScreenLoading from "@/components/ScreenLoading";
import { useExamStore } from "@/store/useExamStore";
import { flushAssessmentStorage } from "@/store/assessmentStorage";
import { useAppTheme } from "@/theme";
import type { ExamQuestion, OptionKey } from "@/types/api";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePreventRemove } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  AppState,
  AppStateStatus,
  Pressable,
  Text,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SubmissionReason } from "@/types/assessmentAttempt";
import { useAssessmentScreenCapture } from "@/utils/useAssessmentScreenCapture";

export default function ExamTaking() {
  const { theme } = useAppTheme();
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionRetry, setSessionRetry] = useState(0);
  const [recoveryRetry, setRecoveryRetry] = useState(0);
  const [navigationAllowed, setNavigationAllowed] = useState(false);

  const appState = useRef(AppState.currentState);
  const startInFlightRef = useRef(false);
  const submissionInFlightRef = useRef(false);
  const recoveryInFlightRef = useRef(false);
  const dialogOpenRef = useRef(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  useAssessmentScreenCapture("exam-taking");

  const {
    exam_id,
    instance_id,
    session_token,
    deadline_at: deadlineAt,
    status,
    submission_reason: submissionReason,
    result,
    recovery_error: recoveryError,
    hasHydrated,
    selectedAnswers,
    setSelectedAnswers,
    setSession,
    markSubmitting,
    markSubmitted,
    markActive,
    markRecoveryError,
    clearAttempt,
  } = useExamStore();

  const listRef = useRef<any>(null);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    if (
      !hasHydrated ||
      status !== "starting" ||
      exam_id <= 0 ||
      instance_id <= 0 ||
      startInFlightRef.current
    ) return;

    let cancelled = false;
    startInFlightRef.current = true;
    setSessionError(null);
    startAssessmentSession({
      assessment_id: exam_id,
      instance_id,
      category: "exam",
    })
      .then(({ session_token: nextToken, deadline_at }) => {
        if (!cancelled) {
          const deadline = new Date(deadline_at).getTime();
          setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
          setSession(nextToken, deadline);
        }
      })
      .catch((error: any) => {
        if (!cancelled) {
          setSessionError(error?.response?.data?.detail ?? error?.message ?? "Unable to start exam session.");
        }
      })
      .finally(() => {
        startInFlightRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [exam_id, hasHydrated, instance_id, sessionRetry, setSession, status]);

  const {
    data: questionsData,
    isLoading,
    isError,
    error,
    refetch: refetchQuestions,
  } = useQuery({
    ...createExamQuestionsOptions(exam_id, instance_id, session_token),
    enabled: status === "active" && exam_id > 0 && instance_id > 0 && !!session_token,
  });

  const { mutateAsync: submitAnswers, isPending: isSubmitting } = useExamAnswers({
    onError: () => undefined,
  });

  const recoverExistingResult = useCallback(async () => {
    const recovered = await fetchExamResult(exam_id, instance_id, session_token);
    markSubmitted(recovered);
  }, [exam_id, instance_id, markSubmitted, session_token]);

  const submitAttempt = useCallback(
    async (reason: SubmissionReason, recovering = false) => {
      const attempt = useExamStore.getState();
      if (!attempt.session_token || submissionInFlightRef.current) return;
      if (!recovering && attempt.status !== "active") return;

      submissionInFlightRef.current = true;
      markSubmitting(reason);
      try {
        await flushAssessmentStorage();
        const submittedResult = await submitAnswers({
          exam_id: attempt.exam_id,
          instance_id: attempt.instance_id,
          answers: attempt.selectedAnswers,
          submission_reason: reason,
          session_token: attempt.session_token,
        });
        markSubmitted(submittedResult);
      } catch (error) {
        if (getApiErrorStatus(error) === 409 && /already submitted/i.test((error as Error).message)) {
          try {
            await recoverExistingResult();
            return;
          } catch (recoveryError) {
            markRecoveryError((recoveryError as Error).message);
            return;
          }
        }

        const message = (error as Error).message || "Unable to submit exam.";
        if (reason === "manual" && !recovering) {
          try {
            await recoverExistingResult();
          } catch (recoveryError) {
            if (getApiErrorStatus(recoveryError) === 404) {
              markActive();
              Alert.alert("Submission Failed", message);
            } else {
              markRecoveryError((recoveryError as Error).message);
            }
          }
        } else {
          markRecoveryError(message);
        }
      } finally {
        submissionInFlightRef.current = false;
      }
    },
    [
      markActive,
      markRecoveryError,
      markSubmitted,
      markSubmitting,
      recoverExistingResult,
      submitAnswers,
    ],
  );

  const performSubmission = useCallback(
    (reason: SubmissionReason) => {
      void submitAttempt(reason);
    },
    [submitAttempt],
  );

  usePreventRemove(status !== "idle" && !navigationAllowed, () => {
    const attempt = useExamStore.getState();
    if (attempt.status === "active" && attempt.session_token) {
      performSubmission("navigation_attempt");
    }
  });

  const recoverSubmission = useCallback(async () => {
    if (!session_token || recoveryInFlightRef.current || submissionInFlightRef.current) return;
    recoveryInFlightRef.current = true;
    try {
      await recoverExistingResult();
    } catch (error) {
      if (getApiErrorStatus(error) === 404) {
        await submitAttempt(submissionReason ?? "navigation_attempt", true);
      } else {
        markRecoveryError((error as Error).message || "Unable to recover exam result.");
      }
    } finally {
      recoveryInFlightRef.current = false;
    }
  }, [markRecoveryError, recoverExistingResult, session_token, submissionReason, submitAttempt]);

  useEffect(() => {
    if (
      hasHydrated &&
      (status === "submitting" || status === "recovery_error") &&
      AppState.currentState === "active"
    ) {
      void recoverSubmission();
    }
  }, [hasHydrated, recoverSubmission, recoveryRetry, status]);

  useEffect(() => {
    if (
      status === "active" &&
      session_token &&
      (AppState.currentState === "background" || AppState.currentState === "inactive")
    ) {
      performSubmission("tab_switch");
    }
  }, [performSubmission, session_token, status]);

  const handleModalClose = () => {
    queryClient.removeQueries({ queryKey: ["exam_questions", exam_id, instance_id, session_token] });
    void queryClient.invalidateQueries({ queryKey: ["list_exams", instance_id] });
    setNavigationAllowed(true);
    clearAttempt();
  };

  useEffect(() => {
    if (navigationAllowed) {
      router.replace("/(course_tabs)/assessments");
    }
  }, [navigationAllowed, router]);

  useEffect(() => {
    if (!deadlineAt || status !== "active") return;
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000));
      setSecondsLeft((previous) => {
        if (previous > 600 && remaining <= 600) Vibration.vibrate(500);
        return remaining;
      });
      if (remaining === 0) performSubmission("time_expired");
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deadlineAt, performSubmission, status]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      const leftApp = next === "background";
      const becameInactive = appState.current === "active" && next === "inactive";
      if (
        statusRef.current === "active" &&
        (leftApp || (becameInactive && !dialogOpenRef.current))
      ) {
        performSubmission("tab_switch");
      } else if (
        next === "active" &&
        (statusRef.current === "submitting" || statusRef.current === "recovery_error")
      ) {
        void recoverSubmission();
      }
      appState.current = next;
    });

    return () => sub.remove();
  }, [performSubmission, recoverSubmission]);

  if (!hasHydrated) {
    return <ScreenLoading message="Restoring your exam attempt..." />;
  }

  if (navigationAllowed) {
    return <ScreenLoading message="Returning to assessments..." />;
  }

  if (status === "submitted" && result) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7F7FA] dark:bg-[#111014]">
        <ExamSubmissionModal
          visible
          onClose={handleModalClose}
          submissionReason={submissionReason ?? result.submission_reason}
          resultData={result}
        />
      </SafeAreaView>
    );
  }

  if (status === "submitting") {
    return <ScreenLoading message="Submitting your exam and preparing the result..." />;
  }

  if (status === "recovery_error") {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#F7F7FA] dark:bg-[#111014] px-6">
        <Ionicons name="cloud-offline-outline" size={64} color={theme.danger} />
        <Text className="text-lg font-semibold text-[#201D25] dark:text-[#F7F4FA] mt-4">Unable to recover exam result</Text>
        <Text className="text-base text-[#6C6572] dark:text-[#BEB6C5] text-center mt-2">{recoveryError}</Text>
        <Pressable onPress={() => setRecoveryRetry((value) => value + 1)} className="mt-6 px-6 py-3 rounded-xl" style={{ backgroundColor: theme.school }}>
          <Text className="text-white font-semibold">Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (status === "idle" || exam_id <= 0 || instance_id <= 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#F7F7FA] dark:bg-[#111014] px-6">
        <Ionicons name="alert-circle-outline" size={64} color={theme.danger} />
        <Text className="text-lg font-semibold text-[#201D25] dark:text-[#F7F4FA] mt-4">Unable to prepare exam</Text>
        <Text className="text-base text-[#6C6572] dark:text-[#BEB6C5] text-center mt-2">The exam details are missing. Return to assessments and try again.</Text>
        <Pressable onPress={() => router.replace("/(course_tabs)/assessments")} className="mt-6 bg-[#B42335] dark:bg-[#F06A78] px-6 py-3 rounded-xl">
          <Text className="text-white font-semibold">Back to assessments</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!sessionError && (status === "starting" || !session_token || deadlineAt === null || isLoading)) {
    return <ScreenLoading message={!session_token || deadlineAt === null ? "Preparing your secure exam session..." : "Loading exam questions..."} />;
  }

  if (sessionError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#F7F7FA] dark:bg-[#111014] px-6">
        <Ionicons name="alert-circle-outline" size={64} color={theme.danger} />
        <Text className="text-lg font-semibold text-[#201D25] dark:text-[#F7F4FA] mt-4">Unable to start exam</Text>
        <Text className="text-base text-[#6C6572] dark:text-[#BEB6C5] text-center mt-2">{sessionError}</Text>
        <Pressable onPress={() => setSessionRetry((value) => value + 1)} className="mt-6 bg-[#B42335] dark:bg-[#F06A78] px-6 py-3 rounded-xl">
          <Text className="text-white font-semibold">Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#F7F7FA] dark:bg-[#111014] px-6">
        <Ionicons name="cloud-offline-outline" size={64} color={theme.danger} />
        <Text className="text-lg font-semibold text-[#201D25] dark:text-[#F7F4FA] mt-4">Unable to load exam questions</Text>
        <Text className="text-base text-[#6C6572] dark:text-[#BEB6C5] text-center mt-2">{(error as Error).message}</Text>
        <Pressable onPress={() => void refetchQuestions()} className="mt-6 bg-[#B42335] dark:bg-[#F06A78] px-6 py-3 rounded-xl">
          <Text className="text-white font-semibold">Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const questions = questionsData?.questions || [];
  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = questions.length;
  const progress = (answeredCount / totalQuestions) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isLowTime = secondsLeft <= 600;

  const handleSubmitExam = () => {
    if (status !== "active" || answeredCount !== totalQuestions) return;
    dialogOpenRef.current = true;
    Alert.alert(
      "Submit Exam",
      "Are you sure you want to submit your answers? This exam cannot be retaken.",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            dialogOpenRef.current = false;
          },
        },
        {
          text: "Submit",
          style: "destructive",
          onPress: () => {
            dialogOpenRef.current = false;
            performSubmission("manual");
          },
        },
      ],
      { onDismiss: () => { dialogOpenRef.current = false; } },
    );
  };

  const renderQuestion = ({
    item,
  }: LegendListRenderItemProps<ExamQuestion>) => {
    const optionKeys: OptionKey[] = ["A", "B", "C", "D"];
    const isAnswered = !!selectedAnswers[item.item_id];

    return (
      <View className="mb-4 bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl border border-[#E6E1E8] dark:border-[#37313C] shadow-sm overflow-hidden">
        <View
          style={{ backgroundColor: isAnswered ? theme.surfaceAccent : theme.canvas }}
          className="px-5 py-4 border-b border-[#E6E1E8] dark:border-[#37313C]"
        >
          <View className="flex-row items-center mb-2">
            <View
              style={{
                backgroundColor: isAnswered ? theme.danger : theme.textMuted,
              }}
              className="w-8 h-8 rounded-lg items-center justify-center mr-2"
            >
              <Text className="text-white font-bold text-sm">
                {item.question_number}
              </Text>
            </View>

            <View
              className={`px-3 py-1 rounded-full ${
                isAnswered
                  ? "bg-[#F2ECF8] dark:bg-[#2A2038]"
                  : "bg-[#FCECEF] dark:bg-[#3A2025]"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  isAnswered
                    ? "text-[#167A50] dark:text-[#58C99A]"
                    : "text-[#B42335] dark:text-[#F06A78]"
                }`}
              >
                {isAnswered ? "ANSWERED" : "UNANSWERED"}
              </Text>
            </View>
          </View>

          <Text className="text-base font-semibold text-[#201D25] dark:text-[#F7F4FA]">
            {item.question_text}
          </Text>
        </View>

        <View className="p-5">
          {optionKeys.map((key) => {
            const isSelected = selectedAnswers[item.item_id] === key;

            return (
              <Pressable
                key={key}
                onPress={() =>
                  setSelectedAnswers({
                    ...selectedAnswers,
                    [item.item_id]: key,
                  })
                }
                className={`mb-3 rounded-xl border-2 p-4 flex-row items-center ${
                  isSelected
                    ? "border-[#B42335] bg-[#FCECEF] dark:border-[#F06A78] dark:bg-[#3A2025]"
                    : "border-[#E6E1E8] dark:border-[#37313C]"
                }`}
              >
                <View
                  className={`w-6 h-6 rounded-full border-2 mr-3 ${
                    isSelected
                      ? "border-[#B42335] bg-[#B42335] dark:border-[#F06A78] dark:bg-[#F06A78]"
                      : "border-[#E6E1E8] dark:border-[#37313C]"
                  }`}
                />
                <Text className="flex-1 text-base text-[#201D25] dark:text-[#F7F4FA]">
                  {key}. {item.options[key]}
                </Text>
                {isSelected && (
                  <MaterialIcons
                    name="check-circle"
                    size={22}
                    color={theme.danger}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7FA] dark:bg-[#111014]">
      {/* Timer */}
      <View
        style={{ backgroundColor: isLowTime ? theme.surfaceAccent : theme.danger }}
        className="px-6 py-4"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View
              style={{
                backgroundColor: isLowTime
                  ? theme.danger
                  : "rgba(255, 255, 255, 0.25)",
              }}
              className="w-12 h-12 rounded-xl items-center justify-center mr-3"
            >
              <Ionicons
                name={isLowTime ? "warning" : "timer"}
                size={24}
                color={isLowTime ? theme.surfaceAccent : "white"}
              />
            </View>
            <View>
              <Text
                style={{ color: isLowTime ? theme.danger : "white" }}
                className="text-xs font-semibold mb-1"
              >
                {isLowTime ? "TIME RUNNING OUT!" : "TIME REMAINING"}
              </Text>
              <Text
                style={{ color: isLowTime ? theme.danger : "white" }}
                className="text-2xl font-bold"
              >
                {minutes.toString().padStart(2, "0")}:
                {seconds.toString().padStart(2, "0")}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Progress */}
      <View className="bg-[#FFFFFF] dark:bg-[#1A181E] px-6 py-4 border-b border-[#E6E1E8] dark:border-[#37313C]">
        <Text className="text-sm font-semibold text-[#201D25] dark:text-[#F7F4FA]">
          {answeredCount}/{totalQuestions} answered
        </Text>
        <View className="h-3 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-full mt-2">
          <View
            className="h-full rounded-full bg-[#B42335] dark:bg-[#F06A78]"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      <LegendList
        ref={listRef}
        data={questions}
        renderItem={renderQuestion}
        keyExtractor={(item) => item.item_id.toString()}
        contentContainerClassName="p-6"
        extraData={selectedAnswers}
      />

      {/* Submit */}
      <View className="bg-[#FFFFFF] dark:bg-[#1A181E] border-t border-[#E6E1E8] dark:border-[#37313C] px-6 py-4">
        <Pressable
          onPress={handleSubmitExam}
          disabled={status !== "active" || isSubmitting || answeredCount !== totalQuestions}
        >
          {({ pressed }) => (
            <View
              className="py-4 rounded-xl items-center"
              style={{
                backgroundColor: answeredCount !== totalQuestions
                  ? theme.surfaceMuted
                  : pressed
                    ? theme.primaryPressed
                    : theme.school,
              }}
            >
              <Text className="font-bold text-base" style={{ color: answeredCount === totalQuestions ? "#FFFFFF" : theme.textMuted }}>Submit Exam</Text>
            </View>
          )}
        </Pressable>
      </View>

    </SafeAreaView>
  );
}
