import createListQuizzesOptions from "@/api/QueryOptions/listQuizzesOptions";
import { useCourseStore } from "@/store/useCourseStore";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Quiz() {
  const { course_id } = useCourseStore();
  const {
    data: quizzesData,
    isLoading: quizzesLoading,
    refetch,
  } = useQuery(createListQuizzesOptions(course_id!));
  const renderQuizzes = () => {};

  return (
    <SafeAreaView>
      <ScrollView className="flex-1">
        <View className="flex bg-gray-300 p-4">
          <Text className="text-lg font-bold">Quiz Screen</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
