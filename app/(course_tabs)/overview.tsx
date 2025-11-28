import { useCourseStore } from "@/store/useCourseStore";
import { CourseAllDetails, CourseDetails } from "@/types/api";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import React, { useCallback } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import createCourseDetailsOptions from "../../api/QueryOptions/courseDetailsOptions";
export default function Overview() {
  const { course_id, instance_id } = useCourseStore();
  console.log("Overview - course_id:", course_id, "instance_id:", instance_id);
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

  if (loadingDetails) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  if (detailsError) {
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
  return (
    <SafeAreaView className="flex-1 justify-center items-center">
      <ScrollView className="w-full px-4 py-6">
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
      </ScrollView>
    </SafeAreaView>
  );
}
