import {
  useQuizAnswers,
} from "@/api/QueryOptions/quizAnswersMutation";
import {
  fetchQuizResult,
  getApiErrorStatus,
} from "@/api/QueryFunctions/fetchAssessmentResult";
import { startAssessmentSession } from "@/api/QueryFunctions/startAssessmentSession";
import createQuizQuestionsOptions from "@/api/QueryOptions/quizQuestionsOptions";
import QuizSubmissionModal from "@/components/QuizSubmissionModal";
import AssessmentFocusWarningModal from "@/components/AssessmentFocusWarningModal";
import AssessmentTakeoverModal from "@/components/AssessmentTakeoverModal";
import { takeoverAssessmentSession } from "@/api/QueryFunctions/assessmentSessionLease";
import ScreenLoading from "@/components/ScreenLoading";
import { useQuizStore } from "@/store/useQuizStore";
import { flushAssessmentStorage } from "@/store/assessmentStorage";
import { useAppTheme } from "@/theme";
import type { OptionKey, Question } from "@/types/api";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePreventRemove } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  Text,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { SubmissionReason } from "@/types/assessmentAttempt";
import { useAssessmentScreenCapture } from "@/utils/useAssessmentScreenCapture";
import { useAssessmentFocusGuard } from "@/utils/useAssessmentFocusGuard";
import { isAssessmentLeaseEvicted } from "@/utils/assessmentLease";
import { getAssessmentClientId } from "@/utils/assessmentClientId";
import { useAssessmentSessionRuntime } from "@/utils/useAssessmentSessionRuntime";
import { HTMLContent } from "@/utils/RenderHTML";

