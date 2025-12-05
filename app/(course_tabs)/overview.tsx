import createCourseProgressOptions from "@/api/QueryOptions/courseProgressOptions";
import createCourseStatsOptions from "@/api/QueryOptions/courseStatsOptions";
import { useCourseStore } from "@/store/useCourseStore";
import { useModuleStore } from "@/store/useModuleStore";
import {
  CourseAllDetails,
  CourseDetails,
  CourseProgress,
  CourseQuickStats,
} from "@/types/api";
import { AntDesign } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import createCourseDetailsOptions from "../../api/QueryOptions/courseDetailsOptions";
export default function Overview() {
  const { course_id } = useCourseStore();
  const { setModuleData } = useModuleStore();

  const {
    data: courseDetails,
    isLoading: loadingDetails,
    error: detailsError,
    refetch,
  } = useQuery({
    ...createCourseDetailsOptions(course_id!),
    enabled: !!course_id,
  });

  // console.log("Fetched Course Details in Overview:", courseDetails);

  useFocusEffect(
    useCallback(() => {
      if (course_id) {
        refetch();
        setModuleData(courseDetails?.modules || []);
      }
    }, [course_id, refetch, courseDetails?.modules, setModuleData])
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
    }, [course_id, refetchProgress])
  );

  if (loadingDetails || loadingStats || loadingProgress) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  if (detailsError || statsError || progressError) {
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
  // console.log("Course Progress:", progress);

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
          <View className="mt-2">
            <View className="border-t border-gray-300 my-4" />
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Overall Progress
            </Text>

            <View className="w-full h-4 bg-gray-300 rounded-full overflow-hidden">
              <View
                className="w-full h-full bg-red-500 rounded-full"
                style={{ width: `${progress.overall_progress}%` }}
              ></View>
            </View>
            <Text className="text-sm text-gray-600 mt-2">
              {progress.overall_progress}% completed
            </Text>
            <Text className="text-sm text-gray-600 mt-3">
              Sections Completed: {progress.components.sections.completed} /{" "}
              {progress.components.sections.total} (
              {progress.components.sections.percentage}%)
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              Activities Completed: {progress.components.activities.completed} /{" "}
              {progress.components.activities.total} (
              {progress.components.activities.percentage}%)
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              Quizzes Completed: {progress.components.quizzes.completed} /{" "}
              {progress.components.quizzes.total} (
              {progress.components.quizzes.percentage}%)
            </Text>
            <Text className="text-sm text-gray-600 mt-1">
              Exams Completed: {progress.components.exams.completed} /{" "}
              {progress.components.exams.total} (
              {progress.components.exams.percentage}%)
            </Text>
          </View>
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
        <View className="mt-6 px-4 py-6 bg-white rounded-lg shadow-md mb-4">
          <Text className="font-bold text-2xl">Comment Section</Text>
          <View className="border-t border-gray-300 py-4 mt-8">
            <TextInput
              placeholder="Share your thoughts..."
              className="w-full border border-gray-300 rounded-lg px-2 py-3"
            ></TextInput>
            <View className="w-full flex flex-row-reverse px-2 gap-1">
              <Pressable className="bg-red-500 active:bg-red-600 rounded-xl py-3 px-6 items-center mt-4 w-18">
                <AntDesign name="send" size={18} color="white" />
              </Pressable>
              <Pressable className="bg-white-500 active:bg-gray-100 border border-gray-100 rounded-xl py-3 px-3 items-center mt-4 w-18">
                <AntDesign name="file-image" size={18} color="black" />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
