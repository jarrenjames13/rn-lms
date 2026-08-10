import createStatsOptions from "@/api/QueryOptions/statsOptions";
import { AppHeader, AppScreen, StateView } from "@/components/ui";
import Skeleton from "@/components/skeletons/Skeleton";
import { useAppTheme } from "@/theme";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";

// Skeleton Components
const StatsSkeleton = () => (
  <View className="px-6 py-4">
    {/* Overall Progress Card Skeleton */}
    <View className="mb-6">
      <Skeleton
        height={12}
        width={100}
        style={{ marginBottom: 12, marginLeft: 4 }}
      />
      <View className="bg-[#F2ECF8] dark:bg-[#2A2038] rounded-2xl p-6 border border-[#E6E1E8] dark:border-[#37313C]">
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Skeleton height={14} width={120} style={{ marginBottom: 8 }} />
            <Skeleton height={40} width={80} />
          </View>
          <Skeleton height={64} width={64} borderRadius={32} />
        </View>
        <Skeleton
          height={12}
          width="100%"
          borderRadius={6}
          style={{ marginBottom: 12 }}
        />
        <Skeleton height={12} width="60%" style={{ alignSelf: "center" }} />
      </View>
    </View>

    {/* Components Progress Skeleton */}
    <View className="mb-6">
      <Skeleton
        height={12}
        width={130}
        style={{ marginBottom: 12, marginLeft: 4 }}
      />
      <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl overflow-hidden border border-[#E6E1E8] dark:border-[#37313C]">
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            className={`flex-row items-center p-4 ${
              i < 4
                ? "border-b border-[#E6E1E8] dark:border-[#37313C]"
                : ""
            }`}
          >
            <Skeleton
              height={48}
              width={48}
              borderRadius={12}
              style={{ marginRight: 16 }}
            />
            <View className="flex-1">
              <Skeleton height={14} width={60} style={{ marginBottom: 6 }} />
              <Skeleton height={24} width={40} />
            </View>
            <Skeleton height={40} width={40} borderRadius={20} />
          </View>
        ))}
      </View>
    </View>

    {/* Enrolled Courses Skeleton */}
    <View className="mb-6">
      <Skeleton
        height={12}
        width={80}
        style={{ marginBottom: 12, marginLeft: 4 }}
      />
      <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl p-6 border border-[#E6E1E8] dark:border-[#37313C]">
        <View className="flex-row items-center">
          <Skeleton
            height={56}
            width={56}
            borderRadius={16}
            style={{ marginRight: 16 }}
          />
          <View className="flex-1">
            <Skeleton height={14} width={100} style={{ marginBottom: 8 }} />
            <Skeleton height={32} width={50} style={{ marginBottom: 6 }} />
            <Skeleton height={12} width={120} />
          </View>
        </View>
      </View>
    </View>
  </View>
);