export default function QuizTaking() {
  const { theme } = useAppTheme();
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionRetry, setSessionRetry] = useState(0);
  const [recoveryRetry, setRecoveryRetry] = useState(0);
  const [navigationAllowed, setNavigationAllowed] = useState(false);
  const [takeoverRequest, setTakeoverRequest] = useState<{
    sessionId: number;
    generation: number;
  } | null>(null);
  const [takeoverPending, setTakeoverPending] = useState(false);

  const startInFlightRef = useRef(false);
  const submissionInFlightRef = useRef(false);
  const recoveryInFlightRef = useRef(false);
  const dialogOpenRef = useRef(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  useAssessmentScreenCapture("quiz-taking");

  const {
    quiz_id,
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
    recordFocusLoss,
    setAnswerRevision,
    markSubmitting,
    markSubmitted,
    markActive,
    markRecoveryError,
    clearAttempt,
  } = useQuizStore();

  const listRef = useRef<any>(null);
  useEffect(() => {
    if (
      !hasHydrated ||
      status !== "starting" ||
      quiz_id <= 0 ||
      instance_id <= 0 ||
      startInFlightRef.current
    ) return;

    let cancelled = false;
    startInFlightRef.current = true;
    setSessionError(null);
    getAssessmentClientId()
      .then((clientId) => startAssessmentSession({
        assessment_id: quiz_id,
        instance_id,
        category: "quiz",
        client_id: clientId,
      }))
      .then((session) => {
        if (!cancelled) {
          const deadline = new Date(session.deadline_at).getTime();
          const remaining = session.remaining_seconds ?? 0;
          setSecondsLeft(Math.max(0, Math.ceil(remaining)));
          setSession(session.session_token, deadline, {
            session_id: session.session_id,
            lease_generation: session.lease_generation,
            lease_token: session.lease_token,
            resumed: session.resumed,
          });
        }
      })
      .catch((error: any) => {
        if (!cancelled) {
          const detail = error?.response?.data?.detail;
          if (
            error?.response?.status === 409 &&
            detail?.code === "TAKEOVER_REQUIRED" &&
            Number.isFinite(Number(detail.session_id)) &&
            Number.isFinite(Number(detail.lease_generation))
          ) {
            setTakeoverRequest({
              sessionId: Number(detail.session_id),
              generation: Number(detail.lease_generation),
            });
          } else {
            setSessionError(
              typeof detail === "string"
                ? detail
                : error?.message ?? "Unable to start quiz session.",
            );
          }
        }
      })
      .finally(() => {
        startInFlightRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, instance_id, quiz_id, sessionRetry, setSession, status]);

  const {
    data: questionsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...createQuizQuestionsOptions(quiz_id, instance_id, session_token),
    enabled: status === "active" && quiz_id > 0 && instance_id > 0 && !!session_token,
  });

  const { mutateAsync: submitAnswers, isPending: isSubmitting } = useQuizAnswers({
    onError: () => undefined,
  });

  const { queueAutosave, reportFocusLoss, setAnswerVersions } = useAssessmentSessionRuntime({
    getAttempt: useQuizStore.getState,
    setAnswerRevision,
    setRemainingSeconds: setSecondsLeft,
    leaseKey:
      status === "active"
        ? `${useQuizStore.getState().session_id}:${useQuizStore.getState().lease_generation}:${session_token}`
        : "",
  });
  const restoredQuestionStateRef = useRef("");

  useEffect(() => {
    if (!questionsData || !session_token) return;
    const restoreKey = `${session_token}:${questionsData.questions.length}`;
    if (restoredQuestionStateRef.current === restoreKey) return;
    restoredQuestionStateRef.current = restoreKey;
    const currentAnswers = useQuizStore.getState().selectedAnswers;
    setSelectedAnswers({
      ...(questionsData.saved_answers ?? {}),
      ...currentAnswers,
    });
    setAnswerVersions(questionsData.answer_versions ?? {});
  }, [questionsData, session_token, setAnswerVersions, setSelectedAnswers]);

  const recoverExistingResult = useCallback(async () => {
    const attempt = useQuizStore.getState();
    if (isAssessmentLeaseEvicted(attempt.session_token, attempt.lease_token)) return;
    const recovered = await fetchQuizResult(quiz_id, instance_id, session_token);
    if (isAssessmentLeaseEvicted(attempt.session_token, attempt.lease_token)) return;
    markSubmitted(recovered);
  }, [instance_id, markSubmitted, quiz_id, session_token]);

  const submitAttempt = useCallback(
    async (reason: SubmissionReason, recovering = false) => {
      const attempt = useQuizStore.getState();
      if (!attempt.session_token || submissionInFlightRef.current) return;
      if (isAssessmentLeaseEvicted(attempt.session_token, attempt.lease_token)) return;
      if (!recovering && attempt.status !== "active") return;

      submissionInFlightRef.current = true;
      markSubmitting(reason);
      try {
        await flushAssessmentStorage();
        if (isAssessmentLeaseEvicted(attempt.session_token, attempt.lease_token)) return;
        const submittedResult = await submitAnswers({
          quiz_id: attempt.quiz_id,
          instance_id: attempt.instance_id,
          answers: attempt.selectedAnswers,
          submission_reason: reason,
          session_token: attempt.session_token,
        });
        if (isAssessmentLeaseEvicted(attempt.session_token, attempt.lease_token)) return;
        markSubmitted(submittedResult);
      } catch (error) {
        if (isAssessmentLeaseEvicted(attempt.session_token, attempt.lease_token)) return;
        if (getApiErrorStatus(error) === 409 && /already submitted/i.test((error as Error).message)) {
          try {
            await recoverExistingResult();
            return;
          } catch (recoveryError) {
            markRecoveryError((recoveryError as Error).message);
            return;
          }
        }

        const message = (error as Error).message || "Unable to submit quiz.";
        if (reason === "manual" && !recovering) {
          try {
            await recoverExistingResult();
          } catch (recoveryError) {
            if (getApiErrorStatus(recoveryError) === 404) {
              markActive();
              Alert.alert("Submission failed", `${message}\n\nYour answers are still available. Please try again.`);
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

  const { warningVisible, contentObscured, returnToAnswering } =
    useAssessmentFocusGuard({
      active: status === "active" && !!session_token,
      ignoreFocusLossRef: dialogOpenRef,
      recordFocusLoss,
      reportFocusLoss,
      onSecondEpisode: () => performSubmission("tab_switch"),
    });

  usePreventRemove(status !== "idle" && !navigationAllowed, () => {
    const attempt = useQuizStore.getState();
    if (attempt.status === "active" && attempt.session_token) {
      performSubmission("navigation_attempt");
    }
  });

  const confirmTakeover = useCallback(async () => {
    if (!takeoverRequest || takeoverPending) return;
    setTakeoverPending(true);
    try {
      const clientId = await getAssessmentClientId();
      const session = await takeoverAssessmentSession(takeoverRequest.sessionId, {
        client_id: clientId,
        expected_generation: takeoverRequest.generation,
      });
      const deadline = new Date(session.deadline_at).getTime();
      setSecondsLeft(Math.max(0, Math.ceil(session.remaining_seconds)));
      setSession(session.session_token, deadline, {
        session_id: session.session_id,
        lease_generation: session.lease_generation,
        resumed: true,
      });
      setTakeoverRequest(null);
    } catch (error: any) {
      if (!isAssessmentLeaseEvicted(useQuizStore.getState().session_token)) {
        setSessionError(
          error?.response?.data?.detail?.code ??
            error?.message ??
            "Unable to take over this quiz session.",
        );
        setTakeoverRequest(null);
      }
    } finally {
      setTakeoverPending(false);
    }
  }, [setSession, takeoverPending, takeoverRequest]);

  const cancelTakeover = useCallback(() => {
    setTakeoverRequest(null);
    setNavigationAllowed(true);
    clearAttempt();
  }, [clearAttempt]);

  const recoverSubmission = useCallback(async () => {
    if (!session_token || recoveryInFlightRef.current || submissionInFlightRef.current) return;
    recoveryInFlightRef.current = true;
    try {
      await recoverExistingResult();
    } catch (error) {
      if (getApiErrorStatus(error) === 404) {
        await submitAttempt(submissionReason ?? "navigation_attempt", true);
      } else {
        markRecoveryError((error as Error).message || "Unable to recover quiz result.");
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
    if (!deadlineAt || status !== "active") return;
    const interval = setInterval(() => {
      setSecondsLeft((previous) => {
        const remaining = Math.max(0, previous - 1);
        if (previous > 600 && remaining <= 600) Vibration.vibrate(500);
        return remaining;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [deadlineAt, status]);

  useEffect(() => {
    if (status === "active" && secondsLeft === 0) {
      performSubmission("time_expired");
    }
  }, [performSubmission, secondsLeft, status]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      const attemptStatus = useQuizStore.getState().status;
      if (
        next === "active" &&
        (attemptStatus === "submitting" || attemptStatus === "recovery_error")
      ) {
        void recoverSubmission();
      }
    });
    return () => subscription.remove();
  }, [recoverSubmission]);

  const handleModalClose = () => {
    queryClient.removeQueries({ queryKey: ["quiz_questions", quiz_id, instance_id, session_token] });
    void queryClient.invalidateQueries({ queryKey: ["list_quizzes", instance_id] });
    setNavigationAllowed(true);
    clearAttempt();
  };

  useEffect(() => {
    if (navigationAllowed) {
      router.replace("/(course_tabs)/assessments");
    }
  }, [navigationAllowed, router]);

  if (!hasHydrated) {
    return <ScreenLoading message="Restoring your quiz attempt..." />;
  }

  if (navigationAllowed) {
    return <ScreenLoading message="Returning to assessments..." />;
  }

  if (takeoverRequest) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7F7FA] dark:bg-[#111014]">
        <AssessmentTakeoverModal
          visible
          pending={takeoverPending}
          onCancel={cancelTakeover}
          onConfirm={() => void confirmTakeover()}
        />
      </SafeAreaView>
    );
  }

  if (status === "idle" || quiz_id <= 0 || instance_id <= 0) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#F7F7FA] dark:bg-[#111014] px-6">
        <Ionicons name="alert-circle-outline" size={64} color={theme.danger} />
        <Text className="text-lg font-semibold text-[#201D25] dark:text-[#F7F4FA] mt-4">Unable to prepare quiz</Text>
        <Text className="text-base text-[#6C6572] dark:text-[#BEB6C5] text-center mt-2">Return to assessments and confirm a new quiz attempt.</Text>
        <Pressable onPress={() => router.replace("/(course_tabs)/assessments")} className="mt-6 px-6 py-3 rounded-xl" style={{ backgroundColor: theme.school }}>
          <Text className="text-white font-semibold">Back to assessments</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (status === "submitted" && result) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7F7FA] dark:bg-[#111014]">
        <QuizSubmissionModal
          visible
          onClose={handleModalClose}
          submissionReason={submissionReason ?? result.submission_reason}
          resultData={result}
        />
      </SafeAreaView>
    );
  }

  if (status === "submitting") {
    return <ScreenLoading message="Submitting your quiz and preparing the result..." />;
  }

  if (status === "recovery_error") {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#F7F7FA] dark:bg-[#111014] px-6">
        <Ionicons name="cloud-offline-outline" size={64} color={theme.danger} />
        <Text className="text-lg font-semibold text-[#201D25] dark:text-[#F7F4FA] mt-4">Unable to recover quiz result</Text>
        <Text className="text-base text-[#6C6572] dark:text-[#BEB6C5] text-center mt-2">{recoveryError}</Text>
        <Pressable onPress={() => setRecoveryRetry((value) => value + 1)} className="mt-6 px-6 py-3 rounded-xl" style={{ backgroundColor: theme.school }}>
          <Text className="text-white font-semibold">Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!sessionError && (status === "starting" || !session_token || deadlineAt === null || isLoading)) {
    return <ScreenLoading message={!session_token || deadlineAt === null ? "Preparing your secure quiz session..." : "Loading quiz questions..."} />;
  }

  if (sessionError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-[#F7F7FA] dark:bg-[#111014] px-6">
        <Ionicons name="alert-circle-outline" size={64} color={theme.danger} />
        <Text className="text-lg font-semibold text-[#201D25] dark:text-[#F7F4FA] mt-4">Unable to start quiz</Text>
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
        <Ionicons name="alert-circle-outline" size={64} color={theme.danger} />
        <Text className="text-lg font-semibold text-[#201D25] dark:text-[#F7F4FA] mt-4">
          Error Loading Quiz
        </Text>
        <Text className="text-base text-[#6C6572] dark:text-[#BEB6C5] text-center mt-2">
          {(error as Error).message}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 bg-[#B42335] active:bg-[#B42335] dark:bg-[#F06A78] dark:active:bg-[#F06A78] px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleSubmitQuiz = () => {
    if (status !== "active") return;

    const questions = questionsData?.questions || [];
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount === questions.length) {
      dialogOpenRef.current = true;
      Alert.alert(
        "Submit Quiz",
        "Are you sure you want to submit your answers? You cannot change them after submission.",
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
    } else {
      const firstUnansweredIndex = questions.findIndex(
        (q) => !selectedAnswers[q.item_id],
      );

      dialogOpenRef.current = true;
      Alert.alert(
        "Incomplete Quiz",
        `You have answered ${answeredCount} out of ${questions.length} questions. Please answer all questions before submitting.`,
        [
          {
            text: "OK",
            onPress: () => {
              dialogOpenRef.current = false;
              if (firstUnansweredIndex !== -1 && listRef.current) {
                listRef.current.scrollToIndex({
                  index: firstUnansweredIndex,
                  animated: true,
                  viewPosition: 0.2,
                });
              }
            },
          },
        ],
        { onDismiss: () => { dialogOpenRef.current = false; } },
      );
    }
  };

  const renderQuestion = ({ item }: LegendListRenderItemProps<Question>) => {
    const optionKeys: OptionKey[] = ["A", "B", "C", "D"];
    const isAnswered = !!selectedAnswers[item.item_id];

    return (
      <View className="mb-4 bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl border border-[#E6E1E8] dark:border-[#37313C] shadow-sm overflow-hidden">
        {/* Question Header */}
        <View
          style={{ backgroundColor: isAnswered ? theme.surfaceAccent : theme.canvas }}
          className="px-5 py-4 border-b border-[#E6E1E8] dark:border-[#37313C]"
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
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
                {!isAnswered && (
                  <View
                    style={{ backgroundColor: theme.surfaceAccent }}
                    className="px-3 py-1 rounded-full"
                  >
                    <Text
                      style={{ color: theme.danger }}
                      className="text-xs font-bold"
                    >
                      UNANSWERED
                    </Text>
                  </View>
                )}
                {isAnswered && (
                  <View
                    style={{ backgroundColor: theme.surfaceMuted }}
                    className="px-3 py-1 rounded-full"
                  >
                    <Text
                      style={{ color: theme.success }}
                      className="text-xs font-bold"
                    >
                      ANSWERED
                    </Text>
                  </View>
                )}
              </View>
              <View className="flex-1">
                {item.content_format_version === 1 && item.question_html ? (
                  <HTMLContent htmlContent={item.question_html} />
                ) : (
                  <Text className="text-base font-semibold text-[#201D25] dark:text-[#F7F4FA] leading-6">
                    {item.question}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Options */}
        <View className="p-5">
          {optionKeys.map((key, index) => {
            const isSelected = selectedAnswers[item.item_id] === key;
            return (
              <Pressable
                key={key}
                className={`mb-3 rounded-xl border-2 overflow-hidden ${
                  isSelected
                    ? "border-[#B42335] bg-[#FCECEF] dark:border-[#F06A78] dark:bg-[#3A2025]"
                    : "border-[#E6E1E8] bg-[#FFFFFF] dark:border-[#37313C] dark:bg-[#1A181E]"
                }`}
                 onPress={() => {
                  const answers = {
                    ...selectedAnswers,
                    [item.item_id]: key,
                  };
                  setSelectedAnswers(answers);
                  queueAutosave(item.session_question_id, key);
                }}
              >
                <View className="flex-row items-center p-4">
                  {/* Radio Button */}
                  <View
                    className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                      isSelected
                        ? "border-[#B42335] bg-[#B42335] dark:border-[#F06A78] dark:bg-[#F06A78]"
                        : "border-[#E6E1E8] dark:border-[#37313C]"
                    }`}
                  >
                    {isSelected && (
                      <View className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </View>

                  {/* Option Letter Badge */}
                  <View
                    style={{
                      backgroundColor: isSelected ? theme.danger : theme.surfaceMuted,
                    }}
                    className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                  >
                    <Text
                      style={{ color: isSelected ? "white" : theme.text }}
                      className="font-bold text-sm"
                    >
                      {key}
                    </Text>
                  </View>

                  {/* Option Text */}
                  <View className="flex-1">
                    {item.content_format_version === 1 && item.options_html?.[key] ? (
                      <HTMLContent htmlContent={item.options_html[key]!} />
                    ) : (
                      <Text
                        className={`text-base leading-6 ${
                          isSelected
                            ? "text-[#201D25] dark:text-[#F7F4FA] font-semibold"
                            : "text-[#6C6572] dark:text-[#BEB6C5]"
                        }`}
                      >
                        {item.options[key]}
                      </Text>
                    )}
                  </View>

                  {/* Selected Icon */}
                  {isSelected && (
                    <MaterialIcons
                      name="check-circle"
                      size={24}
                      color={theme.danger}
                    />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const totalQuestions = questionsData?.questions.length || 0;
  const progressPercentage = (answeredCount / totalQuestions) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const isLowTime = secondsLeft <= 600; // 10 minutes or less

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7FA] dark:bg-[#111014]">
      {/* Timer Header */}
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

      {/* Progress Bar */}
      <View className="bg-[#FFFFFF] dark:bg-[#1A181E] px-6 py-4 border-b border-[#E6E1E8] dark:border-[#37313C]">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-semibold text-[#6C6572] dark:text-[#BEB6C5]">Progress</Text>
          <Text className="text-sm font-bold text-[#201D25] dark:text-[#F7F4FA]">
            {answeredCount}/{totalQuestions}
          </Text>
        </View>
        <View className="h-3 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor:
                progressPercentage === 100 ? theme.success : theme.danger,
            }}
          />
        </View>
        <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] mt-1">
          {answeredCount === totalQuestions
            ? "All questions answered!"
            : `${totalQuestions - answeredCount} question${totalQuestions - answeredCount !== 1 ? "s" : ""} remaining`}
        </Text>
      </View>

      {/* Questions List */}
      <View className="flex-1">
        <LegendList
          ref={listRef}
          data={questionsData?.questions || []}
          renderItem={renderQuestion}
          keyExtractor={(item) =>
            (item.session_question_id ?? item.item_id).toString()
          }
          contentContainerClassName="p-6"
          extraData={{ selectedAnswers }}
          recycleItems
        />
        {contentObscured ? (
          <View className="absolute inset-0 bg-[#111014]" />
        ) : null}
      </View>

      {/* Submit Button Footer */}
      <View className="bg-[#FFFFFF] dark:bg-[#1A181E] border-t border-[#E6E1E8] dark:border-[#37313C] px-6 py-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <MaterialIcons
              name={
                answeredCount === totalQuestions
                  ? "check-circle"
                  : "radio-button-unchecked"
              }
              size={20}
              color={answeredCount === totalQuestions ? theme.success : theme.textMuted}
            />
            <Text className="text-sm text-[#6C6572] dark:text-[#BEB6C5] ml-2">
              {answeredCount} of {totalQuestions} answered
            </Text>
          </View>
          {answeredCount < totalQuestions && (
            <View
              style={{ backgroundColor: theme.surfaceMuted }}
              className="px-2 py-1 rounded-full"
            >
              <Text style={{ color: theme.warning }} className="text-xs font-bold">
                INCOMPLETE
              </Text>
            </View>
          )}
        </View>

        <Pressable
          onPress={handleSubmitQuiz}
          disabled={isSubmitting || status !== "active"}
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
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View className="flex-row items-center">
                  <MaterialIcons name="send" size={20} color={answeredCount === totalQuestions ? "#FFFFFF" : theme.textMuted} />
                  <Text className="font-bold text-base ml-2" style={{ color: answeredCount === totalQuestions ? "#FFFFFF" : theme.textMuted }}>
                    Submit Quiz
                  </Text>
                </View>
              )}
            </View>
          )}
        </Pressable>

        {answeredCount < totalQuestions && (
          <Text className="text-xs text-center text-[#6C6572] dark:text-[#BEB6C5] mt-2">
            Please answer all questions before submitting
          </Text>
        )}
      </View>

      <AssessmentFocusWarningModal
        visible={warningVisible}
        assessmentLabel="quiz"
        onReturn={returnToAnswering}
      />

    </SafeAreaView>
  );
}
