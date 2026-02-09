import createStatsOptions from "@/api/QueryOptions/statsOptions";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Stats() {
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useQuery({ ...createStatsOptions(), enabled: false });

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#DC2626" />
        <Text className="text-gray-500 mt-4">Loading your progress...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
          <Ionicons name="alert-circle" size={40} color="#DC2626" />
        </View>
        <Text className="text-lg font-bold text-gray-900 mb-2">
          Unable to Load Stats
        </Text>
        <Text className="text-red-600 text-center">{error.message}</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 px-6">
        <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
          <MaterialCommunityIcons
            name="chart-box-outline"
            size={40}
            color="#9CA3AF"
          />
        </View>
        <Text className="text-lg font-bold text-gray-900 mb-2">
          No Stats Available
        </Text>
        <Text className="text-gray-500 text-center">
          Start learning to see your progress here
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-6 pt-6 pb-8 bg-white">
          <View className="flex-row items-center mb-2">
            <View className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full items-center justify-center mr-4 shadow-lg">
              <MaterialCommunityIcons
                name="chart-line"
                size={24}
                color="#FFFFFF"
              />
            </View>
            <View>
              <Text className="text-3xl font-bold text-gray-900">
                Statistics
              </Text>
              <Text className="text-sm text-gray-500 mt-1">
                Track your learning journey
              </Text>
            </View>
          </View>
        </View>

        <View className="px-6 py-4">
          {/* Overall Progress Card */}
          <View className="mb-6">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              Your Progress
            </Text>

            <View className="bg-gradient-to-br from-purple-50 to-red-50 rounded-2xl p-6 border border-purple-100 shadow-sm">
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-sm font-medium text-gray-600 mb-1">
                    Overall Completion
                  </Text>
                  <Text className="text-4xl font-bold text-gray-900">
                    {stats.overall_progress}%
                  </Text>
                </View>
                <View className="w-16 h-16 bg-white rounded-full items-center justify-center shadow-md">
                  <MaterialCommunityIcons
                    name={
                      stats.overall_progress === 100 ? "trophy" : "chart-arc"
                    }
                    size={32}
                    color={
                      stats.overall_progress === 100 ? "#DC2626" : "#9333EA"
                    }
                  />
                </View>
              </View>

              {/* Progress Bar */}
              <View className="w-full h-3 bg-white/60 rounded-full overflow-hidden shadow-inner">
                <View
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-sm"
                  style={{ width: `${stats.overall_progress}%` }}
                />
              </View>

              <Text className="text-xs text-gray-600 mt-3 text-center">
                {stats.overall_progress === 100
                  ? "🎉 Amazing! You've completed everything!"
                  : `Keep going! ${100 - stats.overall_progress}% remaining`}
              </Text>
            </View>
          </View>

          {/* Components Progress */}
          <View className="mb-6">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              Learning Components
            </Text>

            <View className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              {/* Sections */}
              <View className="flex-row items-center p-4 border-b border-gray-100">
                <View className="w-12 h-12 bg-purple-100 rounded-xl items-center justify-center mr-4">
                  <MaterialCommunityIcons
                    name="book-open-variant"
                    size={24}
                    color="#9333EA"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500">
                    Sections
                  </Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats.counts.sections}
                  </Text>
                </View>
                <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center">
                  <Ionicons name="checkmark" size={20} color="#9333EA" />
                </View>
              </View>

              {/* Activities */}
              <View className="flex-row items-center p-4 border-b border-gray-100">
                <View className="w-12 h-12 bg-red-100 rounded-xl items-center justify-center mr-4">
                  <MaterialCommunityIcons
                    name="puzzle"
                    size={24}
                    color="#DC2626"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500">
                    Activities
                  </Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats.counts.activities}
                  </Text>
                </View>
                <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center">
                  <Ionicons name="checkmark" size={20} color="#DC2626" />
                </View>
              </View>

              {/* Quizzes */}
              <View className="flex-row items-center p-4 border-b border-gray-100">
                <View className="w-12 h-12 bg-purple-100 rounded-xl items-center justify-center mr-4">
                  <MaterialCommunityIcons
                    name="clipboard-text"
                    size={24}
                    color="#9333EA"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500">
                    Quizzes
                  </Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats.counts.quizzes}
                  </Text>
                </View>
                <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center">
                  <Ionicons name="checkmark" size={20} color="#9333EA" />
                </View>
              </View>

              {/* Exams */}
              <View className="flex-row items-center p-4">
                <View className="w-12 h-12 bg-red-100 rounded-xl items-center justify-center mr-4">
                  <FontAwesome5 name="certificate" size={20} color="#DC2626" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500">
                    Exams
                  </Text>
                  <Text className="text-xl font-bold text-gray-900">
                    {stats.counts.exams}
                  </Text>
                </View>
                <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center">
                  <Ionicons name="checkmark" size={20} color="#DC2626" />
                </View>
              </View>
            </View>
          </View>

          {/* Enrolled Courses */}
          <View className="mb-6">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
              Enrollment
            </Text>

            <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <View className="flex-row items-center">
                <View className="w-14 h-14 bg-gradient-to-br from-purple-100 to-red-100 rounded-2xl items-center justify-center mr-4">
                  <MaterialCommunityIcons
                    name="school"
                    size={28}
                    color="#9333EA"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-500 mb-1">
                    Active Courses
                  </Text>
                  <Text className="text-3xl font-bold text-gray-900">
                    {stats.enrolled_courses}
                  </Text>
                  <Text className="text-xs text-gray-400 mt-1">
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
              <View className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2" />
              <Text className="text-xs text-gray-400">
                Last updated: {new Date().toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
