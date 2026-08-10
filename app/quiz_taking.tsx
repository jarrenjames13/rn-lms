import {
  QuizSubmitResponse,
  useQuizAnswers,
} from "@/api/QueryOptions/quizAnswersMutation";
import { startAssessmentSession } from "@/api/QueryFunctions/startAssessmentSession";
import createQuizQuestionsOptions from "@/api/QueryOptions/quizQuestionsOptions";
import QuizSubmissionModal from "@/components/QuizSubmissionModal";
import ScreenLoading from "@/components/ScreenLoading";
import { useQuizStore } from "@/store/useQuizStore";
import type { OptionKey, Question } from "@/types/api";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePreventRemove } from "@react-navigation/native";
import { usePreventScreenCapture } from "expo-screen-capture";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  Pressable,
  Text,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SubmissionReason = "manual" | "time_expired" | "tab_switch" | "navigation_attempt";

export default function QuizTaking() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [deadlineAt, setDeadlineAt] = useState<number | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [submissionReason, setSubmissionReason] = useState("");
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionRetry, setSessionRetry] = useState(0);

  const appState = useRef(AppState.currentState);
  const hasSubmittedRef = useRef(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  usePreventScreenCapture();

  const {
    quiz_id,
    instance_id,
    session_token,
    selectedAnswers,
    setSelectedAnswers,
    clearAnswers,
    setSessionToken,
    clearAttempt,
  } = useQuizStore();

  const listRef = useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      clearAnswers();
      hasSubmittedRef.current = false;
      console.log("Quiz Taking Mounted, answers reset.");
    }, [clearAnswers]),
  );

  useEffect(() => {
    if (quiz_id <= 0 || instance_id <= 0 || session_token) return;
    let cancelled = false;
    setIsStartingSession(true);
    setSessionError(null);
    startAssessmentSession({
      assessment_id: quiz_id,
      instance_id,
      category: "quiz",
    })
      .then(({ session_token: nextToken, deadline_at }) => {
        if (!cancelled) {
          setSessionToken(nextToken);
          setDeadlineAt(new Date(deadline_at).getTime());
        }
      })
      .catch((error: any) => {
        if (!cancelled) {
          setSessionError(error?.response?.data?.detail ?? error?.message ?? "Unable to start quiz session.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsStartingSession(false);
      });

    return () => {
      cancelled = true;
    };
  }, [instance_id, quiz_id, sessionRetry, session_token, setSessionToken]);

  const {
    data: questionsData,
    isLoading,
    isError,
    error,
  } = useQuery({
    ...createQuizQuestionsOptions(quiz_id, instance_id, session_token),
    enabled: quiz_id > 0 && instance_id > 0 && !!session_token,
  });

  // Submission mutation

  const submitMutation = useQuizAnswers({
    onSuccess: (data: QuizSubmitResponse) => {
      console.log("quiz submitted Successfully:", data);
      setShowResultModal(true);
    },
    onError: (error: Error) => {
      Alert.alert("Submission failed", `${error.message}\n\nYour answers are still available. Please try again.`);
      hasSubmittedRef.current = false;
    },
  });

  const performSubmission = useCallback(
    (reason: SubmissionReason) => {
      if (hasSubmittedRef.current || !session_token) return;

      hasSubmittedRef.current = true;
      setSubmissionReason(reason);

      submitMutation.mutate({
        quiz_id,
        instance_id,
        answers: selectedAnswers,
        submission_reason: reason,
        session_token,
      });
    },
    [quiz_id, instance_id, selectedAnswers, submitMutation, session_token],
  );

  usePreventRemove(!showResultModal && Boolean(session_token) && !hasSubmittedRef.current, () => {
    performSubmission("navigation_attempt");
  });

  useEffect(() => {
    if (!deadlineAt || hasSubmittedRef.current) return;
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
  }, [deadlineAt, performSubmission]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (appState.current === "active" && nextAppState !== "active") {
          performSubmission("tab_switch");
        }
        appState.current = nextAppState;
      },
    );

    return () => subscription.remove();
  }, [performSubmission]);

  if (!sessionError && (isStartingSession || !session_token || isLoading)) {
    return <ScreenLoading message={isStartingSession || !session_token ? "Preparing your secure quiz session..." : "Loading quiz questions..."} />;
  }

  if (sessionError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-lg font-semibold text-gray-800 mt-4">Unable to start quiz</Text>
        <Text className="text-base text-gray-500 text-center mt-2">{sessionError}</Text>
        <Pressable onPress={() => setSessionRetry((value) => value + 1)} className="mt-6 bg-red-500 px-6 py-3 rounded-xl">
          <Text className="text-white font-semibold">Try again</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-lg font-semibold text-gray-800 mt-4">
          Error Loading Quiz
        </Text>
        <Text className="text-base text-gray-500 text-center mt-2">
          {(error as Error).message}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 bg-red-500 active:bg-red-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const handleSubmitQuiz = () => {
    if (hasSubmittedRef.current) return;

    const questions = questionsData?.questions || [];
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount === questions.length) {
      Alert.alert(
        "Submit Quiz",
        "Are you sure you want to submit your answers? You cannot change them after submission.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Submit",
            style: "destructive",
            onPress: () => {
              performSubmission("manual");
              console.log("Submitted Answers:", selectedAnswers);
            },
          },
        ],
      );
    } else {
      const firstUnansweredIndex = questions.findIndex(
        (q) => !selectedAnswers[q.item_id],
      );

      Alert.alert(
        "Incomplete Quiz",
        `You have answered ${answeredCount} out of ${questions.length} questions. Please answer all questions before submitting.`,
        [
          {
            text: "OK",
            onPress: () => {
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
      );
    }
  };

  const handleModalClose = () => {
    setShowResultModal(false);
    queryClient.removeQueries({ queryKey: ["quiz_questions", quiz_id, instance_id, session_token] });
    clearAttempt();
    router.replace("/(course_tabs)/assessments");
  };

  const renderQuestion = ({ item }: LegendListRenderItemProps<Question>) => {
    const optionKeys: OptionKey[] = ["A", "B", "C", "D"];
    const isAnswered = !!selectedAnswers[item.item_id];

    return (
      <View className="mb-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Question Header */}
        <View
          style={{ backgroundColor: isAnswered ? "#FEF2F2" : "#F9FAFB" }}
          className="px-5 py-4 border-b border-gray-100"
        >
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center mb-2">
                <View
                  style={{
                    backgroundColor: isAnswered ? "#EF4444" : "#9CA3AF",
                  }}
                  className="w-8 h-8 rounded-lg items-center justify-center mr-2"
                >
                  <Text className="text-white font-bold text-sm">
                    {item.question_number}
                  </Text>
                </View>
                {!isAnswered && (
                  <View
                    style={{ backgroundColor: "#FEE2E2" }}
                    className="px-3 py-1 rounded-full"
                  >
                    <Text
                      style={{ color: "#991B1B" }}
                      className="text-xs font-bold"
                    >
                      UNANSWERED
                    </Text>
                  </View>
                )}
                {isAnswered && (
                  <View
                    style={{ backgroundColor: "#D1FAE5" }}
                    className="px-3 py-1 rounded-full"
                  >
                    <Text
                      style={{ color: "#065F46" }}
                      className="text-xs font-bold"
                    >
                      ANSWERED
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-base font-semibold text-gray-900 leading-6">
                {item.question}
              </Text>
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
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 bg-white"
                }`}
                onPress={() => {
                  setSelectedAnswers({
                    ...selectedAnswers,
                    [item.item_id]: key,
                  });
                }}
              >
                <View className="flex-row items-center p-4">
                  {/* Radio Button */}
                  <View
                    className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${
                      isSelected
                        ? "border-red-500 bg-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <View className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </View>

                  {/* Option Letter Badge */}
                  <View
                    style={{
                      backgroundColor: isSelected ? "#EF4444" : "#F3F4F6",
                    }}
                    className="w-8 h-8 rounded-lg items-center justify-center mr-3"
                  >
                    <Text
                      style={{ color: isSelected ? "white" : "#374151" }}
                      className="font-bold text-sm"
                    >
                      {key}
                    </Text>
                  </View>

                  {/* Option Text */}
                  <Text
                    className={`flex-1 text-base leading-6 ${
                      isSelected
                        ? "text-gray-900 font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    {item.options[key]}
                  </Text>

                  {/* Selected Icon */}
                  {isSelected && (
                    <MaterialIcons
                      name="check-circle"
                      size={24}
                      color="#EF4444"
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
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Timer Header */}
      <View
        style={{ backgroundColor: isLowTime ? "#FEE2E2" : "#EF4444" }}
        className="px-6 py-4"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View
              style={{
                backgroundColor: isLowTime
                  ? "#991B1B"
                  : "rgba(255, 255, 255, 0.25)",
              }}
              className="w-12 h-12 rounded-xl items-center justify-center mr-3"
            >
              <Ionicons
                name={isLowTime ? "warning" : "timer"}
                size={24}
                color={isLowTime ? "#FEE2E2" : "white"}
              />
            </View>
            <View>
              <Text
                style={{ color: isLowTime ? "#991B1B" : "white" }}
                className="text-xs font-semibold mb-1"
              >
                {isLowTime ? "TIME RUNNING OUT!" : "TIME REMAINING"}
              </Text>
              <Text
                style={{ color: isLowTime ? "#7F1D1D" : "white" }}
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
      <View className="bg-white px-6 py-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm font-semibold text-gray-700">Progress</Text>
          <Text className="text-sm font-bold text-gray-900">
            {answeredCount}/{totalQuestions}
          </Text>
        </View>
        <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor:
                progressPercentage === 100 ? "#10B981" : "#EF4444",
            }}
          />
        </View>
        <Text className="text-xs text-gray-500 mt-1">
          {answeredCount === totalQuestions
            ? "All questions answered!"
            : `${totalQuestions - answeredCount} question${totalQuestions - answeredCount !== 1 ? "s" : ""} remaining`}
        </Text>
      </View>

      {/* Questions List */}
      <LegendList
        ref={listRef}
        data={questionsData?.questions || []}
        renderItem={renderQuestion}
        keyExtractor={(item) => item.item_id.toString()}
        contentContainerClassName="p-6"
        extraData={{ selectedAnswers }}
        recycleItems
      />

      {/* Submit Button Footer */}
      <View className="bg-white border-t border-gray-200 px-6 py-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <MaterialIcons
              name={
                answeredCount === totalQuestions
                  ? "check-circle"
                  : "radio-button-unchecked"
              }
              size={20}
              color={answeredCount === totalQuestions ? "#10B981" : "#9CA3AF"}
            />
            <Text className="text-sm text-gray-600 ml-2">
              {answeredCount} of {totalQuestions} answered
            </Text>
          </View>
          {answeredCount < totalQuestions && (
            <View
              style={{ backgroundColor: "#FEF3C7" }}
              className="px-2 py-1 rounded-full"
            >
              <Text style={{ color: "#92400E" }} className="text-xs font-bold">
                INCOMPLETE
              </Text>
            </View>
          )}
        </View>

        <Pressable
          className={`py-4 rounded-xl items-center ${
            answeredCount === totalQuestions
              ? "bg-red-500 active:bg-red-600"
              : "bg-gray-300"
          }`}
          onPress={handleSubmitQuiz}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <View className="flex-row items-center">
              <MaterialIcons name="send" size={20} color="white" />
              <Text className="font-bold text-white text-base ml-2">
                Submit Quiz
              </Text>
            </View>
          )}
        </Pressable>

        {answeredCount < totalQuestions && (
          <Text className="text-xs text-center text-gray-500 mt-2">
            Please answer all questions before submitting
          </Text>
        )}
      </View>

      <QuizSubmissionModal
        visible={showResultModal}
        onClose={handleModalClose}
        submissionReason={submissionReason}
        resultData={submitMutation.data}
        isLoading={submitMutation.isPending}
      />
    </SafeAreaView>
  );
}
