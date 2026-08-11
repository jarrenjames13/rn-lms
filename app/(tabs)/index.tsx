import Skeleton from "@/components/skeletons/Skeleton";
import { createNotificationsOptions } from "@/api/QueryOptions/notificationsOptions";
import { AppScreen, StateView } from "@/components/ui";
import { useAuth } from "@/context/authContext";
import { useCourseStore } from "@/store/useCourseStore";
import { useAppTheme } from "@/theme";
import { Enrollment } from "@/types/api";
import { AntDesign, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import createEnrollmentsOptions from "../../api/QueryOptions/enrollmentsOptions";

// Skeleton Components
const CourseCardSkeleton = () => (
  <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl mb-4 shadow-sm border border-[#E6E1E8] dark:border-[#37313C] overflow-hidden">
    {/* Color Accent Bar */}
    <View className="h-2 bg-[#F2ECF8] dark:bg-[#2A2038]" />

    <View className="p-5">
      {/* Title */}
      <Skeleton height={24} width="80%" style={{ marginBottom: 12 }} />

      {/* Info Grid */}
      <View className="space-y-3 mb-4">
        <View className="flex-row items-center">
          <Skeleton
            height={32}
            width={32}
            borderRadius={16}
            style={{ marginRight: 12 }}
          />
          <View className="flex-1">
            <Skeleton height={12} width={40} style={{ marginBottom: 4 }} />
            <Skeleton height={16} width={100} />
          </View>
        </View>

        <View className="flex-row items-center">
          <Skeleton
            height={32}
            width={32}
            borderRadius={16}
            style={{ marginRight: 12 }}
          />
          <View className="flex-1">
            <Skeleton height={12} width={60} style={{ marginBottom: 4 }} />
            <Skeleton height={16} width="80%" />
          </View>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mb-4">
        <Skeleton height={12} width="40%" style={{ marginBottom: 8 }} />
        <Skeleton height={8} width="100%" borderRadius={4} />
      </View>

      {/* Button */}
      <Skeleton height={48} width="100%" borderRadius={12} />
    </View>
  </View>
);

export default function Index() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const { selectCourse } = useCourseStore();
  const [isNavigating, setIsNavigating] = useState(false);
  const navigationLockRef = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const { authState } = useAuth();

  const userId = authState?.user?.user_id ?? null;

  useFocusEffect(
    useCallback(() => {
      setIsNavigating(false);
      navigationLockRef.current = false;
    }, []),
  );

  const {
    data,
    isLoading: isEnrollmentsLoading,
    error: enrollmentsError,
    refetch,
  } = useQuery({
    ...createEnrollmentsOptions(userId!),
    enabled: !!userId,
  });
  const { data: notificationData } = useQuery({
    ...createNotificationsOptions(),
    enabled: !!userId,
  });
  const unreadNotificationCount = notificationData?.unread_count ?? 0;

  const enrollments: Enrollment[] = data ?? [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (enrollmentsError) {
    return <AppScreen><StateView icon="cloud-offline-outline" title="Courses unavailable" message="Your enrollments could not be loaded. Please try again." actionLabel="Try again" onAction={() => void refetch()} /></AppScreen>;
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
    if (navigationLockRef.current) return;
    navigationLockRef.current = true;
    try {
      setIsNavigating(true);
      selectCourse(course_id, instance_id);

      router.push({
        pathname: "/(course_tabs)/overview",
      });
    } catch (error) {
      console.log("Navigation error:", error);
      setIsNavigating(false);
      navigationLockRef.current = false;
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
        className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl mb-4 shadow-sm border border-[#E6E1E8] dark:border-[#37313C] overflow-hidden active:opacity-90"
        onPress={() => {
          if (!isNavigating) {
            handlePress(enrollment.course_id, enrollment.instance_id);
          }
        }}
      >
        {/* Status Badge */}
        <View className="absolute top-4 right-4 z-10">
          <View className="px-3 py-1 rounded-full bg-[#F2ECF8] dark:bg-[#2A2038]">
            <Text
              className={`text-xs font-semibold ${
                isCompleted
                  ? "text-[#167A50] dark:text-[#58C99A]"
                  : "text-[#6842A0] dark:text-[#A98ADC]"
              }`}
            >
              {isCompleted ? "Completed" : "In Progress"}
            </Text>
          </View>
        </View>

        {/* Color Accent Bar */}
        <View
          className={`h-2 ${
            isCompleted
              ? "bg-[#E6E1E8] dark:bg-[#37313C]"
              : "bg-[#B42335] dark:bg-[#F06A78]"
          }`}
        />

        <View className="p-5">
          {/* Course Title */}
          <Text className="text-xl font-bold text-[#201D25] dark:text-[#F7F4FA] mb-3 pr-24">
            {enrollment.course_title}
          </Text>

          {/* Course Info Grid */}
          <View className="space-y-3 mb-4">
            {/* Term */}
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-[#F2ECF8] dark:bg-[#2A2038] items-center justify-center mr-3">
                <Feather name="bookmark" size={16} color={theme.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] mb-0.5">Term</Text>
                <Text className="text-sm font-semibold text-[#201D25] dark:text-[#F7F4FA]">
                  {enrollment.term_code}
                </Text>
              </View>
            </View>

            {/* Duration */}
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-[#F2ECF8] dark:bg-[#2A2038] items-center justify-center mr-3">
                <Feather name="calendar" size={16} color={theme.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] mb-0.5">Duration</Text>
                <Text className="text-sm font-medium text-[#201D25] dark:text-[#F7F4FA]">
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
                <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5]">Course Progress</Text>
                <Text className="text-xs font-semibold text-[#6842A0] dark:text-[#A98ADC]">
                  {progressPercentage}%
                </Text>
              </View>
              <View className="h-2 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-full overflow-hidden">
                <View
                  className="h-full bg-[#6842A0] dark:bg-[#A98ADC] rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </View>
            </View>
          )}

          {/* Action Button */}
          <Pressable
            className={`flex-row items-center justify-center rounded-xl px-4 py-3.5 ${
              isCompleted
                ? "bg-[#6842A0] dark:bg-[#A98ADC]"
                : "bg-[#B42335] dark:bg-[#F06A78]"
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
                <AntDesign name="arrow-right" size={18} color="white" />
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
      <View className="w-20 h-20 rounded-full bg-[#F2ECF8] dark:bg-[#2A2038] items-center justify-center mb-4">
        <MaterialCommunityIcons
          name="book-open-outline"
          size={40}
          color={theme.textMuted}
        />
      </View>
      <Text className="text-[#6C6572] dark:text-[#BEB6C5] text-center text-base">{message}</Text>
    </View>
  );

  return (
    <AppScreen>
      <ScrollView
        className="flex-1 bg-[#F7F7FA] dark:bg-[#111014]"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.danger]}
            tintColor={theme.danger}
          />
        }
      >
        {/* Header Section */}
        {isEnrollmentsLoading || authState?.isLoading ? (
          <View className="bg-[#FFFFFF] dark:bg-[#1A181E] pt-6 pb-8 px-6 border-b border-[#E6E1E8] dark:border-[#37313C]">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-1">
                <Skeleton height={14} width={100} style={{ marginBottom: 8 }} />
                <Skeleton height={28} width="60%" />
              </View>
              <View className="flex-row items-center gap-3">
                <Skeleton height={42} width={42} borderRadius={21} />
                <Skeleton height={48} width={48} borderRadius={24} />
              </View>
            </View>

            {/* Stats Cards Skeleton */}
            <View className="flex-row mt-6 space-x-3">
              <View className="flex-1">
                <Skeleton height={80} width="100%" borderRadius={12} />
              </View>
              <View className="flex-1">
                <Skeleton height={80} width="100%" borderRadius={12} />
              </View>
            </View>
          </View>
        ) : (
          <View className="bg-[#FFFFFF] dark:bg-[#1A181E] pt-6 pb-8 px-6 border-b border-[#E6E1E8] dark:border-[#37313C]">
            <View className="flex-row items-center justify-between mb-2">
              <View>
                <Text className="text-sm text-[#6C6572] dark:text-[#BEB6C5] mb-1">
                  Welcome back,
                </Text>
                <Text className="text-2xl font-bold text-[#201D25] dark:text-[#F7F4FA]">
                  {authState?.user?.full_name || "Student"}!
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={unreadNotificationCount > 0
                    ? `Open notifications, ${unreadNotificationCount} unread`
                    : "Open notifications"}
                  onPress={() => router.push("/(tabs)/notifications")}
                  className="w-11 h-11 rounded-full bg-[#F2ECF8] dark:bg-[#2A2038] items-center justify-center border border-[#E6E1E8] dark:border-[#37313C]"
                >
                  <Feather name="bell" size={20} color={theme.primary} />
                  {unreadNotificationCount > 0 ? (
                    <View
                      className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full items-center justify-center border-2"
                      style={{ backgroundColor: theme.school, borderColor: theme.surface }}
                    >
                      <Text className="text-[10px] leading-3 font-extrabold" style={{ color: "#FFFFFF" }}>
                        {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
                <View className="w-12 h-12 rounded-full bg-[#6842A0] dark:bg-[#A98ADC] items-center justify-center">
                  <Text className="text-white text-lg font-bold">
                    {authState?.user?.full_name?.charAt(0) || "S"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stats Cards */}
            <View className="flex-row mt-6 space-x-3">
              <View className="flex-1 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-xl p-4">
                <Text className="text-2xl font-bold text-[#6842A0] dark:text-[#A98ADC]">
                  {activeEnrollments.length}
                </Text>
                <Text className="text-xs text-[#6842A0] dark:text-[#A98ADC] mt-1">
                  Active Courses
                </Text>
              </View>
              <View className="flex-1 bg-[#F7F7FA] dark:bg-[#111014] rounded-xl p-4">
                <Text className="text-2xl font-bold text-[#201D25] dark:text-[#F7F4FA]">
                  {completedEnrollments.length}
                </Text>
                <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] mt-1">Completed</Text>
              </View>
            </View>
          </View>
        )}

        {/* Main Content */}
        <View className="px-5 pb-6">
          {/* Active Courses Section */}
          {isEnrollmentsLoading || authState?.isLoading ? (
            <View className="mt-6">
              <View className="flex-row items-center justify-between mb-4">
                <Skeleton height={24} width={120} />
                <Skeleton height={24} width={80} borderRadius={12} />
              </View>
              <CourseCardSkeleton />
              <CourseCardSkeleton />
            </View>
          ) : (
            <>
              {activeEnrollments.length > 0 && (
                <View className="mt-6">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-xl font-bold text-[#201D25] dark:text-[#F7F4FA]">
                      My Courses
                    </Text>
                    <View className="bg-[#B42335] dark:bg-[#F06A78] px-3 py-1 rounded-full">
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
                  <Text className="text-xl font-bold text-[#201D25] dark:text-[#F7F4FA] mb-4">
                    My Courses
                  </Text>
                  <EmptyState message="No active courses at the moment. Check back soon for new enrollments!" />
                </View>
              )}

              {/* Completed Courses Section */}
              {(completedEnrollments.length > 0 ||
                activeEnrollments.length > 0) && (
                <View className="mt-8">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-xl font-bold text-[#201D25] dark:text-[#F7F4FA]">
                      Completed
                    </Text>
                    {completedEnrollments.length > 0 && (
                      <Text className="text-sm text-[#6C6572] dark:text-[#BEB6C5]">
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
            </>
          )}
        </View>
      </ScrollView>
      {isNavigating && (
        <View
          className="absolute inset-0 items-center justify-center px-8"
          style={{ backgroundColor: "rgba(45, 38, 51, 0.45)" }}
        >
          <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-3xl px-8 py-7 items-center shadow-lg">
            <ActivityIndicator size="large" color={theme.primary} />
            <Text className="text-base font-bold text-[#201D25] dark:text-[#F7F4FA] mt-4">Opening course</Text>
            <Text className="text-sm text-[#6C6572] dark:text-[#BEB6C5] text-center mt-1">Preparing your learning space...</Text>
          </View>
        </View>
      )}
    </AppScreen>
  );
}
