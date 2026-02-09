import createListQuizzesOptions from "@/api/QueryOptions/listQuizzesOptions";
import { useCourseStore } from "@/store/useCourseStore";
import { useQuizStore } from "@/store/useQuizStore";
import { QuizDetails } from "@/types/api";
import {
  Entypo,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Quiz() {
  const router = useRouter();
  const { setQuizId, setInstanceId } = useQuizStore();
  const { course_id } = useCourseStore();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: quizzesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    ...createListQuizzesOptions(course_id!),
    refetchOnWindowFocus: false,
  });

  const instanceId = quizzesData?.instance_id || null;

  // Group quizzes by exam_period
  const groupedQuizzes = React.useMemo(() => {
    const quizzes = quizzesData?.quizzes || [];
    return quizzes.reduce(
      (acc, quiz) => {
        const period = quiz.exam_period;

        return {
          ...acc,
          [period]: [...(acc[period] ?? []), quiz],
        };
      },
      {} as Record<string, QuizDetails[]>,
    );
  }, [quizzesData]);

  // useFocusEffect(
  //   useCallback(() => {
  //     console.log("Quiz screen focused - refetching quiz list");
  //     refetch();
  //   }, [refetch]),
  // );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.log("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

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
        return "#3B82F6"; // Blue
      case "Midterm":
        return "#8B5CF6"; // Purple
      case "Pre-Final":
        return "#F97316"; // Orange
      case "Final":
        return "#EF4444"; // Red
      default:
        return "#6B7280"; // Gray
    }
  };

  const getPeriodBgColor = (period: string) => {
    switch (period) {
      case "Prelim":
        return "#EFF6FF"; // Blue light
      case "Midterm":
        return "#FAF5FF"; // Purple light
      case "Pre-Final":
        return "#FFF7ED"; // Orange light
      case "Final":
        return "#FEF2F2"; // Red light
      default:
        return "#F9FAFB"; // Gray light
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
        className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4 border border-gray-100"
      >
        {/* Header with Status */}
        <View className="bg-gray-50 px-5 py-4 border-b border-gray-100">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-4">
              <Text className="text-lg font-bold text-gray-900 mb-1">
                {quiz.quiz_name}
              </Text>
              <Text className="text-sm text-gray-600 leading-5">
                {quiz.description}
              </Text>
            </View>

            {/* Status Badge */}
            <View>
              {maxAttemptsReached ? (
                <View
                  style={{
                    backgroundColor: isPassing ? "#D1FAE5" : "#FEE2E2",
                  }}
                  className="px-3 py-2 rounded-xl"
                >
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name={isPassing ? "check-circle" : "cancel"}
                      size={16}
                      color={isPassing ? "#065F46" : "#991B1B"}
                    />
                    <Text
                      style={{ color: isPassing ? "#065F46" : "#991B1B" }}
                      className="text-xs font-bold ml-1"
                    >
                      DONE
                    </Text>
                  </View>
                  <Text
                    style={{ color: isPassing ? "#065F46" : "#991B1B" }}
                    className="text-[10px] font-medium mt-0.5"
                  >
                    {attemptsMade}/5
                  </Text>
                </View>
              ) : quiz.is_taken ? (
                <View
                  style={{ backgroundColor: "#FEF3C7" }}
                  className="px-3 py-2 rounded-xl"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="reload" size={16} color="#92400E" />
                    <Text
                      style={{ color: "#92400E" }}
                      className="text-xs font-bold ml-1"
                    >
                      IN PROGRESS
                    </Text>
                  </View>
                  <Text
                    style={{ color: "#92400E" }}
                    className="text-[10px] font-medium mt-0.5"
                  >
                    {remainingAttempts} left
                  </Text>
                </View>
              ) : (
                <View
                  style={{ backgroundColor: "#DBEAFE" }}
                  className="px-3 py-2 rounded-xl"
                >
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="play-arrow"
                      size={16}
                      color="#1E40AF"
                    />
                    <Text
                      style={{ color: "#1E40AF" }}
                      className="text-xs font-bold ml-1"
                    >
                      START
                    </Text>
                  </View>
                  <Text
                    style={{ color: "#1E40AF" }}
                    className="text-[10px] font-medium mt-0.5"
                  >
                    5 attempts
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View className="p-5">
          {/* Quiz Info Grid */}
          <View className="flex-row flex-wrap gap-3 mb-4">
            {/* Total Items */}
            <View className="flex-1 min-w-[45%] bg-red-50 rounded-xl p-3 border border-red-100">
              <View className="flex-row items-center mb-1">
                <MaterialIcons name="quiz" size={16} color="#EF4444" />
                <Text className="text-xs text-gray-600 ml-1 font-medium">
                  Questions
                </Text>
              </View>
              <Text className="text-xl font-bold text-gray-900">
                {quiz.total_items}
              </Text>
            </View>

            {/* Duration */}
            <View className="flex-1 min-w-[45%] bg-purple-50 rounded-xl p-3 border border-purple-100">
              <View className="flex-row items-center mb-1">
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color="#8B5CF6"
                />
                <Text className="text-xs text-gray-600 ml-1 font-medium">
                  Duration
                </Text>
              </View>
              <Text className="text-xl font-bold text-gray-900">60 min</Text>
            </View>
          </View>

          {/* Attempts Progress (for started quizzes) */}
          {quiz.is_taken && !maxAttemptsReached && (
            <View
              style={{ backgroundColor: "#EFF6FF" }}
              className="rounded-xl p-4 mb-4 border border-blue-100"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-semibold text-gray-700">
                  Attempts Progress
                </Text>
                <Text
                  style={{ color: "#1E40AF" }}
                  className="text-xs font-bold"
                >
                  {attemptsMade}/5 used
                </Text>
              </View>
              <View className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <View
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(attemptsMade / 5) * 100}%` }}
                />
              </View>
            </View>
          )}

          {/* Score Section (if taken) */}
          {quiz.is_taken && (
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1 font-medium">
                    {maxAttemptsReached ? "Final Score" : "Best Score"}
                  </Text>
                  <View className="flex-row items-center">
                    <Text
                      style={{ color: isPassing ? "#10B981" : "#EF4444" }}
                      className="text-4xl font-bold"
                    >
                      {quiz.score ?? "N/A"}
                    </Text>
                    <Text
                      style={{ color: isPassing ? "#10B981" : "#EF4444" }}
                      className="text-xl font-bold ml-1"
                    >
                      %
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: isPassing ? "#D1FAE5" : "#FEE2E2",
                    }}
                    className="mt-2 px-3 py-1 rounded-full self-start"
                  >
                    <Text
                      style={{ color: isPassing ? "#065F46" : "#991B1B" }}
                      className="text-xs font-semibold"
                    >
                      {isPassing ? "PASSING" : "FAILING"}
                    </Text>
                  </View>
                </View>

                {quiz.completed_at && (
                  <View className="items-end">
                    <View className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                      <Text className="text-[10px] text-gray-500 mb-1 font-medium">
                        Last Attempt
                      </Text>
                      <Text className="text-xs text-gray-700 font-semibold">
                        {new Date(quiz.last_attempted_at + "Z").toLocaleString(
                          "en-PH",
                          {
                            timeZone: "Asia/Manila",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </Text>
                      <Text className="text-xs text-gray-600">
                        {new Date(quiz.last_attempted_at + "Z").toLocaleString(
                          "en-PH",
                          {
                            timeZone: "Asia/Manila",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          {!maxAttemptsReached && (
            <View>
              {quiz.is_taken ? (
                // Retake Button
                <Pressable
                  className="bg-red-500 active:bg-red-600 py-4 rounded-xl items-center"
                  onPress={() => handlePress(quiz)}
                >
                  <View className="flex-row items-center">
                    <MaterialCommunityIcons
                      name="reload"
                      size={20}
                      color="white"
                    />
                    <Text className="text-white font-bold text-base ml-2">
                      Retake Quiz
                    </Text>
                  </View>
                </Pressable>
              ) : (
                // Start Button
                <Pressable
                  className="bg-red-500 active:bg-red-600 py-4 rounded-xl items-center"
                  onPress={() => handlePress(quiz)}
                >
                  <View className="flex-row items-center">
                    <MaterialIcons name="play-arrow" size={24} color="white" />
                    <Text className="text-white font-bold text-base ml-1">
                      Start Quiz
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>
          )}

          {/* Max Attempts Reached Message */}
          {maxAttemptsReached && (
            <View className="bg-gray-100 px-4 py-3 rounded-xl border border-gray-200">
              <View className="flex-row items-center justify-center">
                <Ionicons name="lock-closed" size={16} color="#6B7280" />
                <Text className="text-center text-gray-600 text-sm font-medium ml-2">
                  All attempts completed
                </Text>
              </View>
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
        <View className="bg-white rounded-2xl p-8 items-center">
          <MaterialIcons name="quiz" size={64} color="#D1D5DB" />
          <Text className="text-lg font-bold text-gray-800 mt-4">
            No Quizzes Available
          </Text>
          <Text className="text-sm text-gray-500 text-center mt-2">
            Quizzes will appear here once they are added to this course.
          </Text>
        </View>
      );
    }

    return sortedPeriods.map((period) => {
      const periodColor = getPeriodColor(period);
      const periodBgColor = getPeriodBgColor(period);

      return (
        <View key={period} className="mb-6">
          {/* Exam Period Header */}
          <View
            style={{ backgroundColor: periodColor }}
            className="px-5 py-4 rounded-t-2xl"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.25)" }}
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                >
                  <MaterialIcons name="school" size={20} color="white" />
                </View>
                <View>
                  <Text className="text-white text-xl font-bold">{period}</Text>
                  <Text
                    style={{ color: "rgba(255, 255, 255, 0.9)" }}
                    className="text-sm"
                  >
                    {groupedQuizzes[period].length}{" "}
                    {groupedQuizzes[period].length === 1 ? "quiz" : "quizzes"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quizzes in this period */}
          <View
            style={{ backgroundColor: periodBgColor }}
            className="p-4 rounded-b-2xl border-x border-b border-gray-200"
          >
            {groupedQuizzes[period].map(renderQuizCard)}
          </View>
        </View>
      );
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#EF4444" />
          <Text className="text-gray-600 mt-4 text-base">
            Loading quizzes...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="text-lg font-semibold text-gray-800 mt-4">
            Error Loading Quizzes
          </Text>
          <Text className="text-base text-gray-500 text-center mt-2">
            {error?.message || "Unknown error occurred"}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-6 bg-red-500 active:bg-red-600 px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#EF4444"]}
            tintColor="#EF4444"
            title="Pull to refresh"
            titleColor="#6B7280"
          />
        }
      >
        {/* Header */}
        <View className="bg-red-500 px-6 py-6">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mr-3">
              <MaterialIcons name="quiz" size={24} color="white" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-white">Quizzes</Text>
              <Text
                style={{ color: "rgba(255, 255, 255, 0.9)" }}
                className="text-sm"
              >
                Test your knowledge
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 mt-6">
          {/* Instructions Card */}
          <View className="bg-white rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center mr-3">
                <Ionicons name="information-circle" size={20} color="#EF4444" />
              </View>
              <Text className="text-lg font-bold text-gray-900">
                Quiz Guidelines
              </Text>
            </View>

            <View className="space-y-3">
              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center mr-3 mt-0.5">
                  <Entypo name="eye" size={16} color="#3B82F6" />
                </View>
                <Text className="text-sm text-gray-700 flex-1 leading-5">
                  Do not switch tabs while taking a quiz
                </Text>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-orange-50 rounded-lg items-center justify-center mr-3 mt-0.5">
                  <Feather name="clock" size={16} color="#F97316" />
                </View>
                <Text className="text-sm text-gray-700 flex-1 leading-5">
                  You have a limited time to complete each quiz
                </Text>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-green-50 rounded-lg items-center justify-center mr-3 mt-0.5">
                  <MaterialCommunityIcons
                    name="reload"
                    size={16}
                    color="#10B981"
                  />
                </View>
                <Text className="text-sm text-gray-700 flex-1 leading-5">
                  You have 5 attempts per quiz to improve your score
                </Text>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-red-50 rounded-lg items-center justify-center mr-3 mt-0.5">
                  <MaterialIcons name="send" size={16} color="#EF4444" />
                </View>
                <Text className="text-sm text-gray-700 flex-1 leading-5">
                  Quiz will auto-submit when time is up
                </Text>
              </View>
            </View>
          </View>

          {/* Quizzes List */}
          {renderGroupedQuizzes()}
        </View>

        {/* Bottom Spacing */}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
