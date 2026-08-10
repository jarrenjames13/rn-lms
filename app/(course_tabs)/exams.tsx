import createListExamsOptions from "@/api/QueryOptions/listExamsOption";
import AssessmentStartModal from "@/components/AssessmentStartModal";
import { useCourseStore } from "@/store/useCourseStore";
import { useExamStore } from "@/store/useExamStore";
import { useAppTheme } from "@/theme";

import SubmissionModal from "@/components/SubmissionModal";
import Skeleton from "@/components/skeletons/Skeleton";
import { ExamDetails } from "@/types/api";
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
const ExamCardSkeleton = () => (
  <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl shadow-sm overflow-hidden mb-4 border border-[#E6E1E8] dark:border-[#37313C]">
    {/* Header */}
    <View className="bg-[#F7F7FA] dark:bg-[#111014] px-5 py-4 border-b border-[#E6E1E8] dark:border-[#37313C]">
      <View className="flex-row justify-between items-start">
        <View className="flex-1 pr-4">
          <Skeleton height={20} width="70%" style={{ marginBottom: 8 }} />
          <Skeleton height={14} width="90%" style={{ marginBottom: 6 }} />
          <Skeleton height={14} width="80%" />
        </View>
        <Skeleton height={48} width={80} borderRadius={12} />
      </View>
    </View>

    {/* Content */}
    <View className="p-5">
      {/* Info Grid */}
      <View className="flex-row flex-wrap gap-3 mb-4">
        <Skeleton height={70} width="48%" borderRadius={12} />
        <Skeleton height={70} width="48%" borderRadius={12} />
      </View>

      {/* Notice */}
      <Skeleton
        height={80}
        width="100%"
        style={{ marginBottom: 16 }}
        borderRadius={12}
      />

      {/* Button */}
      <Skeleton height={48} width="100%" borderRadius={12} />
    </View>
  </View>
);

const ExamPeriodSkeleton = () => (
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
            width={120}
            style={{ marginBottom: 4 }}
            baseColor="rgba(255, 255, 255, 0.3)"
            highlightColor="rgba(255, 255, 255, 0.5)"
          />
          <Skeleton
            height={14}
            width={80}
            baseColor="rgba(255, 255, 255, 0.3)"
            highlightColor="rgba(255, 255, 255, 0.5)"
          />
        </View>
      </View>
    </View>

    {/* Content */}
    <View className="bg-[#F7F7FA] dark:bg-[#111014] p-4 rounded-b-2xl border-x border-b border-[#E6E1E8] dark:border-[#37313C]">
      <ExamCardSkeleton />
      <ExamCardSkeleton />
    </View>
  </View>
);

export default function Exams() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const {
    beginAttempt,
    hasHydrated: attemptHydrated,
    status: attemptStatus,
    exam_id: activeExamId,
    instance_id: activeInstanceId,
  } = useExamStore();
  const { instance_id } = useCourseStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExamForSubmission, setSelectedExamForSubmission] =
    useState<ExamDetails | null>(null);
  const [examToStart, setExamToStart] = useState<ExamDetails | null>(null);

  const {
    data: examsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    ...createListExamsOptions(instance_id!),
    enabled: !!instance_id,
  });

  const exams = examsData?.exams || [];
  const instanceId = examsData?.instance_id || null;

  // Group exams by exam_period
  const groupedExams = exams.reduce(
    (acc, exam) => {
      const period = exam.exam_period;
      if (!acc[period]) {
        acc[period] = [];
      }
      acc[period].push(exam);
      return acc;
    },
    {} as Record<string, ExamDetails[]>,
  );

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
  const sortedPeriods = Object.keys(groupedExams).sort((a, b) => {
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

  const handlePress = async (exam: ExamDetails) => {
    // Check if this is a submission-type exam
    if (exam.category.toLowerCase() === "submission") {
      // Ensure we have an instanceId before opening modal
      if (!instanceId) {
        Alert.alert("Error", "Unable to submit exam. Instance ID not found.");
        return;
      }
      setSelectedExamForSubmission(exam);
      return;
    }

    setExamToStart(exam);
  };

  const beginExam = () => {
    if (!examToStart) return;

    const exam = examToStart;
    setExamToStart(null);
    if (instanceId === null) return;
    beginAttempt(exam.exam_id, instanceId);
    router.replace("/exam_taking");
  };

  const requestExamStart = (exam: ExamDetails) => {
    if (!attemptHydrated || instanceId === null) return;
    if (attemptStatus === "idle") {
      setExamToStart(exam);
      return;
    }

    if (activeExamId === exam.exam_id && activeInstanceId === instanceId) {
      router.replace("/exam_taking");
      return;
    }

    Alert.alert(
      "Exam attempt already active",
      "Finish or view the result of your current exam attempt before starting another one.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Resume attempt", onPress: () => router.replace("/exam_taking") },
      ],
    );
  };

  // Render a single exam card
  const renderExamCard = (exam: ExamDetails) => {
    const isPassing = exam.score !== null && exam.score >= 75;
    const isSubmissionType = exam.category.toLowerCase() === "submission";
    const isGraded = exam.score !== null; // If score exists, it's been graded

    return (
      <View
        key={exam.exam_id}
        className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl shadow-sm overflow-hidden mb-4 border border-[#E6E1E8] dark:border-[#37313C]"
      >
        {/* Header with Status */}
        <View className="bg-[#F7F7FA] dark:bg-[#111014] px-5 py-4 border-b border-[#E6E1E8] dark:border-[#37313C]">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-4">
              <View className="flex-row items-center mb-1 flex-wrap">
                <Text className="text-lg font-bold text-[#201D25] dark:text-[#F7F4FA]">
                  {exam.exam_name}
                </Text>
                {isSubmissionType && (
                  <View className="ml-2 bg-[#F2ECF8] dark:bg-[#2A2038] px-2 py-1 rounded-md">
                    <Text className="text-[10px] font-bold text-[#6842A0] dark:text-[#A98ADC]">
                      SUBMISSION
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-sm text-[#6C6572] dark:text-[#BEB6C5] leading-5">
                {exam.description}
              </Text>
            </View>

            {/* Status Badge */}
            <View>
              {exam.is_taken ? (
                <View
                  style={{
                    backgroundColor: isPassing ? theme.surfaceMuted : theme.surfaceAccent,
                  }}
                  className="px-4 py-2 rounded-xl"
                >
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name={isPassing ? "check-circle" : "error"}
                      size={18}
                      color={isPassing ? theme.success : theme.danger}
                    />
                    <Text
                      style={{ color: isPassing ? theme.success : theme.danger }}
                      className="text-xs font-bold ml-1"
                    >
                      {isSubmissionType
                        ? isGraded
                          ? "GRADED"
                          : "SUBMITTED"
                        : "COMPLETED"}
                    </Text>
                  </View>
                  {isGraded && (
                    <Text
                      style={{ color: isPassing ? theme.success : theme.danger }}
                      className="text-[10px] font-medium mt-0.5 text-center"
                    >
                      {isPassing ? "Passed" : "Failed"}
                    </Text>
                  )}
                </View>
              ) : (
                <View
                  style={{ backgroundColor: theme.surfaceMuted }}
                  className="px-4 py-2 rounded-xl"
                >
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name={isSubmissionType ? "cloud-upload" : "assignment"}
                      size={18}
                      color={theme.primary}
                    />
                    <Text
                      style={{ color: theme.primary }}
                      className="text-xs font-bold ml-1"
                    >
                      AVAILABLE
                    </Text>
                  </View>
                  <Text
                    style={{ color: theme.primary }}
                    className="text-[10px] font-medium mt-0.5 text-center"
                  >
                    {isSubmissionType ? "Not submitted" : "Not taken"}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View className="p-5">
          {/* Exam Info Grid - Only show for non-submission exams */}
          {!isSubmissionType && (
            <View className="flex-row flex-wrap gap-3 mb-4">
              {/* Total Items */}
              <View className="flex-1 min-w-[45%] bg-[#FCECEF] dark:bg-[#3A2025] rounded-xl p-3 border border-[#E6E1E8] dark:border-[#37313C]">
                <View className="flex-row items-center mb-1">
                  <MaterialIcons name="assignment" size={16} color={theme.school} />
                  <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] ml-1 font-medium">
                    Questions
                  </Text>
                </View>
                <Text className="text-xl font-bold text-[#201D25] dark:text-[#F7F4FA]">
                  {exam.total_items}
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
                <Text className="text-xl font-bold text-[#201D25] dark:text-[#F7F4FA]">120 min</Text>
              </View>
            </View>
          )}

          {/* Important Notice for Available Exams */}
          {!exam.is_taken && (
            <View
              style={{ backgroundColor: theme.surfaceMuted }}
              className="rounded-xl p-4 mb-4 border border-[#E6E1E8] dark:border-[#37313C]"
            >
              <View className="flex-row items-start">
                <Ionicons
                  name="warning"
                  size={20}
                  color={theme.warning}
                  style={{ marginTop: 2 }}
                />
                <View className="flex-1 ml-2">
                  <Text
                    style={{ color: theme.warning }}
                    className="text-xs font-bold mb-1"
                  >
                    ONE ATTEMPT ONLY
                  </Text>
                  <Text className="text-xs text-[#201D25] dark:text-[#F7F4FA] leading-5">
                    You only have one chance to{" "}
                    {isSubmissionType ? "submit" : "take"} this{" "}
                    {isSubmissionType ? "activity" : "exam"}. Review all
                    materials before starting.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Score Section (if graded) */}
          {isGraded && (
            <View className="bg-[#F7F7FA] dark:bg-[#111014] rounded-xl p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] mb-1 font-medium">
                    Final Score
                  </Text>
                  <View className="flex-row items-center">
                    <Text
                      style={{ color: isPassing ? theme.success : theme.danger }}
                      className="text-4xl font-bold"
                    >
                      {exam.score ?? "N/A"}
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

                {exam.completed_at && (
                  <View className="items-end">
                    <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-lg px-3 py-2 border border-[#E6E1E8] dark:border-[#37313C]">
                      <Text className="text-[10px] text-[#6C6572] dark:text-[#BEB6C5] mb-1 font-medium">
                        {isSubmissionType ? "Submitted On" : "Completed On"}
                      </Text>
                      <Text className="text-xs text-[#201D25] dark:text-[#F7F4FA] font-semibold">
                        {new Date(exam.completed_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </Text>
                      <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5]">
                        {new Date(exam.completed_at).toLocaleTimeString(
                          "en-US",
                          {
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

          {/* Submitted but not graded message (submission types only) */}
          {exam.is_taken &&
            isSubmissionType &&
            !isGraded &&
            exam.completed_at && (
              <View className="bg-[#F2ECF8] dark:bg-[#2A2038] rounded-xl p-4 mb-4 border border-[#E6E1E8] dark:border-[#37313C]">
                <View className="flex-row items-center">
                  <MaterialIcons name="schedule" size={20} color={theme.primary} />
                  <View className="flex-1 ml-3">
                    <Text className="text-sm font-bold text-[#6842A0] dark:text-[#A98ADC] mb-1">
                      Awaiting Grading
                    </Text>
                    <Text className="text-xs text-[#6842A0] dark:text-[#A98ADC]">
                      Submitted on{" "}
                      {new Date(exam.completed_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            )}

          {/* Action Button (if not taken) */}
          {!exam.is_taken && (
            <View>
              <Pressable
                onPress={() => isSubmissionType ? handlePress(exam) : requestExamStart(exam)}
                disabled={!isSubmissionType && !attemptHydrated}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      minHeight: 52,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: !isSubmissionType && !attemptHydrated
                        ? theme.tabInactive
                        : pressed
                          ? theme.primaryPressed
                          : theme.school,
                      opacity: !isSubmissionType && !attemptHydrated ? 0.55 : 1,
                    }}
                  >
                    <View className="flex-row items-center">
                      <MaterialIcons
                        name={isSubmissionType ? "cloud-upload" : "play-arrow"}
                        size={24}
                        color="#FFFFFF"
                      />
                      <Text className="font-bold text-base ml-1" style={{ color: "#FFFFFF" }}>
                        {isSubmissionType ? "Submit" : "Start Exam"}
                      </Text>
                    </View>
                  </View>
                )}
              </Pressable>
            </View>
          )}

          {/* Completed Message */}
          {exam.is_taken && (
            <View className="bg-[#F2ECF8] dark:bg-[#2A2038] px-4 py-3 rounded-xl border border-[#E6E1E8] dark:border-[#37313C]">
              <View className="flex-row items-center justify-center">
                <Ionicons name="lock-closed" size={16} color={theme.textMuted} />
                <Text className="text-center text-[#6C6572] dark:text-[#BEB6C5] text-sm font-medium ml-2">
                  {isSubmissionType
                    ? isGraded
                      ? "Graded - No resubmission allowed"
                      : "Submitted - Awaiting grading"
                    : "Exam completed - No retakes allowed"}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Render grouped exams by period
  const renderGroupedExams = () => {
    if (sortedPeriods.length === 0) {
      return (
        <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl p-8 items-center">
          <MaterialIcons name="assignment" size={64} color={theme.tabInactive} />
          <Text className="text-lg font-bold text-[#201D25] dark:text-[#F7F4FA] mt-4">
            No Exams Available
          </Text>
          <Text className="text-sm text-[#6C6572] dark:text-[#BEB6C5] text-center mt-2">
            Exams will appear here once they are added to this course.
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
                  <MaterialIcons name="assignment" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-white text-xl font-bold">
                    {period} Exams
                  </Text>
                  <Text
                    style={{ color: "rgba(255, 255, 255, 0.9)" }}
                    className="text-sm"
                  >
                    {groupedExams[period].length}{" "}
                    {groupedExams[period].length === 1 ? "exam" : "exams"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Exams in this period */}
          <View
            style={{ backgroundColor: periodBgColor }}
            className="p-4 rounded-b-2xl border-x border-b border-[#E6E1E8] dark:border-[#37313C]"
          >
            {groupedExams[period].map(renderExamCard)}
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
            Error Loading Exams
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
              <MaterialIcons name="assignment" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-2xl font-bold text-white">Exams</Text>
              <Text
                style={{ color: "rgba(255, 255, 255, 0.9)" }}
                className="text-sm"
              >
                Major assessments
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 mt-6">
          {/* Instructions Card */}
          <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl p-5 mb-6 border border-[#E6E1E8] dark:border-[#37313C] shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-[#FCECEF] dark:bg-[#3A2025] rounded-xl items-center justify-center mr-3">
                <Ionicons name="shield-checkmark" size={20} color={theme.school} />
              </View>
              <Text className="text-lg font-bold text-[#201D25] dark:text-[#F7F4FA]">
                Exam Guidelines
              </Text>
            </View>

            {/* Critical Warning */}
            <View
              style={{ backgroundColor: theme.surfaceAccent }}
              className="rounded-xl p-4 mb-4 border-l-4 border-[#B42335] dark:border-[#F06A78]"
            >
              <View className="flex-row items-center mb-2">
                <Ionicons name="warning" size={18} color={theme.danger} />
                <Text className="text-sm font-bold text-[#B42335] dark:text-[#F06A78] ml-2">
                  IMPORTANT
                </Text>
              </View>
              <Text className="text-sm text-[#B42335] dark:text-[#F06A78] leading-5">
                Each exam can only be taken ONCE. There are no retakes. Make
                sure you are ready before starting.
              </Text>
            </View>

            <View className="space-y-3">
              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-lg items-center justify-center mr-3 mt-0.5">
                  <Entypo name="eye" size={16} color={theme.primary} />
                </View>
                <Text className="text-sm text-[#201D25] dark:text-[#F7F4FA] flex-1 leading-5">
                  Do not switch tabs while taking an exam
                </Text>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-lg items-center justify-center mr-3 mt-0.5">
                  <Feather name="clock" size={16} color={theme.warning} />
                </View>
                <Text className="text-sm text-[#201D25] dark:text-[#F7F4FA] flex-1 leading-5">
                  You have a limited time to complete each exam
                </Text>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-lg items-center justify-center mr-3 mt-0.5">
                  <MaterialIcons name="checklist" size={16} color={theme.primary} />
                </View>
                <Text className="text-sm text-[#201D25] dark:text-[#F7F4FA] flex-1 leading-5">
                  Review all answers carefully before submitting
                </Text>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-lg items-center justify-center mr-3 mt-0.5">
                  <MaterialIcons name="send" size={16} color={theme.success} />
                </View>
                <Text className="text-sm text-[#201D25] dark:text-[#F7F4FA] flex-1 leading-5">
                  Exam will auto-submit when time is up
                </Text>
              </View>
            </View>
          </View>

          {/* Exams List */}
          {isLoading ? (
            <>
              <ExamPeriodSkeleton />
              <ExamPeriodSkeleton />
            </>
          ) : (
            renderGroupedExams()
          )}
        </View>

        {/* Bottom Spacing */}
        <View className="h-6" />
      </ScrollView>

      {/* Submission Modal */}
      {selectedExamForSubmission && instanceId && (
        <SubmissionModal
          visible={!!selectedExamForSubmission}
          onClose={() => setSelectedExamForSubmission(null)}
          exam={selectedExamForSubmission}
          instanceId={instanceId}
        />
      )}
      <AssessmentStartModal
        visible={!!examToStart}
        type="exam"
        title={examToStart?.exam_name ?? "Exam"}
        onCancel={() => setExamToStart(null)}
        onBegin={beginExam}
      />
    </SafeAreaView>
  );
}
