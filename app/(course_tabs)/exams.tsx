import createListExamsOptions from "@/api/QueryOptions/listExamsOption";
import { useCourseStore } from "@/store/useCourseStore";
import { useExamStore } from "@/store/useExamStore";

import SubmissionModal from "@/components/SubmissionModal";
import { ExamDetails } from "@/types/api";
import {
  Entypo,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Exams() {
  const router = useRouter();
  const { setExamId, setInstanceId } = useExamStore();
  const { course_id } = useCourseStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedExamForSubmission, setSelectedExamForSubmission] =
    useState<ExamDetails | null>(null);

  const {
    data: examsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery(createListExamsOptions(course_id!));

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

  useFocusEffect(
    useCallback(() => {
      console.log("Exams screen focused - refetching exam list");
      refetch();
    }, [refetch]),
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

  const handlePress = (exam: ExamDetails) => {
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

    // Otherwise, proceed with normal exam taking flow
    setExamId(exam.exam_id);
    if (instanceId !== null) {
      setInstanceId(instanceId);
    }
    router.replace("/exam_taking");
  };

  // Render a single exam card
  const renderExamCard = (exam: ExamDetails) => {
    const isPassing = exam.score !== null && exam.score >= 75;
    const isSubmissionType = exam.category.toLowerCase() === "submission";
    const isGraded = exam.score !== null; // If score exists, it's been graded

    return (
      <View
        key={exam.exam_id}
        className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4 border border-gray-100"
      >
        {/* Header with Status */}
        <View className="bg-gray-50 px-5 py-4 border-b border-gray-100">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 pr-4">
              <View className="flex-row items-center mb-1 flex-wrap">
                <Text className="text-lg font-bold text-gray-900">
                  {exam.exam_name}
                </Text>
                {isSubmissionType && (
                  <View className="ml-2 bg-purple-100 px-2 py-1 rounded-md">
                    <Text className="text-[10px] font-bold text-purple-700">
                      SUBMISSION
                    </Text>
                  </View>
                )}
              </View>
              <Text className="text-sm text-gray-600 leading-5">
                {exam.description}
              </Text>
            </View>

            {/* Status Badge */}
            <View>
              {exam.is_taken ? (
                <View
                  style={{
                    backgroundColor: isPassing ? "#D1FAE5" : "#FEE2E2",
                  }}
                  className="px-4 py-2 rounded-xl"
                >
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name={isPassing ? "check-circle" : "error"}
                      size={18}
                      color={isPassing ? "#065F46" : "#991B1B"}
                    />
                    <Text
                      style={{ color: isPassing ? "#065F46" : "#991B1B" }}
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
                      style={{ color: isPassing ? "#065F46" : "#991B1B" }}
                      className="text-[10px] font-medium mt-0.5 text-center"
                    >
                      {isPassing ? "Passed" : "Failed"}
                    </Text>
                  )}
                </View>
              ) : (
                <View
                  style={{ backgroundColor: "#DBEAFE" }}
                  className="px-4 py-2 rounded-xl"
                >
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name={isSubmissionType ? "cloud-upload" : "assignment"}
                      size={18}
                      color="#1E40AF"
                    />
                    <Text
                      style={{ color: "#1E40AF" }}
                      className="text-xs font-bold ml-1"
                    >
                      AVAILABLE
                    </Text>
                  </View>
                  <Text
                    style={{ color: "#1E40AF" }}
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
              <View className="flex-1 min-w-[45%] bg-red-50 rounded-xl p-3 border border-red-100">
                <View className="flex-row items-center mb-1">
                  <MaterialIcons name="assignment" size={16} color="#EF4444" />
                  <Text className="text-xs text-gray-600 ml-1 font-medium">
                    Questions
                  </Text>
                </View>
                <Text className="text-xl font-bold text-gray-900">
                  {exam.total_items}
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
                <Text className="text-xl font-bold text-gray-900">120 min</Text>
              </View>
            </View>
          )}

          {/* Important Notice for Available Exams */}
          {!exam.is_taken && (
            <View
              style={{ backgroundColor: "#FEF3C7" }}
              className="rounded-xl p-4 mb-4 border border-yellow-200"
            >
              <View className="flex-row items-start">
                <Ionicons
                  name="warning"
                  size={20}
                  color="#92400E"
                  style={{ marginTop: 2 }}
                />
                <View className="flex-1 ml-2">
                  <Text
                    style={{ color: "#92400E" }}
                    className="text-xs font-bold mb-1"
                  >
                    ONE ATTEMPT ONLY
                  </Text>
                  <Text className="text-xs text-gray-700 leading-5">
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
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-xs text-gray-500 mb-1 font-medium">
                    Final Score
                  </Text>
                  <View className="flex-row items-center">
                    <Text
                      style={{ color: isPassing ? "#10B981" : "#EF4444" }}
                      className="text-4xl font-bold"
                    >
                      {exam.score ?? "N/A"}
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

                {exam.completed_at && (
                  <View className="items-end">
                    <View className="bg-white rounded-lg px-3 py-2 border border-gray-200">
                      <Text className="text-[10px] text-gray-500 mb-1 font-medium">
                        {isSubmissionType ? "Submitted On" : "Completed On"}
                      </Text>
                      <Text className="text-xs text-gray-700 font-semibold">
                        {new Date(exam.completed_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </Text>
                      <Text className="text-xs text-gray-600">
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
              <View className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-200">
                <View className="flex-row items-center">
                  <MaterialIcons name="schedule" size={20} color="#2563EB" />
                  <View className="flex-1 ml-3">
                    <Text className="text-sm font-bold text-blue-900 mb-1">
                      Awaiting Grading
                    </Text>
                    <Text className="text-xs text-blue-700">
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
                className="bg-red-500 active:bg-red-600 py-4 rounded-xl items-center"
                onPress={() => handlePress(exam)}
              >
                <View className="flex-row items-center">
                  {isSubmissionType ? (
                    <>
                      <MaterialIcons
                        name="cloud-upload"
                        size={24}
                        color="white"
                      />
                      <Text className="text-white font-bold text-base ml-1">
                        Submit
                      </Text>
                    </>
                  ) : (
                    <>
                      <MaterialIcons
                        name="play-arrow"
                        size={24}
                        color="white"
                      />
                      <Text className="text-white font-bold text-base ml-1">
                        Start Exam
                      </Text>
                    </>
                  )}
                </View>
              </Pressable>
            </View>
          )}

          {/* Completed Message */}
          {exam.is_taken && (
            <View className="bg-gray-100 px-4 py-3 rounded-xl border border-gray-200">
              <View className="flex-row items-center justify-center">
                <Ionicons name="lock-closed" size={16} color="#6B7280" />
                <Text className="text-center text-gray-600 text-sm font-medium ml-2">
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
        <View className="bg-white rounded-2xl p-8 items-center">
          <MaterialIcons name="assignment" size={64} color="#D1D5DB" />
          <Text className="text-lg font-bold text-gray-800 mt-4">
            No Exams Available
          </Text>
          <Text className="text-sm text-gray-500 text-center mt-2">
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
                  <MaterialIcons name="assignment" size={20} color="white" />
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
            className="p-4 rounded-b-2xl border-x border-b border-gray-200"
          >
            {groupedExams[period].map(renderExamCard)}
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
          <Text className="text-gray-600 mt-4 text-base">Loading exams...</Text>
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
            Error Loading Exams
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
              <MaterialIcons name="assignment" size={24} color="white" />
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
          <View className="bg-white rounded-2xl p-5 mb-6 border border-gray-100 shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-red-50 rounded-xl items-center justify-center mr-3">
                <Ionicons name="shield-checkmark" size={20} color="#EF4444" />
              </View>
              <Text className="text-lg font-bold text-gray-900">
                Exam Guidelines
              </Text>
            </View>

            {/* Critical Warning */}
            <View
              style={{ backgroundColor: "#FEF2F2" }}
              className="rounded-xl p-4 mb-4 border-l-4 border-red-500"
            >
              <View className="flex-row items-center mb-2">
                <Ionicons name="warning" size={18} color="#EF4444" />
                <Text className="text-sm font-bold text-red-900 ml-2">
                  IMPORTANT
                </Text>
              </View>
              <Text className="text-sm text-red-800 leading-5">
                Each exam can only be taken ONCE. There are no retakes. Make
                sure you are ready before starting.
              </Text>
            </View>

            <View className="space-y-3">
              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-blue-50 rounded-lg items-center justify-center mr-3 mt-0.5">
                  <Entypo name="eye" size={16} color="#3B82F6" />
                </View>
                <Text className="text-sm text-gray-700 flex-1 leading-5">
                  Do not switch tabs while taking an exam
                </Text>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-orange-50 rounded-lg items-center justify-center mr-3 mt-0.5">
                  <Feather name="clock" size={16} color="#F97316" />
                </View>
                <Text className="text-sm text-gray-700 flex-1 leading-5">
                  You have a limited time to complete each exam
                </Text>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-purple-50 rounded-lg items-center justify-center mr-3 mt-0.5">
                  <MaterialIcons name="checklist" size={16} color="#8B5CF6" />
                </View>
                <Text className="text-sm text-gray-700 flex-1 leading-5">
                  Review all answers carefully before submitting
                </Text>
              </View>

              <View className="flex-row items-start">
                <View className="w-8 h-8 bg-green-50 rounded-lg items-center justify-center mr-3 mt-0.5">
                  <MaterialIcons name="send" size={16} color="#10B981" />
                </View>
                <Text className="text-sm text-gray-700 flex-1 leading-5">
                  Exam will auto-submit when time is up
                </Text>
              </View>
            </View>
          </View>

          {/* Exams List */}
          {renderGroupedExams()}
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
    </SafeAreaView>
  );
}
