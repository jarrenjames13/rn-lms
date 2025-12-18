import createQuizQuestionsOptions from "@/api/QueryOptions/quizQuestionsOptions";
import { useQuizStore } from "@/store/useQuizStore";
import type { OptionKey, Question } from "@/types/api";
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useRef } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QuizTaking() {
  const router = useRouter();
  const { quiz_id, instance_id, selectedAnswers, setSelectedAnswers } =
    useQuizStore();

  const listRef = useRef<any>(null); // Add ref for LegendList

  useFocusEffect(
    useCallback(() => {
      setSelectedAnswers({});
      console.log("Quiz Taking Mounted, answers reset.");
    }, [setSelectedAnswers])
  );

  const {
    data: questionsData,
    isLoading,
    isError,
    error,
  } = useQuery(createQuizQuestionsOptions(quiz_id, instance_id));

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
    const questions = questionsData?.questions || [];
    const answeredCount = Object.keys(selectedAnswers).length;

    if (answeredCount === questions.length) {
      router.replace("/(course_tabs)/quiz");
      console.log("Submitted Answers:", selectedAnswers);
    } else {
      // Find the first unanswered question
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
              // Scroll to the first unanswered question
              if (firstUnansweredIndex !== -1 && listRef.current) {
                listRef.current.scrollToIndex({
                  index: firstUnansweredIndex,
                  animated: true,
                  viewPosition: 0.2, // Position it near the top
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