export default function Stats() {
  const { theme } = useAppTheme();
  const {
    data: stats,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery(createStatsOptions());
  const [refreshing, setRefreshing] = React.useState(false);

  // useFocusEffect(
  //   useCallback(() => {
  //     refetch();
  //   }, [refetch]),
  // );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing stats:", error);
    } finally {
      setRefreshing(false);
    }
  };
  // Show skeleton while loading OR fetching OR when stats is null initially
  const isLoadingStats = isLoading || isFetching || (!stats && !error);

  if (error) {
    return <AppScreen><StateView icon="cloud-offline-outline" title="Statistics unavailable" message="Your learning summary could not be loaded. Please try again." actionLabel="Try again" onAction={() => void refetch()} /></AppScreen>;
  }

  return (
    <AppScreen>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Header */}
        {isLoadingStats ? (
          <View className="px-6 pt-6 pb-8 bg-[#FFFFFF] dark:bg-[#1A181E]">
            <View className="flex-row items-center mb-2">
              <Skeleton
                height={48}
                width={48}
                borderRadius={24}
                style={{ marginRight: 16 }}
              />
              <View>
                <Skeleton height={32} width={150} style={{ marginBottom: 8 }} />
                <Skeleton height={14} width={180} />
              </View>
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20, paddingTop: 18 }}><AppHeader eyebrow="LEARNING SUMMARY" title="Statistics" subtitle="Track your learning journey." /></View>
        )}

        {isLoadingStats ? (
          <StatsSkeleton />
        ) : stats ? (
          <View className="px-6 py-4">
            {/* Overall Progress Card */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-[#6C6572] dark:text-[#BEB6C5] uppercase tracking-wide mb-3 px-1">
                Your Progress
              </Text>

              <View className="bg-[#F2ECF8] dark:bg-[#2A2038] rounded-2xl p-6 border border-[#E6E1E8] dark:border-[#37313C] shadow-sm">
                <View className="flex-row items-center justify-between mb-4">
                  <View>
                    <Text className="text-sm font-medium text-[#6C6572] dark:text-[#BEB6C5] mb-1">
                      Overall Completion
                    </Text>
                    <Text className="text-4xl font-bold text-[#201D25] dark:text-[#F7F4FA]">
                      {stats.overall_progress}%
                    </Text>
                  </View>
                  <View className="w-16 h-16 bg-[#FFFFFF] dark:bg-[#1A181E] rounded-full items-center justify-center shadow-md">
                    <MaterialCommunityIcons
                      name={
                        stats.overall_progress === 100 ? "trophy" : "chart-arc"
                      }
                      size={32}
                      color={
                        stats.overall_progress === 100
                          ? theme.school
                          : theme.primary
                      }
                    />
                  </View>
                </View>

                {/* Progress Bar */}
                <View className="w-full h-3 bg-[#FFFFFF]/60 dark:bg-[#1A181E]/60 rounded-full overflow-hidden shadow-inner">
                  <View
                    className="h-full bg-[#B42335] dark:bg-[#F06A78] rounded-full shadow-sm"
                    style={{ width: `${stats.overall_progress}%` }}
                  />
                </View>

                <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] mt-3 text-center">
                  {stats.overall_progress === 100
                    ? "🎉 Amazing! You've completed everything!"
                    : `Keep going! ${100 - stats.overall_progress}% remaining`}
                </Text>
              </View>
            </View>

            {/* Components Progress */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-[#6C6572] dark:text-[#BEB6C5] uppercase tracking-wide mb-3 px-1">
                Learning Components
              </Text>

              <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl overflow-hidden border border-[#E6E1E8] dark:border-[#37313C] shadow-sm">
                {/* Sections */}
                <View className="flex-row items-center p-4 border-b border-[#E6E1E8] dark:border-[#37313C]">
                  <View className="w-12 h-12 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-xl items-center justify-center mr-4">
                    <MaterialCommunityIcons
                      name="book-open-variant"
                      size={24}
                      color={theme.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-[#6C6572] dark:text-[#BEB6C5]">
                      Sections
                    </Text>
                    <Text className="text-xl font-bold text-[#201D25] dark:text-[#F7F4FA]">
                      {stats.counts.sections}
                    </Text>
                  </View>
                  <View className="w-10 h-10 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-full items-center justify-center">
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  </View>
                </View>

                {/* Activities */}
                <View className="flex-row items-center p-4 border-b border-[#E6E1E8] dark:border-[#37313C]">
                  <View className="w-12 h-12 bg-[#FCECEF] dark:bg-[#3A2025] rounded-xl items-center justify-center mr-4">
                    <MaterialCommunityIcons
                      name="puzzle"
                      size={24}
                      color={theme.school}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-[#6C6572] dark:text-[#BEB6C5]">
                      Activities
                    </Text>
                    <Text className="text-xl font-bold text-[#201D25] dark:text-[#F7F4FA]">
                      {stats.counts.activities}
                    </Text>
                  </View>
                  <View className="w-10 h-10 bg-[#FCECEF] dark:bg-[#3A2025] rounded-full items-center justify-center">
                    <Ionicons name="checkmark" size={20} color={theme.school} />
                  </View>
                </View>

                {/* Quizzes */}
                <View className="flex-row items-center p-4 border-b border-[#E6E1E8] dark:border-[#37313C]">
                  <View className="w-12 h-12 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-xl items-center justify-center mr-4">
                    <MaterialCommunityIcons
                      name="clipboard-text"
                      size={24}
                      color={theme.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-[#6C6572] dark:text-[#BEB6C5]">
                      Quizzes
                    </Text>
                    <Text className="text-xl font-bold text-[#201D25] dark:text-[#F7F4FA]">
                      {stats.counts.quizzes}
                    </Text>
                  </View>
                  <View className="w-10 h-10 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-full items-center justify-center">
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  </View>
                </View>

                {/* Exams */}
                <View className="flex-row items-center p-4">
                  <View className="w-12 h-12 bg-[#FCECEF] dark:bg-[#3A2025] rounded-xl items-center justify-center mr-4">
                    <FontAwesome5
                      name="certificate"
                      size={20}
                      color={theme.school}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-[#6C6572] dark:text-[#BEB6C5]">
                      Exams
                    </Text>
                    <Text className="text-xl font-bold text-[#201D25] dark:text-[#F7F4FA]">
                      {stats.counts.exams}
                    </Text>
                  </View>
                  <View className="w-10 h-10 bg-[#FCECEF] dark:bg-[#3A2025] rounded-full items-center justify-center">
                    <Ionicons name="checkmark" size={20} color={theme.school} />
                  </View>
                </View>
              </View>
            </View>

            {/* Enrolled Courses */}
            <View className="mb-6">
              <Text className="text-xs font-semibold text-[#6C6572] dark:text-[#BEB6C5] uppercase tracking-wide mb-3 px-1">
                Enrollment
              </Text>

              <View className="bg-[#FFFFFF] dark:bg-[#1A181E] rounded-2xl p-6 border border-[#E6E1E8] dark:border-[#37313C] shadow-sm">
                <View className="flex-row items-center">
                  <View className="w-14 h-14 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-2xl items-center justify-center mr-4">
                    <MaterialCommunityIcons
                      name="school"
                      size={28}
                      color={theme.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-[#6C6572] dark:text-[#BEB6C5] mb-1">
                      Active Courses
                    </Text>
                    <Text className="text-3xl font-bold text-[#201D25] dark:text-[#F7F4FA]">
                      {stats.enrolled_courses}
                    </Text>
                    <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5] mt-1">
                      {stats.enrolled_courses === 1 ? "course" : "courses"} in
                      progress
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View className="items-center py-6">
              <View className="flex-row items-center">
                <View className="w-1.5 h-1.5 bg-[#6842A0] dark:bg-[#A98ADC] rounded-full mr-2" />
                <Text className="text-xs text-[#6C6572] dark:text-[#BEB6C5]">
                  Last updated: {new Date().toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="flex-1 justify-center items-center px-6 py-12">
            <View className="w-20 h-20 bg-[#F2ECF8] dark:bg-[#2A2038] rounded-full items-center justify-center mb-4">
              <MaterialCommunityIcons
                name="chart-box-outline"
                size={40}
                color={theme.textMuted}
              />
            </View>
            <Text className="text-lg font-bold text-[#201D25] dark:text-[#F7F4FA] mb-2">
              No Stats Available
            </Text>
            <Text className="text-[#6C6572] dark:text-[#BEB6C5] text-center">
              Start learning to see your progress here
            </Text>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}
