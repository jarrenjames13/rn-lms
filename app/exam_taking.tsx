import { useExamAnswers } from "@/api/QueryOptions/examAnswersMutation";
import {
  fetchExamResult,
  getApiErrorStatus,
} from "@/api/QueryFunctions/fetchAssessmentResult";
import { startAssessmentSession } from "@/api/QueryFunctions/startAssessmentSession";
import { fetchExamRetryStatus } from "@/api/QueryFunctions/fetchExamRetryStatus";
import createExamQuestionsOptions from "@/api/QueryOptions/examQuestionsOptions";
import ExamSubmissionModal from "@/components/ExamSubmissionModal";
import { ExamIdentityCapture } from "@/components/ExamIdentityCapture";
import AssessmentFocusWarningModal from "@/components/AssessmentFocusWarningModal";
import AssessmentTakeoverModal from "@/components/AssessmentTakeoverModal";
import { takeoverAssessmentSession } from "@/api/QueryFunctions/assessmentSessionLease";
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
import { AssessmentItemContent } from "@/components/AssessmentItemContent";
import { getAssessmentHttpError } from "@/utils/assessmentHttpError";

export default function ExamTaking() {
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
  const [appForegrounded, setAppForegrounded] = useState(AppState.currentState === "active");
  const [captureRetryWaiting, setCaptureRetryWaiting] = useState(false);

  const startInFlightRef = useRef(false);
  const submissionInFlightRef = useRef(false);
  const recoveryInFlightRef = useRef(false);
  const securityEventInFlightRef = useRef(false);
  const dialogOpenRef = useRef(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  useAssessmentScreenCapture("exam-taking");

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      setAppForegrounded(next === "active");
      if (next !== "active") setCaptureRetryWaiting(false);
    });
    return () => subscription.remove();
  }, []);

  const {
    exam_id,
    instance_id,
    session_token,
    client_id,
    lease_generation,
    session_id,
    capture_state: captureState,
    security_policy: securityPolicy,
    deadline_at: deadlineAt,
    status,
    submission_reason: submissionReason,
    result,
    recovery_error: recoveryError,
    hasHydrated,
    selectedAnswers,
    setSelectedAnswers,
    setSession,
    prepareLeaseRecovery,
    recordFocusLoss,
    setAnswerRevision,
    setCaptureState,
    markFinalizationPending,
    markSubmitting,
    markSubmitted,
    markActive,
    markRecoveryError,
    clearAttempt,
  } = useExamStore();

  useEffect(() => {
    setCaptureRetryWaiting(false);
  }, [session_id, lease_generation]);

  const listRef = useRef<any>(null);
  useEffect(() => {
    if (!hasHydrated || status !== "active") return;
    const leaseReady =
      !!session_token &&
      !!client_id &&
      Number.isInteger(Number(session_id)) &&
      Number(session_id) > 0 &&
      Number.isInteger(Number(lease_generation)) &&
      Number(lease_generation) > 0;
    if (!leaseReady) prepareLeaseRecovery();
  }, [
    client_id,
    hasHydrated,
    lease_generation,
    prepareLeaseRecovery,
    session_id,
    session_token,
    status,
  ]);

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
    getAssessmentClientId()
      .then((clientId) => startAssessmentSession({
        assessment_id: exam_id,
        instance_id,
        category: "exam",
        client_id: clientId,
      }).then((session) => ({ clientId, session })))
      .then(({ clientId, session }) => {
        if (!cancelled) {
          const deadline = new Date(session.deadline_at).getTime();
          const remaining = session.remaining_seconds ?? 0;
          setSecondsLeft(Math.max(0, Math.ceil(remaining)));
          setSession(session.session_token, deadline, {
            session_id: session.session_id,
            lease_generation: session.lease_generation,
            client_id: clientId,
            unload_credential: session.unload_credential,
            security_policy: session.security_policy,
            camera_required: session.camera_required,
            capture_state: session.capture_state,
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
            setSessionError(getAssessmentHttpError(error, "Unable to start exam session.").message);
          }
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
    ...createExamQuestionsOptions(
      exam_id,
      instance_id,
      session_token,
      client_id ?? "",
      lease_generation ?? 0,
    ),
    enabled: status === "active" && exam_id > 0 && instance_id > 0 &&
      !!session_token && !!client_id && lease_generation != null,
  });

  const { mutateAsync: submitAnswers, isPending: isSubmitting } = useExamAnswers({
    onError: () => undefined,
  });

  const { queueAutosave, flushPendingSaves, reportFocusLoss, reportSecurityEvent, setAnswerVersions, sendHeartbeat } = useAssessmentSessionRuntime({
    getAttempt: useExamStore.getState,
    setAnswerRevision,
    setRemainingSeconds: setSecondsLeft,
    setCaptureState,
    onSessionTerminal: markFinalizationPending,
    leaseKey:
      status === "active"
        ? `${useExamStore.getState().session_id}:${useExamStore.getState().lease_generation}:${session_token}`
        : "",
  });
  const restoredQuestionStateRef = useRef("");

  useEffect(() => {
    if (!questionsData || !session_token) return;
    const restoreKey = `${session_token}:${questionsData.questions.length}`;
    if (restoredQuestionStateRef.current === restoreKey) return;
    restoredQuestionStateRef.current = restoreKey;
    const currentAnswers = useExamStore.getState().selectedAnswers;
    setSelectedAnswers({
      ...(questionsData.saved_answers ?? {}),
      ...currentAnswers,
    });
    setAnswerVersions(questionsData.answer_versions ?? {});
  }, [questionsData, session_token, setAnswerVersions, setSelectedAnswers]);

  const recoverExistingResult = useCallback(async () => {
    const attempt = useExamStore.getState();
    if (isAssessmentLeaseEvicted(attempt.session_token)) return;
    const recovered = await fetchExamResult(exam_id, instance_id, session_token);
    if (isAssessmentLeaseEvicted(attempt.session_token)) return;
    markSubmitted(recovered);
  }, [exam_id, instance_id, markSubmitted, session_token]);

  const submitAttempt = useCallback(
    async (reason: SubmissionReason, recovering = false) => {
      const initialAttempt = useExamStore.getState();
      if (!initialAttempt.session_token || submissionInFlightRef.current) return;
      if (isAssessmentLeaseEvicted(initialAttempt.session_token)) return;
      if (!recovering && initialAttempt.status !== "active") return;

      submissionInFlightRef.current = true;
      try {
        await flushPendingSaves();
        const readyAttempt = useExamStore.getState();
        const sameLease =
          readyAttempt.session_token === initialAttempt.session_token &&
          String(readyAttempt.session_id) === String(initialAttempt.session_id) &&
          readyAttempt.client_id === initialAttempt.client_id &&
          readyAttempt.lease_generation === initialAttempt.lease_generation;
        if (!sameLease || isAssessmentLeaseEvicted(initialAttempt.session_token)) return;
        if (!recovering && readyAttempt.status !== "active") return;
        if (readyAttempt.session_id == null || readyAttempt.lease_generation == null) {
          throw new Error("The active exam session is missing its lease metadata.");
        }
        markSubmitting(reason);
        await flushAssessmentStorage();
        const attempt = useExamStore.getState();
        if (
          attempt.session_token !== initialAttempt.session_token ||
          String(attempt.session_id) !== String(initialAttempt.session_id) ||
          attempt.client_id !== initialAttempt.client_id ||
          attempt.lease_generation !== initialAttempt.lease_generation ||
          isAssessmentLeaseEvicted(initialAttempt.session_token)
        ) return;
        const submittedResult = await submitAnswers({
          exam_id: attempt.exam_id,
          instance_id: attempt.instance_id,
          answers: attempt.selectedAnswers,
          submission_reason: reason,
          session_token: attempt.session_token,
          session_id: Number(attempt.session_id),
          client_id: attempt.client_id ?? await getAssessmentClientId(),
          lease_generation: Number(attempt.lease_generation),
        });
        const latestAttempt = useExamStore.getState();
        if (
          latestAttempt.session_token !== attempt.session_token ||
          latestAttempt.session_id !== attempt.session_id ||
          latestAttempt.lease_generation !== attempt.lease_generation ||
          isAssessmentLeaseEvicted(attempt.session_token)
        ) return;
        markSubmitted(submittedResult);
      } catch (error) {
        if (isAssessmentLeaseEvicted(initialAttempt.session_token)) return;
        const apiError = getAssessmentHttpError(error, "Unable to submit exam.");
        if (apiError.code === "IDENTITY_CAPTURE_REQUIRED") {
          setCaptureState("due");
          markActive();
          Alert.alert("Identity capture required", "Upload the scheduled identity image before submitting the exam.");
          return;
        }
        if (apiError.code === "ASSESSMENT_SESSION_TERMINAL" || apiError.code === "ASSESSMENT_DEADLINE_EXPIRED" || apiError.code === "ASSESSMENT_FINALIZING") {
          markFinalizationPending();
          return;
        }
        if (getApiErrorStatus(error) === 409 && /already submitted/i.test((error as Error).message)) {
          try {
            await recoverExistingResult();
            return;
          } catch (recoveryError) {
            markRecoveryError((recoveryError as Error).message);
            return;
          }
        }

        const message = apiError.message;
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
      markFinalizationPending,
      markRecoveryError,
      markSubmitted,
      markSubmitting,
      flushPendingSaves,
      recoverExistingResult,
      submitAnswers,
      setCaptureState,
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
      focusThreshold: securityPolicy?.focus_threshold,
      onThresholdReached: () => {
        markFinalizationPending();
        void recoverSubmission();
      },
      onReportError: (error) => {
        Alert.alert(
          "Unable to verify exam security status",
          getAssessmentHttpError(error, "Reconnect and return to the exam.").message,
        );
      },
    });

  usePreventRemove(status !== "idle" && !navigationAllowed, () => {
    const attempt = useExamStore.getState();
    if (attempt.status === "active" && attempt.session_token && !securityEventInFlightRef.current) {
      securityEventInFlightRef.current = true;
      void reportSecurityEvent("navigation_attempt")
        .then((event) => {
          if (event.must_submit) {
            markFinalizationPending();
            void recoverSubmission();
          }
        })
        .catch((error) => {
          Alert.alert(
            "Unable to verify navigation attempt",
            getAssessmentHttpError(error, "Reconnect before leaving the exam.").message,
          );
        })
        .finally(() => {
          securityEventInFlightRef.current = false;
        });
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
        client_id: clientId,
        unload_credential: session.unload_credential,
        security_policy: session.security_policy,
        resumed: true,
      });
      setTakeoverRequest(null);
    } catch (error: any) {
      if (!isAssessmentLeaseEvicted(useExamStore.getState().session_token)) {
        setSessionError(
          error?.response?.data?.detail?.code ??
            error?.message ??
            "Unable to take over this exam session.",
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
      const attempt = useExamStore.getState();
      if (!attempt.client_id || attempt.session_id == null || attempt.lease_generation == null) {
        throw new Error("The exam session cannot be recovered because its lease metadata is missing.");
      }
      for (let attemptNumber = 0; attemptNumber < 5; attemptNumber += 1) {
        if (isAssessmentLeaseEvicted(attempt.session_token)) return;
        try {
          const recovered = await fetchExamResult(attempt.exam_id, attempt.instance_id, attempt.session_token);
          if (isAssessmentLeaseEvicted(attempt.session_token)) return;
          markSubmitted(recovered);
          return;
        } catch (error) {
          const detail = getAssessmentHttpError(error);
          if (detail.status !== 404 && detail.code !== "ASSESSMENT_FINALIZING") throw error;
        }

        const retryStatus = await fetchExamRetryStatus(
          attempt.exam_id,
          attempt.instance_id,
          attempt.session_token,
          attempt.client_id,
          attempt.lease_generation,
        );
        if (retryStatus.state === "ACTIVE" && retryStatus.can_retry) {
          await submitAttempt(submissionReason ?? "navigation_attempt", true);
          return;
        }
        if (retryStatus.code === "ASSESSMENT_LEASE_TAKEN_OVER") {
          markRecoveryError("This exam attempt is active on another device.");
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      markRecoveryError("The server is still finalizing this exam. Try again shortly.");
    } catch (error) {
      markRecoveryError(getAssessmentHttpError(error, "Unable to recover exam result.").message);
    } finally {
      recoveryInFlightRef.current = false;
    }
  }, [markRecoveryError, markSubmitted, session_token, submissionReason, submitAttempt]);

  useEffect(() => {
    if (
      hasHydrated &&
      (status === "submitting" || status === "finalization_pending" || status === "recovery_error") &&
      AppState.currentState === "active"
    ) {
      void recoverSubmission();
    }
  }, [hasHydrated, recoverSubmission, recoveryRetry, status]);

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
      const attemptStatus = useExamStore.getState().status;
      if (
        next === "active" &&
        (attemptStatus === "submitting" || attemptStatus === "finalization_pending" || attemptStatus === "recovery_error")
      ) {
        void recoverSubmission();
      }
    });
    return () => subscription.remove();
  }, [recoverSubmission]);

  if (!hasHydrated) {
    return <ScreenLoading message="Restoring your exam attempt..." />;
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

  if (status === "finalization_pending") {
    return <ScreenLoading message="The server is finalizing your exam result..." />;
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
    if (status !== "active" || captureState === "due" || answeredCount !== totalQuestions) return;
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

          <View className="mt-1">
            <AssessmentItemContent
              contentFormatVersion={item.content_format_version}
              htmlContent={item.question_html}
              plainText={item.question_text}
              plainTextClassName="text-base font-semibold text-[#201D25] dark:text-[#F7F4FA]"
            />
          </View>
        </View>

        <View className="p-5">
          {optionKeys.map((key) => {
            const isSelected = selectedAnswers[item.item_id] === key;

            return (
              <Pressable
                key={key}
                disabled={status !== "active" || captureState === "due"}
                onPress={() => {
                  setSelectedAnswers({
                    ...selectedAnswers,
                    [item.item_id]: key,
                  });
                  queueAutosave(item.session_question_id, key);
                }}
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
                <View className="flex-1">
                  <Text className="text-base font-semibold text-[#201D25] dark:text-[#F7F4FA]">
                    {key}.
                  </Text>
                  <AssessmentItemContent
                    contentFormatVersion={item.content_format_version}
                    htmlContent={item.options_html?.[key]}
                    plainText={item.options[key]}
                    plainTextClassName="text-base text-[#201D25] dark:text-[#F7F4FA]"
                  />
                </View>
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

      <View className="flex-1">
        <LegendList
          ref={listRef}
          data={questions}
          renderItem={renderQuestion}
          keyExtractor={(item) =>
            (item.session_question_id ?? item.item_id).toString()
          }
          contentContainerClassName="p-6"
          extraData={selectedAnswers}
        />
        {contentObscured ? (
          <View className="absolute inset-0 bg-[#111014]" />
        ) : null}
      </View>

      {/* Submit */}
      <View className="bg-[#FFFFFF] dark:bg-[#1A181E] border-t border-[#E6E1E8] dark:border-[#37313C] px-6 py-4">
        <Pressable
          onPress={handleSubmitExam}
          disabled={status !== "active" || isSubmitting || captureState === "due" || answeredCount !== totalQuestions}
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

      {appForegrounded && status === "active" && (captureState === "due" || captureRetryWaiting) && session_id != null && client_id && lease_generation != null ? (
        <View className="absolute inset-0 z-50 justify-center bg-black/75 px-5" accessibilityViewIsModal>
          <ExamIdentityCapture
            mode="capture"
            capture_due={captureState === "due"}
            session_id={Number(session_id)}
            session_token={session_token}
            client_id={client_id}
            lease_generation={lease_generation}
            onReconcileCapture={async () => {
              await sendHeartbeat();
              return useExamStore.getState().capture_state ?? "due";
            }}
            onStateChange={(capture) => {
              dialogOpenRef.current = capture.phase === "permission_required";
              if (capture.phase === "error" && capture.error?.code === "IDENTITY_CAPTURE_NOT_DUE") {
                setCaptureRetryWaiting(true);
              } else if (capture.phase === "uploaded" || capture.error?.code === "IDENTITY_CAPTURE_MISSED") {
                setCaptureRetryWaiting(false);
              }
            }}
            onUploaded={() => {
              setCaptureRetryWaiting(false);
              setCaptureState("uploaded");
            }}
          />
        </View>
      ) : null}

      <AssessmentFocusWarningModal
        visible={warningVisible}
        assessmentLabel="exam"
        onReturn={returnToAnswering}
      />

    </SafeAreaView>
  );
}
