import createQuizQuestionsOptions from "@/api/QueryOptions/quizQuestionsOptions";
import { useQuizStore } from "@/store/useQuizStore";
import type { OptionKey, Question } from "@/types/api";
import { Ionicons } from "@expo/vector-icons";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QuizTaking() {
  const [secondsLeft, setSecondsLeft] = React.useState(30 * 60); // 30 minutes in seconds
  const appState = useRef(AppState.currentState);
  const hasSubmittedRef = useRef(false);
  const router = useRouter();
  const {
    quiz_id,
    instance_id,
    selectedAnswers,
    setSelectedAnswers,
    clearAnswers,
  } = useQuizStore();

  const listRef = useRef<any>(null); // Add ref for LegendList

  useFocusEffect(
    useCallback(() => {
      clearAnswers();
      console.log("Quiz Taking Mounted, answers reset.");
    }, [clearAnswers])
  );

  const {
    data: questionsData,
    isLoading,
    isError,
    error,
  } = useQuery(createQuizQuestionsOptions(quiz_id, instance_id));

  useEffect(() => {
    // 30 minutes in milliseconds
    const QuizMinutes = 30 * 60 * 1000;
    const tenMinutesInSeconds = 10 * 60; // 600 seconds
    let hasVibrated = false; // Track if we've already vibrated

    const timer = setTimeout(() => {
      if (hasSubmittedRef.current) return;

      hasSubmittedRef.current = true;

      console.log("30 minutes passed — auto submitting quiz");

      router.replace({
        pathname: "/(course_tabs)/quiz",
        params: {
          showResult: "true",
          SubmissionReason: "Ran out of time (30 minutes)",
        },
      });
    }, QuizMinutes);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        const newValue = prev <= 1 ? 0 : prev - 1;

        // Vibrate when exactly 10 minutes remaining
        if (newValue === tenMinutesInSeconds && !hasVibrated) {
          hasVibrated = true;
          // Vibrate for 500ms
          if ("vibrate" in navigator) {
            navigator.vibrate(500);
          }
          console.log("10 minutes remaining - vibrating");
        }

        if (newValue === 0) {
          clearInterval(interval);
        }

        return newValue;
      });
    }, 1000);

    // Cleanup timer on unmount
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [router]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (appState.current === "active" && nextAppState === "background") {
          if (hasSubmittedRef.current) return;

          hasSubmittedRef.current = true;

          router.replace({
            pathname: "/(course_tabs)/quiz",
            params: {
              showResult: "true",
              SubmissionReason: "Auto-submitted due to app going to background",
            },
          });
        }

        appState.current = nextAppState;
      }
    );

    return () => subscription.remove();
  }, [router]);

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

  const handleSubmitQuiz = () => {
    if (hasSubmittedRef.current) return;

    const questions = questionsData?.questions || [];
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount === questions.length) {
      hasSubmittedRef.current = true;

      router.replace({
        pathname: "/(course_tabs)/quiz",
        params: {
          showResult: "true",
          SubmissionReason: "Manually submitted by user",
        },
      });

      console.log("Submitted Answers:", selectedAnswers);
    } else {
      const firstUnansweredIndex = questions.findIndex(
        (q) => !selectedAnswers[q.item_id]
      );

      Alert.alert(
        "Incomplete Quiz",
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
        ]
      );
    }
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
        ref={listRef} // Add ref here
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
          onPress={handleSubmitQuiz}
        >
          <Text className="font-semibold text-white">Submit</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
