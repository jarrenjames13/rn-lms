import createQuizQuestionsOptions from "@/api/QueryOptions/quizQuestionsOptions";
import { useQuizStore } from "@/store/useQuizStore";
import type { OptionKey, Question } from "@/types/api"; // adjust import path
import { LegendList, LegendListRenderItemProps } from "@legendapp/list";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function QuizTaking() {
  const [selectedAnswers, setSelectedAnswers] = React.useState<
    Record<number, OptionKey>
  >({});

  const router = useRouter();
  const { quiz_id, instance_id } = useQuizStore();

  const {
    data: questionsData,
    isLoading,
    isError,
    error,
  } = useQuery(createQuizQuestionsOptions(quiz_id, instance_id));

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text>Loading Quiz Questions...</Text>
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
  const handleSubmitQuiz = (answers: Record<number, OptionKey>) => {
    console.log("Submitting Answers:", answers);
    router.push("/(course_tabs)/quiz");
  };
  const renderQuestion = ({ item }: LegendListRenderItemProps<Question>) => {
    const optionKeys: OptionKey[] = ["A", "B", "C", "D"];

    return (
      <View className="p-4 mb-4 bg-white rounded-lg">
        <Text className="text-lg font-semibold mb-3">
          {item.question_number}. {item.question}
        </Text>

        {optionKeys.map((key) => {
          const isSelected = selectedAnswers[item.item_id] === key;
          return (
            <Pressable
              key={key}
              className={`p-3 mb-2 border rounded-lg ${
                isSelected ? "bg-blue-200 border-blue-600" : "border-gray-300"
              }`}
              onPress={() => {
                setSelectedAnswers((prev) => ({
                  ...prev,
                  [item.item_id]: key,
                }));
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
        data={questionsData?.questions || []}
        renderItem={renderQuestion}
        keyExtractor={(item) => item.item_id.toString()}
        contentContainerClassName="p-4"
        extraData={{ selectedAnswers }}
        recycleItems
      />
      <View>
        <Pressable
          className="mx-auto mb-3 px-6 py-3 mt-3 bg-blue-600 rounded-lg active:bg-blue-700"
          onPress={() => {
            handleSubmitQuiz(selectedAnswers);
            console.log("Submitted Answers:", selectedAnswers);
          }}
        >
          <Text className="font-semibold text-white">Submit</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
