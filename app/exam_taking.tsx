import createExamAnswersOptions from "@/api/QueryOptions/examAnswersOptions";
import createExamQuestionsOptions from "@/api/QueryOptions/examQuestionsOptions";
import ExamSubmissionModal from "@/components/ExamSubmissionModal";
import { useExamStore } from "@/store/useExamStore";
import type { OptionKey, Question } from "@/types/api";
import { Ionicons } from "@expo/vector-icons";
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

const QUIZ_DURATION_SECONDS = 60 * 60;

export default function QuizTaking() {
  const [secondsLeft, setSecondsLeft] = useState(QUIZ_DURATION_SECONDS);
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
      console.log("Quiz Taking Mounted, answers reset.");
    }, [clearAnswers]),
  );

  const {
    data: questionsData,
    isLoading,
    isError,
    error,
  } = useQuery(createExamQuestionsOptions(exam_id, instance_id));

  // Submission mutation
  const submitMutation = useMutation({
    ...createExamAnswersOptions(queryClient),
    onSuccess: (data) => {
      console.log("Exam submitted successfully:", data);
      setShowResultModal(true);
    },
    onError: (error: Error) => {
      Alert.alert(
        "Submission Failed",
        error.message || "Failed to submit exam. Please try again.",
        [
          {
            text: "OK",
            onPress: () => {
              hasSubmittedRef.current = false;
            },
          },
        ],
      );
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

        if (prev === 600) {
          Vibration.vibrate(500);
          console.log("10 minute remaining");
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [performSubmission]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (appState.current === "active" && nextAppState === "background") {
          performSubmission("tab_switch");
        }
        appState.current = nextAppState;
      },
    );

    return () => subscription.remove();
  }, [performSubmission]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#8b5cf6" />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text>Error loading quiz questions: {(error as Error).message}</Text>
      </SafeAreaView>
    );
  }

  const handleSubmitExam = () => {
    if (hasSubmittedRef.current) return;

    const questions = questionsData?.questions || [];
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount === questions.length) {
      performSubmission("manual");
      //   console.log("Submitted Answers:", selectedAnswers);
    } else {
      const firstUnansweredIndex = questions.findIndex(
        (q) => !selectedAnswers[q.item_id],
      );

      Alert.alert(
        "Incomplete Exam",
        "Please answer all questions before submitting.",
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
    router.replace("/(course_tabs)/exams");
  };

  const renderQuestion = ({ item }: LegendListRenderItemProps<Question>) => {
    const optionKeys: OptionKey[] = ["A", "B", "C", "D"];
    const isAnswered = !!selectedAnswers[item.item_id];

    return (
      <View className="p-4 mb-4 bg-white rounded-lg">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold flex-1">
            {item.question_number}. {item.question}
          </Text>
          {!isAnswered && (
            <View className="bg-red-100 px-2 py-1 rounded">
              <Text className="text-xs text-red-600 font-medium">
                Unanswered
              </Text>
            </View>
          )}
        </View>

        {optionKeys.map((key) => {
          const isSelected = selectedAnswers[item.item_id] === key;
          return (
            <Pressable
              key={key}
              className={`p-3 mb-2 border rounded-lg ${
                isSelected ? "bg-blue-200 border-blue-600" : "border-gray-300"
              }`}
              onPress={() => {
                setSelectedAnswers({
                  ...selectedAnswers,
                  [item.item_id]: key,
                });
              }}
            >
              <Text>
                {key}. {item.options[key]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="py-3">
        <Text className="text-center mt-2 text-blue-700 text-lg font-semibold">
          <Ionicons name="alarm" size={21} color="Blue" />
          Time Left:{" "}
          {Math.floor(secondsLeft / 60)
            .toString()
            .padStart(2, "0")}
          :{(secondsLeft % 60).toString().padStart(2, "0")}
        </Text>
      </View>

      <LegendList
        ref={listRef}
        data={questionsData?.questions || []}
        renderItem={renderQuestion}
        keyExtractor={(item) => item.item_id.toString()}
        contentContainerClassName="p-4"
        extraData={{ selectedAnswers }}
        recycleItems
      />

      <View>
        <Text className="text-center text-gray-600 my-2">
          {Object.keys(selectedAnswers).length} of{" "}
          {questionsData?.questions.length} answered
        </Text>
        <Pressable
          className="mx-auto mb-3 px-6 py-3 mt-3 bg-blue-600 rounded-lg active:bg-blue-700"
          onPress={handleSubmitExam}
          disabled={submitMutation.isPending}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-semibold text-white">Submit</Text>
          )}
        </Pressable>
      </View>

      <ExamSubmissionModal
        visible={showResultModal}
        onClose={handleModalClose}
        submissionReason={submissionReason}
        resultData={submitMutation.data}
        isLoading={submitMutation.isPending}
      />
    </SafeAreaView>
  );
}
