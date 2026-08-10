import createListQuizzesOptions from "@/api/QueryOptions/listQuizzesOptions";
import AssessmentStartModal from "@/components/AssessmentStartModal";
import Skeleton from "@/components/skeletons/Skeleton";
import { useCourseStore } from "@/store/useCourseStore";
import { useQuizStore } from "@/store/useQuizStore";
import { useAppTheme } from "@/theme";
import { QuizDetails } from "@/types/api";
import { MAX_QUIZ_ATTEMPTS } from "@/utils/constants";
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
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Skeleton Components
const QuizCardSkeleton = () => (
  <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl shadow-sm overflow-hidden mb-4 border border-[#E6E1E8] dark:border-[#37313C]">
    {/* Header */}
    <View className="bg-[#F7F7FA] dark:bg-[#111014] px-5 py-4 border-b border-[#E6E1E8] dark:border-[#37313C]">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-4">
          <Skeleton height={20} width="70%" style={{ marginBottom: 8 }} />
          <Skeleton height={14} width="90%" style={{ marginBottom: 6 }} />
          <Skeleton height={14} width="80%" />
        </View>
        <Skeleton height={48} width={70} borderRadius={12} />
      </View>
    </View>

    {/* Content */}
    <View className="p-5">
      {/* Info Grid */}
      <View className="flex-row flex-wrap gap-3 mb-4">
        <Skeleton height={70} width="48%" borderRadius={12} />
        <Skeleton height={70} width="48%" borderRadius={12} />
      </View>

      {/* Button */}
      <Skeleton height={48} width="100%" borderRadius={12} />
    </View>
  </View>
);

const QuizPeriodSkeleton = () => (
  <View className="mb-6">
    {/* Header */}
    <View className="bg-[#E6E1E8] dark:bg-[#37313C] px-5 py-4 rounded-t-2xl">
      <View className="flex-row items-center">
        <Skeleton
          height={40}
          width={40}
          borderRadius={12}
          style={{ marginRight: 12 }}
          baseColor="rgba(255, 255, 255, 0.3)"
          highlightColor="rgba(255, 255, 255, 0.5)"
        />
        <View>
          <Skeleton
            height={24}
            width={100}
            style={{ marginBottom: 4 }}
            baseColor="rgba(255, 255, 255, 0.3)"
            highlightColor="rgba(255, 255, 255, 0.5)"
          />
          <Skeleton
            height={14}
            width={70}
            baseColor="rgba(255, 255, 255, 0.3)"
            highlightColor="rgba(255, 255, 255, 0.5)"
          />
        </View>
      </View>
    </View>

    {/* Content */}
    <View className="bg-[#F7F7FA] dark:bg-[#111014] p-4 rounded-b-2xl border-x border-b border-[#E6E1E8] dark:border-[#37313C]">
      <QuizCardSkeleton />
      <QuizCardSkeleton />
    </View>
  </View>
);

export default function Quiz() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const {
    beginAttempt,
    hasHydrated: attemptHydrated,
    status: attemptStatus,
    quiz_id: activeQuizId,
    instance_id: activeInstanceId,
  } = useQuizStore();
  const { instance_id } = useCourseStore();
  const [refreshing, setRefreshing] = useState(false);
  const [quizToStart, setQuizToStart] = useState<QuizDetails | null>(null);

  const {
    data: quizzesData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    ...createListQuizzesOptions(instance_id!),
    enabled: !!instance_id,
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
        return theme.primary;
      case "Midterm":
        return theme.primary;
      case "Pre-Final":
        return theme.warning;
      case "Final":
        return theme.school;
      default:
        return theme.textMuted;
    }
  };

  const getPeriodBgColor = (period: string) => {
    switch (period) {
      case "Prelim":
        return theme.surfaceMuted;
      case "Midterm":
        return theme.surfaceMuted;
      case "Pre-Final":
        return theme.surfaceMuted;
      case "Final":
        return theme.surfaceAccent;
      default:
        return theme.canvas;
    }
  };

  const beginQuiz = () => {
    if (!quizToStart) return;

    const quiz = quizToStart;
    setQuizToStart(null);
    if (instanceId === null) return;
    beginAttempt(quiz.quiz_id, instanceId);
    router.replace("/quiz_taking");
  };

  const requestQuizStart = (quiz: QuizDetails) => {
    if (!attemptHydrated || instanceId === null) return;
    if (attemptStatus === "idle") {
      setQuizToStart(quiz);
      return;
    }

    if (activeQuizId === quiz.quiz_id && activeInstanceId === instanceId) {
      router.replace("/quiz_taking");
      return;
    }

    Alert.alert(
      "Quiz attempt already active",
      "Finish or view the result of your current quiz attempt before starting another one.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Resume attempt", onPress: () => router.replace("/quiz_taking") },
      ],
    );
  };

  // Render a single quiz card
  const renderQuizCard = (quiz: QuizDetails) => {
    const attemptsMade = quiz.attempts_made || 0;
    const remainingAttempts = Math.max(0, MAX_QUIZ_ATTEMPTS - attemptsMade);
    const maxAttemptsReached = attemptsMade >= MAX_QUIZ_ATTEMPTS;
    const isPassing = quiz.score !== null && quiz.score >= 75;

    return (
      <View
        key={quiz.quiz_id}
        className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl shadow-sm overflow-hidden mb-4 border border-[#E6E1E8] dark:border-[#37313C]"
      >
        {/* Header with Status */}
        <View className="bg-[#F7F7FA] dark:bg-[#111014] px-5 py-4 border-b border-[#E6E1E8] dark:border-[#37313C]">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-4">
              <Text className="text-lg font-bold text-[#201D25] dark:text-[#F7F4FA] mb-1">
                {quiz.quiz_name}
              </Text>
              <Text className="text-sm text-[#6C6572] dark:text-[#BEB6C5] leading-5">
                {quiz.description}
              </Text>
            </View>

            {/* Status Badge */}
            <View>
              {maxAttemptsReached ? (
                <View
                  style={{
                    backgroundColor: isPassing ? theme.surfaceMuted : theme.surfaceAccent,
                  }}
                  className="px-3 py-2 rounded-xl"
                >
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name={isPassing ? "check-circle" : "cancel"}
                      size={16}
                      color={isPassing ? theme.success : theme.danger}
                    />
                    <Text
                      style={{ color: isPassing ? theme.success : theme.danger }}
                      className="text-xs font-bold ml-1"
                    >
                      DONE
                    </Text>
                  </View>
                  <Text
                    style={{ color: isPassing ? theme.success : theme.danger }}
                    className="text-[10px] font-medium mt-0.5"
                  >
                    {attemptsMade}/{MAX_QUIZ_ATTEMPTS}
                  </Text>
                </View>
              ) : attemptsMade > 0 ? (
                <View
                  style={{ backgroundColor: theme.surfaceMuted }}
                  className="px-3 py-2 rounded-xl"
                >
                  <View className="flex-row items-center">
                    <Ionicons name="reload" size={16} color={theme.warning} />
                    <Text
                      style={{ color: theme.warning }}
                      className="text-xs font-bold ml-1"
                    >
                      IN PROGRESS
                    </Text>
                  </View>
                  <Text
                    style={{ color: theme.warning }}
                    className="text-[10px] font-medium mt-0.5"
                  >
                    {remainingAttempts} left
                  </Text>
                </View>
              ) : (
                <View
                  style={{ backgroundColor: theme.surfaceMuted }}
                  className="px-3 py-2 rounded-xl"
                >
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="play-arrow"
                      size={16}
                      color={theme.primary}
                    />
                    <Text
                      style={{ color: theme.primary }}
                      className="text-xs font-bold ml-1"
                    >
                      START
                    </Text>
                  </View>
                  <Text
                    style={{ color: theme.primary }}
                    className="text-[10px] font-medium mt-0.5"
                  >
                    {MAX_QUIZ_ATTEMPTS} attempts
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
            <View className="flex-1 min-w-[45%] bg-[#FCECEF] dark:bg-[#3A2025] rounded-xl p-3 border border-[#E6E1E8] dark:border-[#37313C]">
              <View className="flex-row items-center mb-1">
                <MaterialIcons name="quiz" size={16} color={theme.school} />
                <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] ml-1 font-medium">
                  Questions
                </Text>
              </View>
              <Text className="text-xl font-bold text-[#201D25] dark:text-[#F7F4FA]">
                {quiz.total_items}
              </Text>
            </View>

            {/* Duration */}
            <View className="flex-1 min-w-[45%] bg-[#F2ECF8] dark:bg-[#2A2038] rounded-xl p-3 border border-[#E6E1E8] dark:border-[#37313C]">
              <View className="flex-row items-center mb-1">
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color={theme.primary}
                />
                <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] ml-1 font-medium">
                  Duration
                </Text>
              </View>
              <Text className="text-xl font-bold text-[#201D25] dark:text-[#F7F4FA]">60 min</Text>
            </View>
          </View>

          {/* Attempts Progress (for started quizzes) */}
          {attemptsMade > 0 && !maxAttemptsReached && (
            <View
              style={{ backgroundColor: theme.surfaceMuted }}
              className="rounded-xl p-4 mb-4 border border-[#E6E1E8] dark:border-[#37313C]"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-semibold text-[#201D25] dark:text-[#F7F4FA]">
                  Attempts Progress
                </Text>
                <Text
                  style={{ color: theme.primary }}
                  className="text-xs font-bold"
                >
                  {attemptsMade}/{MAX_QUIZ_ATTEMPTS} used
                </Text>
              </View>
              <View className="h-2 bg-[#E6E1E8] dark:bg-[#37313C] rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (attemptsMade / MAX_QUIZ_ATTEMPTS) * 100)}%`,
                    backgroundColor: theme.primary,
                  }}
                />
              </View>
            </View>
          )}

          {/* Score Section (if taken) */}
          {attemptsMade > 0 && (
            <View className="bg-[#F7F7FA] dark:bg-[#111014] rounded-xl p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] mb-1 font-medium">
                    {maxAttemptsReached ? "Final Score" : "Latest Score"}
                  </Text>
                  <View className="flex-row items-center">
                    <Text
                      style={{ color: isPassing ? theme.success : theme.danger }}
                      className="text-4xl font-bold"
                    >
                      {quiz.score ?? "N/A"}
                    </Text>
                    <Text
                      style={{ color: isPassing ? theme.success : theme.danger }}
                      className="text-xl font-bold ml-1"
                    >
                      %
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: isPassing ? theme.surfaceMuted : theme.surfaceAccent,
                    }}
                    className="mt-2 px-3 py-1 rounded-full self-start"
                  >
                    <Text
                      style={{ color: isPassing ? theme.success : theme.danger }}
                      className="text-xs font-semibold"
                    >
                      {isPassing ? "PASSING" : "FAILING"}
                    </Text>
                  </View>
                </View>

                {quiz.completed_at && (
                  <View className="items-end">
                    <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-lg px-3 py-2 border border-[#E6E1E8] dark:border-[#37313C]">
                      <Text className="text-[10px] text-[#6C6572] dark:text-[#BEB6C5] mb-1 font-medium">
                        Last Attempt
                      </Text>
                      <Text className="text-xs text-[#201D25] dark:text-[#F7F4FA] font-semibold">
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
                      <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5]">
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
              {attemptsMade > 0 ? (
                // Retake Button
                <Pressable
                  onPress={() => requestQuizStart(quiz)}
                  disabled={!attemptHydrated}
                >
                  {({ pressed }) => (
                    <View
                      style={{
                        minHeight: 52,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: !attemptHydrated
                          ? theme.tabInactive
                          : pressed
                            ? theme.primaryPressed
                            : theme.school,
                        opacity: attemptHydrated ? 1 : 0.55,
                      }}
                    >
                      <View className="flex-row items-center">
                        <MaterialCommunityIcons name="reload" size={20} color="#FFFFFF" />
                        <Text style={{ color: "#FFFFFF" }} className="font-bold text-base ml-2">
                          Retake Quiz
                        </Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              ) : (
                // Start Button
                <Pressable
                  onPress={() => requestQuizStart(quiz)}
                  disabled={!attemptHydrated}
                >
                  {({ pressed }) => (
                    <View
                      style={{
                        minHeight: 52,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: !attemptHydrated
                          ? theme.tabInactive
                          : pressed
                            ? theme.primaryPressed
                            : theme.school,
                        opacity: attemptHydrated ? 1 : 0.55,
                      }}
                    >
                      <View className="flex-row items-center">
                        <MaterialIcons name="play-arrow" size={24} color="#FFFFFF" />
                        <Text style={{ color: "#FFFFFF" }} className="font-bold text-base ml-1">
                          Start Quiz
                        </Text>
                      </View>
                    </View>
                  )}
                </Pressable>
              )}
            </View>
          )}

          {/* Max Attempts Reached Message */}
          {maxAttemptsReached && (
            <View className="bg-[#F2ECF8] dark:bg-[#2A2038] px-4 py-3 rounded-xl border border-[#E6E1E8] dark:border-[#37313C]">
              <View className="flex-row items-center justify-center">
                <Ionicons name="lock-closed" size={16} color={theme.textMuted} />
                <Text className="text-center text-[#6C6572] dark:text-[#BEB6C5] text-sm font-medium ml-2">
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
        <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl p-8 items-center">
          <MaterialIcons name="quiz" size={64} color={theme.tabInactive} />
          <Text className="text-lg font-bold text-[#201D25] dark:text-[#F7F4FA] mt-4">
            No Quizzes Available
          </Text>
          <Text className="text-sm text-[#6C6572] dark:text-[#BEB6C5] text-center mt-2">
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
                  <MaterialIcons name="school" size={20} color="#FFFFFF" />
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
            className="p-4 rounded-b-2xl border-x border-b border-[#E6E1E8] dark:border-[#37313C]"
          >
            {groupedQuizzes[period].map(renderQuizCard)}
          </View>
        </View>
      );
    });
  };

  if (isError) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7F7FA] dark:bg-[#111014]">
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color={theme.danger} />
          <Text className="text-lg font-semibold text-[#201D25] dark:text-[#F7F4FA] mt-4">
            Error Loading Quizzes
          </Text>
          <Text className="text-base text-[#6C6572] dark:text-[#BEB6C5] text-center mt-2">
            {error?.message || "Unknown error occurred"}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-6 bg-[#B42335] dark:bg-[#F06A78] active:bg-[#B42335] dark:active:bg-[#F06A78] px-6 py-3 rounded-xl"
          >
            <Text className="text-white font-semibold">Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7F7FA] dark:bg-[#111014]">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.school]}
            tintColor={theme.school}
            title="Pull to refresh"
            titleColor={theme.textMuted}
          />
        }
      >
        {/* Header */}
        <View className="bg-[#B42335] dark:bg-[#F06A78] px-6 py-6">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-white/20 rounded-xl items-center justify-center mr-3">
              <MaterialIcons name="quiz" size={24} color="#FFFFFF" />
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
          <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl p-5 mb-6 border border-[#E6E1E8] dark:border-[#37313C] shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-[#FCECEF] dark:bg-[#3A2025] rounded-xl items-center justify-center mr-3">
                <Ionicons name="information-circle" size={20} color={theme.school} />
              </View>
              <Text className="text-lg font-bold text-[#201D25] dark:text-[#F7F4FA]">
                Quiz Guidelines
              </Text>
            </View>

            <View className="space-y-3">
              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-lg items-center justify-center mr-3 mt-0.5">
                  <Entypo name="eye" size={16} color={theme.primary} />
                </View>
                <Text className="text-sm text-[#201D25] dark:text-[#F7F4FA] flex-1 leading-5">
                  Do not switch tabs while taking a quiz
                </Text>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-lg items-center justify-center mr-3 mt-0.5">
                  <Feather name="clock" size={16} color={theme.warning} />
                </View>
                <Text className="text-sm text-[#201D25] dark:text-[#F7F4FA] flex-1 leading-5">
                  You have a limited time to complete each quiz
                </Text>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-lg items-center justify-center mr-3 mt-0.5">
                  <MaterialCommunityIcons
                    name="reload"
                    size={16}
                    color={theme.success}
                  />
                </View>
                <Text className="text-sm text-[#201D25] dark:text-[#F7F4FA] flex-1 leading-5">
                  You have {MAX_QUIZ_ATTEMPTS} attempts per quiz to improve your score
                </Text>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-[#FCECEF] dark:bg-[#3A2025] rounded-lg items-center justify-center mr-3 mt-0.5">
                  <MaterialIcons name="send" size={16} color={theme.school} />
                </View>
                <Text className="text-sm text-[#201D25] dark:text-[#F7F4FA] flex-1 leading-5">
                  Quiz will auto-submit when time is up
                </Text>
              </View>
            </View>
          </View>

          {/* Quizzes List */}
          {isLoading ? (
            <>
              <QuizPeriodSkeleton />
              <QuizPeriodSkeleton />
            </>
          ) : (
            renderGroupedQuizzes()
          )}
        </View>

        {/* Bottom Spacing */}
        <View className="h-6" />
      </ScrollView>
      <AssessmentStartModal
        visible={!!quizToStart}
        type="quiz"
        title={quizToStart?.quiz_name ?? "Quiz"}
        isReattempt={(quizToStart?.attempts_made ?? 0) > 0}
        onCancel={() => setQuizToStart(null)}
        onBegin={beginQuiz}
      />
    </SafeAreaView>
  );
}
