import createCourseStatsOptions from "@/api/QueryOptions/courseStatsOptions";
import { useCourseStore } from "@/store/useCourseStore";
import { CourseAllDetails, CourseDetails, CourseQuickStats } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import createCourseDetailsOptions from "../../api/QueryOptions/courseDetailsOptions";
export default function Overview() {
  const { course_id, instance_id } = useCourseStore();

  const {
    data: courseDetails,
    isLoading: loadingDetails,
    error: detailsError,
    refetch,
  } = useQuery({
    ...createCourseDetailsOptions(course_id!),
    enabled: !!course_id,
  });

  useFocusEffect(
    useCallback(() => {
      if (course_id) {
        refetch();
      }
    }, [course_id, refetch])
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
    }, [course_id, refetchStats])
  );

  if (loadingDetails || loadingStats) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  if (detailsError || statsError) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-base text-red-500">
          Error fetching course details.
        </Text>
      </View>
    );
  }
  const details: CourseAllDetails = courseDetails ?? {
    course: null,
    modules: [],
  };
  const modules = details.modules ?? [];

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
  return (
    <SafeAreaView className="flex-1 justify-center items-center">
      <ScrollView className="w-full px-4">
        <View
          key={course.course_code}
          className="px-4 py-8 bg-white rounded-lg shadow-md "
        >
          <Text className="text-3xl font-bold text-gray-800 mb-4">
            {course.course_title || "Course Title Unavailable"}
          </Text>
          <View className="border-t border-gray-300 my-4" />
          <Text className="text-lg text-gray-600 text-justify">
            {course.description || "No description available."}
          </Text>
        </View>

        <View className="mt-6 px-4 py-6 bg-white rounded-lg shadow-md mb-4">
          <Text className="text-2xl font-bold text-gray-800 mb-4">
            Course Statistics
          </Text>
          <View className="border-t border-gray-300 my-4" />
          <Text className="text-lg text-white  mb-2">
            Modules: {stats.modules}
          </Text>
          <Text className="text-lg text-gray-600 mb-2">
            Quizzes: {stats.quizzes}
          </Text>
          <Text className="text-lg text-gray-600 mb-2">
            Exams: {stats.exams}
          </Text>
          <Text className="text-lg text-gray-600 mb-2">
            Submissions: {stats.submissions}
          </Text>
          <Text className="text-lg text-gray-600 mb-2">
            Overall Grade: {stats.overall_grade}%
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
