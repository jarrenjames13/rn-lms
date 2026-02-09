import { useAuth } from "@/context/authContext";
import { useCourseStore } from "@/store/useCourseStore";
import { Enrollment } from "@/types/api";
import { AntDesign, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import createEnrollmentsOptions from "../../api/QueryOptions/enrollmentsOptions";

export default function Index() {
  const router = useRouter();
  const { setCourseId, setInstanceId } = useCourseStore();
  const [isNavigating, setIsNavigating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { authState } = useAuth();

  const userId = authState?.user?.user_id ?? null;

  const {
    data,
    isLoading: isEnrollmentsLoading,
    error: enrollmentsError,
    refetch,
  } = useQuery({
    ...createEnrollmentsOptions(userId!),
    enabled: !!userId,
  });

  const enrollments: Enrollment[] = data?.enrollments ?? [];

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        refetch();
      }
    }, [userId, refetch]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isEnrollmentsLoading || authState?.isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#EF4444" />
        <Text className="mt-4 text-gray-600 text-base">
          Loading your courses...
        </Text>
      </View>
    );
  }

  if (enrollmentsError) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-6">
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={64}
          color="#EF4444"
        />
        <Text className="text-xl font-bold text-gray-800 mt-4">Oops!</Text>
        <Text className="text-base text-gray-600 text-center mt-2">
          We could not load your enrollments. Please try again.
        </Text>
        <Pressable
          className="mt-6 bg-red-500 px-6 py-3 rounded-full"
          onPress={() => refetch()}
        >
          <Text className="text-white font-semibold">Retry</Text>
        </Pressable>
      </View>
    );
  }

  const activeEnrollments = enrollments.filter((enrollment) => {
    const now = new Date();
    const startDate = new Date(enrollment.start_date);
    const endDate = new Date(enrollment.end_date);
    return now >= startDate && now <= endDate;
  });

  const completedEnrollments = enrollments.filter((enrollment) => {
    const now = new Date();
    const endDate = new Date(enrollment.end_date);
    return now > endDate;
  });

  const handlePress = async (course_id: number, instance_id: number) => {
    try {
      setIsNavigating(true);
      setCourseId(course_id);
      setInstanceId(instance_id);

      await router.replace({
        pathname: "/(course_tabs)/overview",
      });
    } catch (error) {
      console.log("Navigation error:", error);
      setIsNavigating(false);
    }
  };

  const CourseCard = ({
    enrollment,
    isCompleted = false,
  }: {
    enrollment: Enrollment;
    isCompleted?: boolean;
  }) => {
    const progressPercentage = isCompleted ? 100 : 65; // You can calculate actual progress here

    return (
      <Pressable
        className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100 overflow-hidden active:opacity-90"
        onPress={() => {
          if (!isNavigating) {
            handlePress(enrollment.course_id, enrollment.instance_id);
          }
        }}
      >
        {/* Status Badge */}
        <View className="absolute top-4 right-4 z-10">
          <View
            className={`px-3 py-1 rounded-full ${isCompleted ? "bg-green-100" : "bg-lavender-100"}`}
          >
            <Text
              className={`text-xs font-semibold ${isCompleted ? "text-green-700" : "text-purple-700"}`}
            >
              {isCompleted ? "Completed" : "In Progress"}
            </Text>
          </View>
        </View>

        {/* Color Accent Bar */}
        <View className={`h-2 ${isCompleted ? "bg-gray-300" : "bg-red-500"}`} />

        <View className="p-5">
          {/* Course Title */}
          <Text className="text-xl font-bold text-gray-900 mb-3 pr-24">
            {enrollment.course_title}
          </Text>

          {/* Course Info Grid */}
          <View className="space-y-3 mb-4">
            {/* Term */}
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-lavender-50 items-center justify-center mr-3">
                <Feather name="bookmark" size={16} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-0.5">Term</Text>
                <Text className="text-sm font-semibold text-gray-800">
                  {enrollment.term_code}
                </Text>
              </View>
            </View>

            {/* Duration */}
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-lavender-50 items-center justify-center mr-3">
                <Feather name="calendar" size={16} color="#8B5CF6" />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-0.5">Duration</Text>
                <Text className="text-sm font-medium text-gray-700">
                  {new Date(enrollment.start_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {" - "}
                  {new Date(enrollment.end_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress Bar (only for active courses) */}
          {!isCompleted && (
            <View className="mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs text-gray-500">Course Progress</Text>
                <Text className="text-xs font-semibold text-purple-600">
                  {progressPercentage}%
                </Text>
              </View>
              <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <View
                  className="h-full bg-gradient-to-r from-purple-500 to-red-500 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </View>
            </View>
          )}

          {/* Action Button */}
          <Pressable
            className={`flex-row items-center justify-center rounded-xl px-4 py-3.5 ${
              isCompleted ? "bg-gray-800" : "bg-red-500"
            } active:opacity-80`}
            onPress={() => {
              if (!isNavigating) {
                handlePress(enrollment.course_id, enrollment.instance_id);
              }
            }}
          >
            {isNavigating ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <AntDesign arrowright size={18} color="white" />
                <Text className="text-white text-base font-semibold ml-2">
                  {isCompleted ? "Review Course" : "Continue Learning"}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const EmptyState = ({ message }: { message: string }) => (
    <View className="items-center justify-center py-12 px-6">
      <View className="w-20 h-20 rounded-full bg-gray-50 items-center justify-center mb-4">
        <MaterialCommunityIcons
          name="book-open-outline"
          size={40}
          color="#9CA3AF"
        />
      </View>
      <Text className="text-gray-500 text-center text-base">{message}</Text>
    </View>
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#EF4444"]}
        />
      }
    >
      {/* Header Section */}
      <View className="bg-white pt-14 pb-8 px-6 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-2">
          <View>
            <Text className="text-sm text-gray-500 mb-1">Welcome back,</Text>
            <Text className="text-2xl font-bold text-gray-900">
              {authState?.user?.full_name || "Student"}!
            </Text>
          </View>
          <View className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-purple-600 items-center justify-center">
            <Text className="text-white text-lg font-bold">
              {authState?.user?.full_name?.charAt(0) || "S"}
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View className="flex-row mt-6 space-x-3">
          <View className="flex-1 bg-lavender-50 rounded-xl p-4">
            <Text className="text-2xl font-bold text-purple-700">
              {activeEnrollments.length}
            </Text>
            <Text className="text-xs text-purple-600 mt-1">Active Courses</Text>
          </View>
          <View className="flex-1 bg-gray-50 rounded-xl p-4">
            <Text className="text-2xl font-bold text-gray-800">
              {completedEnrollments.length}
            </Text>
            <Text className="text-xs text-gray-600 mt-1">Completed</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <View className="px-5 pb-6">
        {/* Active Courses Section */}
        {activeEnrollments.length > 0 && (
          <View className="mt-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">
                My Courses
              </Text>
              <View className="bg-red-500 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-semibold">
                  {activeEnrollments.length} Active
                </Text>
              </View>
            </View>
            {activeEnrollments.map((enrollment) => (
              <CourseCard
                key={enrollment.enrollment_id}
                enrollment={enrollment}
                isCompleted={false}
              />
            ))}
          </View>
        )}

        {activeEnrollments.length === 0 && (
          <View className="mt-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              My Courses
            </Text>
            <EmptyState message="No active courses at the moment. Check back soon for new enrollments!" />
          </View>
        )}

        {/* Completed Courses Section */}
        {(completedEnrollments.length > 0 || activeEnrollments.length > 0) && (
          <View className="mt-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-900">Completed</Text>
              {completedEnrollments.length > 0 && (
                <Text className="text-sm text-gray-500">
                  {completedEnrollments.length} course
                  {completedEnrollments.length !== 1 ? "s" : ""}
                </Text>
              )}
            </View>
            {completedEnrollments.length === 0 ? (
              <EmptyState message="Complete your first course to see it here!" />
            ) : (
              completedEnrollments.map((enrollment) => (
                <CourseCard
                  key={enrollment.enrollment_id}
                  enrollment={enrollment}
                  isCompleted={true}
                />
              ))
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
