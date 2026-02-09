import createExamAnswersOptions from "@/api/QueryOptions/examAnswersOptions";
import createExamQuestionsOptions from "@/api/QueryOptions/examQuestionsOptions";
import ExamSubmissionModal from "@/components/ExamSubmissionModal";
import { useExamStore } from "@/store/useExamStore";
import type { ExamQuestion, OptionKey } from "@/types/api";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

const EXAM_DURATION_SECONDS = 120 * 60;

export default function ExamTaking() {
  const [secondsLeft, setSecondsLeft] = useState(EXAM_DURATION_SECONDS);
  const [showResultModal, setShowResultModal] = useState(false);
  const [submissionReason, setSubmissionReason] = useState("");

  const appState = useRef(AppState.currentState);
  const hasSubmittedRef = useRef(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    exam_id,
    instance_id,
    selectedAnswers,
    setSelectedAnswers,
    clearAnswers,
  } = useExamStore();

  const listRef = useRef<any>(null);

  useFocusEffect(
    useCallback(() => {
      clearAnswers();
      hasSubmittedRef.current = false;
    }, [clearAnswers]),
  );

  const {
    data: questionsData,
    isLoading,
    isError,
    error,
  } = useQuery(createExamQuestionsOptions(exam_id, instance_id));

  const submitMutation = useMutation({
    ...createExamAnswersOptions(queryClient),
    onSuccess: () => setShowResultModal(true),
    onError: (error: Error) => {
      Alert.alert("Submission Failed", error.message);
      hasSubmittedRef.current = false;
    },
  });

  const performSubmission = useCallback(
    (reason: string) => {
      if (hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;
      setSubmissionReason(reason);

      submitMutation.mutate({
        exam_id,
        instance_id,
        answers: selectedAnswers,
        submission_reason: reason,
      });
    },
    [exam_id, instance_id, selectedAnswers, submitMutation],
  );

  useEffect(() => {
    if (hasSubmittedRef.current) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          performSubmission("time_expired");
          return 0;
        }

        if (prev === 600) Vibration.vibrate(500);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [performSubmission]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (appState.current === "active" && next === "background") {
        performSubmission("tab_switch");
      }
      appState.current = next;
    });

    return () => sub.remove();
  }, [performSubmission]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#EF4444" />
        <Text className="mt-4 text-gray-600">Loading exam questions…</Text>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text>{(error as Error).message}</Text>
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

  const renderQuestion = ({
    item,
  }: LegendListRenderItemProps<ExamQuestion>) => {
    const optionKeys: OptionKey[] = ["A", "B", "C", "D"];
    const isAnswered = !!selectedAnswers[item.item_id];

    return (
      <View className="mb-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <View
          style={{ backgroundColor: isAnswered ? "#FEF2F2" : "#F9FAFB" }}
          className="px-5 py-4 border-b border-gray-100"
        >
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

            <View
              className={`px-3 py-1 rounded-full ${
                isAnswered ? "bg-green-100" : "bg-red-100"
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  isAnswered ? "text-green-700" : "text-red-700"
                }`}
              >
                {isAnswered ? "ANSWERED" : "UNANSWERED"}
              </Text>
            </View>
          </View>

          <Text className="text-base font-semibold text-gray-900">
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
                  isSelected ? "border-red-500 bg-red-50" : "border-gray-200"
                }`}
              >
                <View
                  className={`w-6 h-6 rounded-full border-2 mr-3 ${
                    isSelected ? "border-red-500 bg-red-500" : "border-gray-300"
                  }`}
                />
                <Text className="flex-1 text-base">
                  {key}. {item.options[key]}
                </Text>
                {isSelected && (
                  <MaterialIcons
                    name="check-circle"
                    size={22}
                    color="#EF4444"
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
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Timer */}
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

      {/* Progress */}
      <View className="bg-white px-6 py-4 border-b">
        <Text className="text-sm font-semibold">
          {answeredCount}/{totalQuestions} answered
        </Text>
        <View className="h-3 bg-gray-200 rounded-full mt-2">
          <View
            className="h-full rounded-full bg-red-500"
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
      <View className="bg-white border-t px-6 py-4">
        <Pressable
          className={`py-4 rounded-xl items-center ${
            answeredCount === totalQuestions ? "bg-red-500" : "bg-gray-300"
          }`}
          onPress={() => performSubmission("manual")}
        >
          <Text className="text-white font-bold text-base">Submit Exam</Text>
        </Pressable>
      </View>

      <ExamSubmissionModal
        visible={showResultModal}
        onClose={() => router.replace("/(course_tabs)/exams")}
        submissionReason={submissionReason}
        resultData={submitMutation.data}
        isLoading={submitMutation.isPending}
      />
    </SafeAreaView>
  );
}
