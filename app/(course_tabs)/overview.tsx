import createCommentsOptions from "@/api/QueryOptions/commentsOptions";
import createCourseProgressOptions from "@/api/QueryOptions/courseProgressOptions";
import createCourseStatsOptions from "@/api/QueryOptions/courseStatsOptions";
import CommentsModal from "@/components/commentsModal";
import Skeleton from "@/components/skeletons/Skeleton";
import { useCourseStore } from "@/store/useCourseStore";
import {
  CourseAllDetails,
  CourseDetails,
  CourseProgress,
  CourseQuickStats,
} from "@/types/api";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import createCourseDetailsOptions from "../../api/QueryOptions/courseDetailsOptions";

export default function Overview() {
  const [refreshing, setRefreshing] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const { course_id, instance_id } = useCourseStore();
  // const { setModuleData } = useModuleStore();

  const { data: commentsData, refetch: refetchComments } = useQuery({
    ...createCommentsOptions(instance_id!, undefined, 1, 5),
    enabled: !!instance_id,
  });

  const {
    data: courseDetails,
    isLoading: loadingDetails,
    error: detailsError,
    refetch,
  } = useQuery({
    ...createCourseDetailsOptions(course_id!),
    enabled: !!course_id,
  });

  // useFocusEffect(
  //   useCallback(() => {
  //     if (course_id) {
  //       refetch();
  //       setModuleData(courseDetails?.modules || []);
  //     }
  //   }, [course_id, refetch, courseDetails?.modules, setModuleData]),
  // );

  useFocusEffect(
    useCallback(() => {
      if (course_id) {
        refetch();
      }
    }, [course_id, refetch]),
  );

  const {
    data: courseStats,
    isLoading: loadingStats,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    ...createCourseStatsOptions(course_id!),
    enabled: !!course_id,
  });

  useFocusEffect(
    useCallback(() => {
      if (course_id) {
        refetchStats();
      }
    }, [course_id, refetchStats]),
  );

  const {
    data: courseProgress,
    isLoading: loadingProgress,
    error: progressError,
    refetch: refetchProgress,
  } = useQuery({
    ...createCourseProgressOptions(course_id!),
    enabled: !!course_id,
  });

  useFocusEffect(
    useCallback(() => {
      if (course_id) {
        refetchProgress();
      }
    }, [course_id, refetchProgress]),
  );

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        refetchStats(),
        refetchProgress(),
        refetchComments(),
      ]);
    } catch (error) {
      console.log("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch, refetchStats, refetchProgress, refetchComments]);

  if (detailsError || statsError || progressError) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-lg font-semibold text-gray-800 mt-4">
          Error Loading Course
        </Text>
        <Text className="text-base text-gray-500 text-center mt-2">
          Unable to fetch course details. Please try again.
        </Text>
        <Pressable
          onPress={() => {
            refetch();
            refetchStats();
            refetchProgress();
          }}
          className="mt-6 bg-red-500 active:bg-red-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </Pressable>
      </View>
    );
  }

  const details: CourseAllDetails = courseDetails ?? {
    course: null,
    modules: [],
  };

  const course: CourseDetails = details.course ?? {
    course_code: "",
    course_title: "",
    description: "",
  };

  const stats: CourseQuickStats = courseStats ?? {
    modules: "0",
    quizzes: "0",
    exams: "0",
    submissions: "0",
    overall_grade: 0,
  };

  const progress: CourseProgress = courseProgress ?? {
    overall_progress: 0,
    components: {
      sections: { completed: 0, total: 0, percentage: 0 },
      activities: { completed: 0, total: 0, percentage: 0 },
      quizzes: { completed: 0, total: 0, percentage: 0 },
      exams: { completed: 0, total: 0, percentage: 0 },
    },
  };

  // Progress Ring Component
  const ProgressRing = ({ percentage }: { percentage: number }) => (
    <View className="relative items-center justify-center">
      <View className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center">
        <View className="w-28 h-28 rounded-full bg-white items-center justify-center">
          <Text className="text-3xl font-bold text-gray-800">
            {percentage}%
          </Text>
          <Text className="text-xs text-gray-500">Complete</Text>
        </View>
      </View>
      <View
        className="absolute w-32 h-32 rounded-full border-8"
        style={{
          borderTopColor: percentage > 0 ? "#EF4444" : "#E5E7EB",
          borderRightColor: percentage > 25 ? "#EF4444" : "#E5E7EB",
          borderBottomColor: percentage > 50 ? "#EF4444" : "#E5E7EB",
          borderLeftColor: percentage > 75 ? "#EF4444" : "#E5E7EB",
        }}
      />
    </View>
  );

  // Stat Card Component
  const StatCard = ({
    icon,
    label,
    value,
    bgColor = "#FEF2F2",
  }: {
    icon: string;
    label: string;
    value: string | number;
    bgColor?: string;
  }) => (
    <View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <View
        style={{ backgroundColor: bgColor }}
        className="w-10 h-10 rounded-lg items-center justify-center mb-2"
      >
        <MaterialIcons name={icon as any} size={20} color="#EF4444" />
      </View>
      <Text className="text-2xl font-bold text-gray-800">{value}</Text>
      <Text className="text-xs text-gray-500 mt-1">{label}</Text>
    </View>
  );

  // Progress Item Component
  const ProgressItem = ({
    icon,
    label,
    completed,
    total,
    percentage,
  }: {
    icon: string;
    label: string;
    completed: number;
    total: number;
    percentage: number;
  }) => (
    <View className="mb-4">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View className="w-8 h-8 bg-red-50 rounded-lg items-center justify-center mr-3">
            <MaterialIcons name={icon as any} size={16} color="#EF4444" />
          </View>
          <Text className="text-sm font-medium text-gray-700">{label}</Text>
        </View>
        <Text className="text-sm font-semibold text-gray-800">
          {completed}/{total}
        </Text>
      </View>
      <View className="flex-row items-center">
        <View className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden mr-3">
          <View
            className="h-full bg-red-500 rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </View>
        <Text className="text-xs text-gray-500 w-12 text-right">
          {percentage}%
        </Text>
      </View>
    </View>
  );

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
        {/* Header Section */}
        {loadingDetails ? (
          <View className="bg-red-500 px-6 pt-6 pb-8">
            <View
              style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
              className="rounded-2xl p-5"
            >
              <Skeleton
                height={24}
                width={100}
                style={{ marginBottom: 12 }}
                baseColor="rgba(255, 255, 255, 0.2)"
                highlightColor="rgba(255, 255, 255, 0.3)"
              />
              <Skeleton
                height={32}
                width="80%"
                style={{ marginBottom: 12 }}
                baseColor="rgba(255, 255, 255, 0.2)"
                highlightColor="rgba(255, 255, 255, 0.3)"
              />
              <Skeleton
                height={16}
                width="100%"
                style={{ marginBottom: 8 }}
                baseColor="rgba(255, 255, 255, 0.2)"
                highlightColor="rgba(255, 255, 255, 0.3)"
              />
              <Skeleton
                height={16}
                width="90%"
                baseColor="rgba(255, 255, 255, 0.2)"
                highlightColor="rgba(255, 255, 255, 0.3)"
              />
            </View>
          </View>
        ) : (
          <View className="bg-red-500 px-6 pt-6 pb-8">
            <View
              style={{ backgroundColor: "rgba(255, 255, 255, 0.15)" }}
              className="rounded-2xl p-5"
            >
              <View className="flex-row items-center mb-3">
                <View
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.25)" }}
                  className="px-3 py-1 rounded-full"
                >
                  <Text className="text-white text-xs font-semibold">
                    {course.course_code || "N/A"}
                  </Text>
                </View>
              </View>
              <Text className="text-2xl font-bold text-white mb-2">
                {course.course_title || "Course Title Unavailable"}
              </Text>
              <Text
                style={{ color: "rgba(255, 255, 255, 0.95)" }}
                className="text-sm leading-5"
              >
                {course.description || "No description available."}
              </Text>
            </View>
          </View>
        )}

        <View className="px-6 mt-6">
          {/* Overall Progress Card */}
          {loadingProgress ? (
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <Skeleton height={24} width={150} style={{ marginBottom: 16 }} />
              <View className="items-center mb-6">
                <Skeleton height={128} width={128} borderRadius={64} />
              </View>
              {Array.from({ length: 4 }).map((_, i) => (
                <View key={i} className="mb-4">
                  <Skeleton
                    height={14}
                    width="100%"
                    style={{ marginBottom: 8 }}
                  />
                  <Skeleton height={8} width="100%" />
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <Text className="text-lg font-bold text-gray-800 mb-4">
                Overall Progress
              </Text>

              <View className="items-center mb-6">
                <ProgressRing
                  percentage={Math.round(progress.overall_progress)}
                />
              </View>

              <View>
                <ProgressItem
                  icon="folder"
                  label="Sections"
                  completed={progress.components.sections.completed}
                  total={progress.components.sections.total}
                  percentage={Math.round(
                    progress.components.sections.percentage,
                  )}
                />
                <ProgressItem
                  icon="assignment"
                  label="Activities"
                  completed={progress.components.activities.completed}
                  total={progress.components.activities.total}
                  percentage={Math.round(
                    progress.components.activities.percentage,
                  )}
                />
                <ProgressItem
                  icon="quiz"
                  label="Quizzes"
                  completed={progress.components.quizzes.completed}
                  total={progress.components.quizzes.total}
                  percentage={Math.round(
                    progress.components.quizzes.percentage,
                  )}
                />
                <ProgressItem
                  icon="school"
                  label="Exams"
                  completed={progress.components.exams.completed}
                  total={progress.components.exams.total}
                  percentage={Math.round(progress.components.exams.percentage)}
                />
              </View>
            </View>
          )}

          {/* Course Statistics */}
          {loadingStats ? (
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <Skeleton height={24} width={150} style={{ marginBottom: 16 }} />
              <View className="flex-row gap-3 mb-3">
                <Skeleton height={100} width="48%" />
                <Skeleton height={100} width="48%" />
              </View>
              <View className="flex-row gap-3 mb-3">
                <Skeleton height={100} width="48%" />
                <Skeleton height={100} width="48%" />
              </View>
              <Skeleton height={100} width="100%" />
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <Text className="text-lg font-bold text-gray-800 mb-4">
                Course Statistics
              </Text>

              <View className="flex-row gap-3 mb-3">
                <StatCard
                  icon="library-books"
                  label="Modules"
                  value={stats.modules}
                  bgColor="#FEF2F2"
                />
                <StatCard
                  icon="quiz"
                  label="Quizzes"
                  value={stats.quizzes}
                  bgColor="#FAF5FF"
                />
              </View>

              <View className="flex-row gap-3 mb-3">
                <StatCard
                  icon="school"
                  label="Exams"
                  value={stats.exams}
                  bgColor="#EFF6FF"
                />
                <StatCard
                  icon="assignment-turned-in"
                  label="Submissions"
                  value={stats.submissions}
                  bgColor="#F0FDF4"
                />
              </View>

              {/* Overall Grade Highlight */}
              <View
                style={{ backgroundColor: "#FEF2F2" }}
                className="rounded-xl p-4 mt-3 border border-red-100"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 bg-red-500 rounded-full items-center justify-center mr-4">
                      <MaterialIcons name="star" size={24} color="white" />
                    </View>
                    <View>
                      <Text className="text-sm text-gray-600">
                        Overall Grade
                      </Text>
                      <Text className="text-3xl font-bold text-gray-800">
                        {stats.overall_grade}%
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      backgroundColor:
                        stats.overall_grade >= 90
                          ? "#D1FAE5"
                          : stats.overall_grade >= 75
                            ? "#DBEAFE"
                            : stats.overall_grade >= 60
                              ? "#FEF3C7"
                              : "#FEE2E2",
                    }}
                    className="px-4 py-2 rounded-full"
                  >
                    <Text
                      style={{
                        color:
                          stats.overall_grade >= 90
                            ? "#065F46"
                            : stats.overall_grade >= 75
                              ? "#1E40AF"
                              : stats.overall_grade >= 60
                                ? "#92400E"
                                : "#991B1B",
                      }}
                      className="text-xs font-semibold"
                    >
                      {stats.overall_grade >= 90
                        ? "Excellent"
                        : stats.overall_grade >= 75
                          ? "Good"
                          : stats.overall_grade >= 60
                            ? "Fair"
                            : "Needs Improvement"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Discussion Preview Card */}
          <Pressable
            onPress={() => setCommentsModalVisible(true)}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 active:bg-gray-50"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 bg-red-50 rounded-full items-center justify-center">
                  <Ionicons name="chatbubbles" size={24} color="#EF4444" />
                </View>
                <View>
                  <Text className="font-bold text-lg text-gray-800">
                    Discussion
                  </Text>
                  <Text className="text-sm text-gray-500 mt-0.5">
                    {commentsData?.total || 0} comment
                    {commentsData?.total !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm font-medium text-red-500">
                  View Discussion
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#EF4444" />
              </View>
            </View>

            {/* Preview of latest comments */}
            {commentsData && commentsData.comments.length > 0 && (
              <View className="mt-4 pt-4 border-t border-gray-100">
                <View className="flex-row items-start gap-3">
                  <View className="w-8 h-8 rounded-full bg-red-500 items-center justify-center">
                    <Text className="text-xs font-bold text-white">
                      {commentsData.comments[0].full_name
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-800">
                      {commentsData.comments[0].full_name}
                    </Text>
                    <Text
                      className="text-sm text-gray-600 mt-1"
                      numberOfLines={2}
                    >
                      {commentsData.comments[0].comment}
                    </Text>
                  </View>
                </View>
                {commentsData.total > 1 && (
                  <Text className="text-xs text-gray-400 mt-2">
                    + {commentsData.total - 1} more comment
                    {commentsData.total - 1 !== 1 ? "s" : ""}
                  </Text>
                )}
              </View>
            )}
          </Pressable>
        </View>

        {/* Bottom Spacing */}
        <View className="h-6" />
      </ScrollView>

      {/* Comments Modal */}
      {instance_id && (
        <CommentsModal
          visible={commentsModalVisible}
          onClose={() => {
            setCommentsModalVisible(false);
            refetchComments();
          }}
          instanceId={instance_id}
        />
      )}
    </SafeAreaView>
  );
}
