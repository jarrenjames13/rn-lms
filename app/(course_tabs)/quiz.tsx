import createListQuizzesOptions from "@/api/QueryOptions/listQuizzesOptions";
import { useCourseStore } from "@/store/useCourseStore";
import { useQuizStore } from "@/store/useQuizStore";
import { QuizDetails } from "@/types/api";
import {
  Entypo,
  Feather,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Quiz() {
  const router = useRouter();
  const { setQuizId, setInstanceId } = useQuizStore();
  const { course_id } = useCourseStore();

  const {
    data: quizzesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(createListQuizzesOptions(course_id!));

  const quizzes = quizzesData?.quizzes || [];
  const instanceId = quizzesData?.instance_id || null;

  // Group quizzes by exam_period
  const groupedQuizzes = quizzes.reduce(
    (acc, quiz) => {
      const period = quiz.exam_period;
      if (!acc[period]) {
        acc[period] = [];
      }
      acc[period].push(quiz);
      return acc;
    },
    {} as Record<string, QuizDetails[]>,
  );

  useFocusEffect(
    useCallback(() => {
      console.log("Quiz screen focused - refetching quiz list");
      refetch();
    }, [refetch]),
  );

  // Define the correct order for exam periods
  const periodOrder: Record<string, number> = {
    Prelim: 1,
    Midterm: 2,
    "Pre-Final": 3,
    Final: 4,
  };

  // Sort exam periods in correct order
  const sortedPeriods = Object.keys(groupedQuizzes).sort((a, b) => {
    const orderA = periodOrder[a] ?? 999;
    const orderB = periodOrder[b] ?? 999;
    return orderA - orderB;
  });

  // Get color for each exam period
  const getPeriodColor = (period: string) => {
    switch (period) {
      case "Prelim":
        return "bg-blue-600";
      case "Midterm":
        return "bg-purple-600";
      case "Pre-Final":
        return "bg-orange-600";
      case "Final":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getPeriodTextColor = (period: string) => {
    switch (period) {
      case "Prelim":
        return "text-blue-100";
      case "Midterm":
        return "text-purple-100";
      case "Pre-Final":
        return "text-orange-100";
      case "Final":
        return "text-red-100";
      default:
        return "text-gray-100";
    }
  };

  const handlePress = (quiz: QuizDetails) => {
    setQuizId(quiz.quiz_id);
    if (instanceId !== null) {
      setInstanceId(instanceId);
    }
    router.replace("/quiz_taking");
  };

  // Render a single quiz card
  const renderQuizCard = (quiz: QuizDetails) => {
    const attemptsMade = quiz.attempts_made || 0;
    const remainingAttempts = 5 - attemptsMade;
    const maxAttemptsReached = attemptsMade >= 5;
    const isPassing = quiz.score !== null && quiz.score >= 75;

    return (
      <View
        key={quiz.quiz_id}
        className="bg-white rounded-xl shadow-md overflow-hidden mb-3 border border-gray-100"
      >
        {/* Status Badge */}
        <View className="absolute top-3 right-3 z-10">
          {maxAttemptsReached ? (
            <View
              className={`${isPassing ? "bg-green-100" : "bg-red-100"} px-3 py-1 rounded-full`}
            >
              <Text
                className={`${isPassing ? "text-green-700" : "text-red-700"} text-xs font-semibold`}
              >
                Completed ({attemptsMade}/5)
              </Text>
            </View>
          ) : quiz.is_taken ? (
            <View className="bg-yellow-100 px-3 py-1 rounded-full">
              <Text className="text-yellow-700 text-xs font-semibold">
                {remainingAttempts} attempt{remainingAttempts !== 1 ? "s" : ""}{" "}
                left
              </Text>
            </View>
          ) : (
            <View className="bg-blue-100 px-3 py-1 rounded-full">
              <Text className="text-blue-700 text-xs font-semibold">
                Not Started
              </Text>
            </View>
          )}
        </View>

        {/* Main Content */}
        <View className="p-4">
          {/* Title */}
          <Text className="text-lg font-bold text-gray-800 mb-2 pr-24">
            {quiz.quiz_name}
          </Text>

          {/* Description */}
          <Text className="text-sm text-gray-600 mb-4 leading-5">
            {quiz.description}
          </Text>

          {/* Quiz Info Row */}
          <View className="flex-row items-center space-x-4 mb-3">
            {/* Total Items */}
            <View className="flex-row items-center pr-1">
              <View className="bg-red-50 p-1.5 rounded-lg mr-1">
                <Entypo name="clipboard" size={16} color="#ef4444" />
              </View>
              <Text className="text-sm text-gray-700 font-medium">
                {quiz.total_items} {quiz.total_items === 1 ? "item" : "items"}
              </Text>
            </View>

            {/* Duration */}
            <View className="flex-row items-center px-1">
              <View className="bg-orange-50 p-1.5 rounded-lg mr-1">
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color="#f97316"
                />
              </View>
              <Text className="text-sm text-gray-700 font-medium">60 mins</Text>
            </View>

            {/* Attempts Badge */}
            {!quiz.is_taken && (
              <View className="flex-row items-center px-1">
                <View className="bg-blue-50 p-1.5 rounded-lg mr-1">
                  <MaterialCommunityIcons
                    name="rotate-3d-variant"
                    size={16}
                    color="#3b82f6"
                  />
                </View>
                <Text className="text-sm text-gray-700 font-medium">
                  5 attempts
                </Text>
              </View>
            )}
          </View>

          {/* Attempts Info Badge (for started but not completed) */}
          {quiz.is_taken && !maxAttemptsReached && (
            <View className="bg-blue-50 px-3 py-2 rounded-lg mb-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-blue-700 font-medium">
                  Attempts: {attemptsMade}/5
                </Text>
                <Text className="text-xs text-blue-600">
                  {remainingAttempts} remaining
                </Text>
              </View>
            </View>
          )}

          {/* Divider */}
          {quiz.is_taken && <View className="border-t border-gray-200 my-3" />}

          {/* Score Section (if taken) */}
          {quiz.is_taken && (
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-gray-500 mb-1">
                  {maxAttemptsReached ? "Final Score" : "Current Score"}
                </Text>
                <Text
                  className={`text-2xl font-bold ${isPassing ? "text-green-600" : "text-red-600"}`}
                >
                  {quiz.score ?? "N/A"}%
                </Text>
              </View>

              {quiz.completed_at && (
                <View className="items-end">
                  <Text className="text-xs text-gray-500 mb-1">
                    Last Attempt
                  </Text>
                  <Text className="text-xs text-gray-700 font-medium">
                    {new Date(quiz.last_attempted_at + "Z").toLocaleString(
                      "en-PH",
                      {
                        timeZone: "Asia/Manila",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          {!maxAttemptsReached && (
            <View className="mt-3">
              {quiz.is_taken ? (
                // Retake Button
                <Pressable
                  className="bg-yellow-500 active:bg-yellow-600 py-3 rounded-lg items-center mx-auto px-6"
                  onPress={() => handlePress(quiz)}
                >
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons
                      name="rotate-3d-variant"
                      size={18}
                      color="white"
                    />
                    <Text className="text-white font-semibold ml-2">
                      Retake Quiz
                    </Text>
                  </View>
                </Pressable>
              ) : (
                // Start Button
                <Pressable
                  className="bg-blue-500 active:bg-blue-700 py-3 rounded-lg items-center mx-auto px-6"
                  onPress={() => handlePress(quiz)}
                >
                  <Text className="text-white font-semibold">Start Quiz</Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Max Attempts Reached Message */}
          {maxAttemptsReached && (
            <View className="mt-3 bg-gray-100 px-3 py-2 rounded-lg">
              <Text className="text-center text-gray-600 text-sm">
                All attempts used
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render grouped quizzes
  const renderGroupedQuizzes = () => {
    if (sortedPeriods.length === 0) {
      return (
        <View className="bg-white p-4 rounded-lg">
          <Text className="text-gray-500 text-center">
            No quizzes available
          </Text>
        </View>
      );
    }

    return sortedPeriods.map((period) => (
      <View key={period} className="mb-6">
        {/* Exam Period Header */}
        <View className={`${getPeriodColor(period)} px-4 py-3 rounded-t-lg`}>
          <Text className="text-white text-lg font-bold">{period}</Text>
          <Text className={`${getPeriodTextColor(period)} text-sm`}>
            {groupedQuizzes[period].length}{" "}
            {groupedQuizzes[period].length === 1 ? "quiz" : "quizzes"}
          </Text>
        </View>

        {/* Quizzes in this period */}
        <View className="bg-gray-50 p-3 rounded-b-lg">
          {groupedQuizzes[period].map(renderQuizCard)}
        </View>
      </View>
    ));
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView className="flex-1 bg-gray-100">
        <View className="p-4">
          <Text className="text-2xl font-bold mb-4">Quizzes</Text>
          <View className="mb-6 bg-gray-50 border border-gray-300 rounded-lg px-4 py-6 ">
            <Text className="text-lg font-semibold">Quiz Instructions</Text>
            <View className="border-b border-gray-300 my-1 w-full" />
            <Text className="text-gray-600 py-1">
              <Entypo name="eye" size={18} color="blue" /> - Do not switch tabs
              while taking a quiz.
            </Text>
            <Text className="text-gray-600 py-1">
              <Feather name="clock" size={18} color="orange" /> - You have a
              limited time to complete each quiz.
            </Text>
            <Text className="text-gray-600 py-1">
              <MaterialCommunityIcons
                name="rotate-3d-variant"
                size={18}
                color="green"
              />{" "}
              - You have 5 attempts per quiz to improve your score.
            </Text>
            <Text className="text-gray-600 py-1">
              <MaterialIcons name="schedule-send" size={18} color="red" /> -
              Auto submit when time is up.
            </Text>
          </View>
          {isLoading && (
            <View className="flex-1 justify-center items-center py-8">
              <ActivityIndicator size="large" color="#0000ff" />
              <Text className="text-gray-500 mt-2">Loading quizzes...</Text>
            </View>
          )}

          {isError && (
            <View className="bg-red-100 p-4 rounded-lg">
              <Text className="text-red-700">
                Error loading quizzes: {error?.message || "Unknown error"}
              </Text>
            </View>
          )}

          {!isLoading && !isError && renderGroupedQuizzes()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
